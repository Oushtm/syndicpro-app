import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log("Supabase Auth Listener initializing...");

        // Check active session immediately
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) fetchProfile(session.user.id);
            else setLoading(false);
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            console.log("Auth state change:", _event, session?.user?.email);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setUserProfile(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.warn("Profile fetch error:", error.message);
                // If profile doesn't exist yet (e.g. first login), creates temporary viewer profile
                setUserProfile({ role: 'viewer', permissions: { canView: true } });
            } else {
                console.log("Profile loaded:", data);
                setUserProfile(data);
            }
        } catch (err) {
            console.error("Critical profile error:", err);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;
        return data;
    };

    const logout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    };

    const refreshProfile = async () => {
        if (user) await fetchProfile(user.id);
    };

    // Role-Based Access Control (RBAC) Helpers
    const isAdmin = () => userProfile?.role === 'admin';
    const canModify = () => userProfile?.role === 'admin' || userProfile?.role === 'editor';
    const canView = () => !!user;
    const canManageUsers = () => userProfile?.role === 'admin';

    return (
        <AuthContext.Provider value={{
            user,
            userProfile,
            login,
            logout,
            loading,
            isAdmin,
            canModify,
            canView,
            canManageUsers,
            refreshProfile
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
