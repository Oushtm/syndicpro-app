
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { useAuth } from './AuthContext';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
    const { user } = useAuth();

    // Shared Data State
    const [apartments, setApartments] = useState([]);
    const [payments, setPayments] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [appSettings, setAppSettings] = useState({ buildingName: 'SyndicPro', default_monthly_fee: 200 });
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // Sync Status (Legacy support: Supabase writes are instant or fail)
    const [hasPendingWrites, setHasPendingWrites] = useState(false);

    // Loading States
    const [loadingApartments, setLoadingApartments] = useState(true);
    const [loadingPayments, setLoadingPayments] = useState(true);
    const [loadingExpenses, setLoadingExpenses] = useState(true);
    const [loadingAppSettings, setLoadingAppSettings] = useState(true);

    // Errors
    const [error, setError] = useState(null);

    // Fetchers
    const fetchApartments = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('apartments')
                .select('*')
                .order('floor', { ascending: true })
                .order('number', { ascending: true });
            if (error) throw error;
            setApartments(data || []);
        } catch (err) {
            console.error("Error fetching apartments:", err);
            setError(err);
        } finally {
            setLoadingApartments(false);
        }
    }, []);

    const fetchPayments = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('payments')
                .select('*')
                .eq('year', parseInt(selectedYear));
            if (error) throw error;
            setPayments(data || []);
        } catch (err) {
            console.error("Error fetching payments:", err);
            setError(err);
        } finally {
            setLoadingPayments(false);
        }
    }, [selectedYear]);

    const fetchExpenses = useCallback(async () => {
        try {
            const startOfYear = new Date(selectedYear, 0, 1).toISOString();
            const endOfYear = new Date(selectedYear, 11, 31, 23, 59, 59).toISOString();

            const { data, error } = await supabase
                .from('expenses')
                .select('*')
                .gte('date', startOfYear)
                .lte('date', endOfYear)
                .order('date', { ascending: false });
            if (error) throw error;
            setExpenses(data || []);
        } catch (err) {
            console.error("Error fetching expenses:", err);
            setError(err);
        } finally {
            setLoadingExpenses(false);
        }
    }, [selectedYear]);

    const fetchAppSettings = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('settings')
                .select('*')
                .eq('id', 'app')
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            if (data) {
                setAppSettings(data);
            }
        } catch (err) {
            console.error("Error fetching settings:", err);
            setError(err);
        } finally {
            setLoadingAppSettings(false);
        }
    }, []);

    // Initial Fetch & Realtime Subscription
    useEffect(() => {
        if (!user) {
            setApartments([]);
            setPayments([]);
            setExpenses([]);
            return;
        }

        setLoadingApartments(true);
        setLoadingPayments(true);
        setLoadingExpenses(true);
        setLoadingAppSettings(true);

        fetchApartments();
        fetchPayments();
        fetchExpenses();
        fetchAppSettings();

        // Realtime Subscription
        const channel = supabase
            .channel('public:all')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'apartments' }, (payload) => {
                console.log('Realtime update: apartments', payload);
                if (payload.eventType === 'INSERT') {
                    setApartments(prev => [...prev, payload.new]);
                } else if (payload.eventType === 'UPDATE') {
                    setApartments(prev => prev.map(a => a.id === payload.new.id ? payload.new : a));
                } else if (payload.eventType === 'DELETE') {
                    setApartments(prev => prev.filter(a => a.id !== payload.old.id));
                }
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, (payload) => {
                console.log('Realtime update: payments', payload);
                if (payload.eventType === 'INSERT') {
                    if (Number(payload.new.year) === Number(selectedYear)) {
                        setPayments(prev => [...prev.filter(p => p.id !== payload.new.id), payload.new]);
                    }
                } else if (payload.eventType === 'UPDATE') {
                    setPayments(prev => prev.map(p => p.id === payload.new.id ? payload.new : p));
                } else if (payload.eventType === 'DELETE') {
                    setPayments(prev => prev.filter(p => p.id !== payload.old.id));
                }
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, (payload) => {
                console.log('Realtime update: expenses', payload);
                const currentYearStart = new Date(selectedYear, 0, 1).toISOString();
                const currentYearEnd = new Date(selectedYear, 11, 31, 23, 59, 59).toISOString();

                if (payload.eventType === 'INSERT') {
                    if (payload.new.date >= currentYearStart && payload.new.date <= currentYearEnd) {
                        setExpenses(prev => [payload.new, ...prev]);
                    }
                } else if (payload.eventType === 'UPDATE') {
                    setExpenses(prev => prev.map(e => e.id === payload.new.id ? payload.new : e));
                } else if (payload.eventType === 'DELETE') {
                    setExpenses(prev => prev.filter(e => e.id !== payload.old.id));
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, selectedYear, fetchApartments, fetchPayments, fetchExpenses]);

    const value = {
        apartments,
        payments,
        expenses,
        appSettings,
        selectedYear,
        setSelectedYear,
        loading: loadingApartments || loadingPayments || loadingExpenses || loadingAppSettings,
        loadingDetailed: {
            apartments: loadingApartments,
            payments: loadingPayments,
            expenses: loadingExpenses,
            appSettings: loadingAppSettings
        },
        error,
        actions: {
            fetchApartments,
            fetchPayments,
            fetchExpenses,
            fetchAppSettings, // Expose fetchAppSettings as refreshSettings
            refreshSettings: fetchAppSettings,
            updatePaymentOptimistically: (paymentId, updates) => {
                setPayments(prev => prev.map(p => p.id === paymentId ? { ...p, ...updates } : p));
            }
        },
        hasPendingWrites // Always false for now as we don't have offline queue metadata
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};
