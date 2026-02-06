import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Trash2, Receipt, Calendar, Tag, Wallet, CheckCircle2,
    CreditCard, Droplets, Zap, ShieldCheck, Package2, Search, X,
    ChevronLeft, ChevronRight
} from 'lucide-react';
import { useUI } from '../context/UIContext';
import { useData } from '../context/DataContext';
import { useTranslation } from 'react-i18next';
import { TableSkeleton } from '../components/Skeleton';
import { supabase } from '../supabase';
import ProtectedAction from '../components/ProtectedAction';

const Expenses = () => {
    const { searchQuery, setSearchQuery } = useUI();
    const { t, i18n } = useTranslation();
    const { expenses, loadingDetailed, selectedYear: year, setSelectedYear: setYear } = useData();
    const loading = loadingDetailed.expenses;

    const [showModal, setShowModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [expenseToDelete, setExpenseToDelete] = useState(null);
    const [localSearch, setLocalSearch] = useState('');
    const [formData, setFormData] = useState({
        category: 'MAINTENANCE',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
    });

    const categories = [
        { value: 'ELECTRICITY', label: 'Electricity', icon: <Zap size={20} />, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },
        { value: 'WATER', label: 'Water', icon: <Droplets size={20} />, color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)' },
        { value: 'CLEANING', label: 'Cleaning', icon: <Trash2 size={20} />, color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' },
        { value: 'MAINTENANCE', label: 'Maintenance', icon: <Package2 size={20} />, color: '#6366F1', bg: 'rgba(99, 102, 241, 0.1)' },
        { value: 'SECURITY', label: 'Security', icon: <ShieldCheck size={20} />, color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' },
        { value: 'OTHER', label: 'Other', icon: <Tag size={20} />, color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)' }
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const { error } = await supabase.from('expenses').insert([{
                category: formData.category,
                amount: parseFloat(formData.amount),
                title: formData.description,
                description: formData.description,
                date: formData.date,
                created_at: new Date().toISOString()
            }]);

            if (error) throw error;

            setShowModal(false);
            setFormData({
                category: 'MAINTENANCE',
                amount: '',
                description: '',
                date: new Date().toISOString().split('T')[0]
            });
        } catch (err) {
            console.error("Error adding expense: ", err);
            alert(t('common.error_occurred', { message: err.message }));
        }
    };

    const handleDeleteClick = (exp) => {
        setExpenseToDelete(exp);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!expenseToDelete) return;
        try {
            const { error } = await supabase
                .from('expenses')
                .delete()
                .eq('id', expenseToDelete.id);

            if (error) throw error;

            setShowDeleteConfirm(false);
            setExpenseToDelete(null);
        } catch (err) {
            console.error("Error deleting expense: ", err);
            alert(t('common.error_occurred', { message: err.message }));
        }
    };

    const effectiveSearch = searchQuery || localSearch;
    const filteredExpenses = expenses.filter(exp =>
        exp.description.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
        exp.category.toLowerCase().includes(effectiveSearch.toLowerCase())
    );

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            <TableSkeleton rows={8} />
        </div>
    );

    const totalSpent = expenses.reduce((acc, curr) => acc + curr.amount, 0);

    return (
        <>
            <div className="page-root-container animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: '0.25rem' }}>
                            {t('expenses_page.title')}
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '1rem' }}>{t('expenses_page.subtitle')}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-card)', padding: '0.5rem 1rem', borderRadius: '1rem', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' }}>
                            <button
                                onClick={() => setYear(Math.max(2026, year - 1))}
                                className="btn-ghost"
                                style={{ padding: '0.2rem', border: 'none', opacity: year <= 2026 ? 0.3 : 1, cursor: year <= 2026 ? 'default' : 'pointer' }}
                                disabled={year <= 2026}
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <span style={{ fontWeight: 800, minWidth: '50px', textAlign: 'center' }}>{year}</span>
                            <button
                                onClick={() => setYear(Math.min(2050, year + 1))}
                                className="btn-ghost"
                                style={{ padding: '0.2rem', border: 'none', opacity: year >= 2050 ? 0.3 : 1, cursor: year >= 2050 ? 'default' : 'pointer' }}
                                disabled={year >= 2050}
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                        <ProtectedAction requires="modify">
                            <button
                                className="btn-primary"
                                style={{ height: '3.5rem', padding: '0 2rem', borderRadius: '1.25rem', boxShadow: '0 10px 20px -5px rgba(107, 102, 255, 0.4)' }}
                                onClick={() => setShowModal(true)}
                            >
                                <Plus size={22} />
                                <span style={{ fontWeight: 800 }}>{t('expenses_page.new_transaction')}</span>
                            </button>
                        </ProtectedAction>
                    </div>
                </header>

                {/* Quick Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                    <MetricBox title={t('expenses_page.total_outflow')} value={`${totalSpent.toLocaleString()} DH`} icon={<Wallet size={24} />} trend={`-12% ${t('expenses_page.vs_last_month')}`} type="danger" />
                    <MetricBox title={t('expenses_page.active_contracts')} value={expenses.length} icon={<Receipt size={24} />} trend={t('expenses_page.updated_daily')} type="primary" />
                    <MetricBox title={t('expenses_page.budget_health')} value={t('expenses_page.stable')} icon={<CheckCircle2 size={24} />} trend={`98% ${t('expenses_page.efficiency')}`} type="success" />
                </div>

                {/* Ledger Table Section */}
                <div className="card" style={{ padding: 0, overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{t('expenses_page.ledger')}</h3>
                            <span style={{ padding: '0.25rem 0.75rem', background: 'var(--bg-main)', borderRadius: '2rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>{filteredExpenses.length} {t('expenses_page.records_found')}</span>
                        </div>
                        <div style={{ position: 'relative', width: '300px' }}>
                            <Search style={{ position: 'absolute', [i18n.language === 'ar' ? 'right' : 'left']: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
                            <input
                                type="text"
                                placeholder={t('expenses_page.find_description')}
                                value={effectiveSearch}
                                onChange={(e) => searchQuery ? setSearchQuery(e.target.value) : setLocalSearch(e.target.value)}
                                style={{
                                    paddingLeft: i18n.language === 'ar' ? '1rem' : '3rem',
                                    paddingRight: i18n.language === 'ar' ? '3rem' : '1rem',
                                    width: '100%',
                                    background: 'var(--bg-main)',
                                    borderRadius: '1rem',
                                    border: '1px solid var(--border-light)',
                                    height: '2.75rem'
                                }}
                            />
                        </div>
                    </div>

                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th style={{ paddingLeft: '2rem' }}>{t('expenses_page.date_issued')}</th>
                                    <th>{t('expenses_page.category_cluster')}</th>
                                    <th>{t('expenses_page.purpose')}</th>
                                    <th style={{ textAlign: 'right' }}>{t('expenses_page.aggregate')}</th>
                                    <th style={{ textAlign: 'center', paddingRight: '2rem' }}>{t('nav.management')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredExpenses.map(exp => {
                                    const cat = categories.find(c => c.value === exp.category) || categories[5];
                                    return (
                                        <tr key={exp.id}>
                                            <td style={{ paddingLeft: '2rem' }}>
                                                <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <Calendar size={14} color="var(--text-muted)" />
                                                    {new Date(exp.date).toLocaleDateString(i18n.language, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 1rem', borderRadius: '1rem', background: cat.bg, color: cat.color, fontSize: '0.8rem', fontWeight: 800 }}>
                                                    {cat.icon}
                                                    {t(`expenses_page.${cat.value.toLowerCase()}`)}
                                                </div>
                                            </td>
                                            <td style={{ fontWeight: 600, maxWidth: '300px' }}>{exp.description}</td>
                                            <td style={{ textAlign: 'right', fontWeight: 900, color: '#f43f5e', fontSize: '1.2rem' }}>
                                                -{exp.amount.toLocaleString()} <span style={{ fontSize: '0.8rem' }}>DH</span>
                                            </td>
                                            <td style={{ textAlign: 'center', paddingRight: '2rem' }}>
                                                <ProtectedAction requires="modify">
                                                    <button onClick={() => handleDeleteClick(exp)} className="btn-ghost" style={{ padding: '0.6rem', borderRadius: '0.75rem', color: '#ef4444' }}>
                                                        <Trash2 size={20} />
                                                    </button>
                                                </ProtectedAction>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal & Delete Confirm parts remain remarkably similar, just wrapped in AnimatePresence which is already there */}
            <AnimatePresence>
                {showModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 0 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 0 }}
                            className="card"
                            style={{
                                width: '100%',
                                maxWidth: '380px',
                                padding: '0',
                                borderRadius: '1.75rem',
                                overflow: 'hidden',
                                boxShadow: 'var(--shadow-premium)',
                                border: '1px solid var(--border-light)',
                                background: 'var(--bg-card)'
                            }}
                        >
                            <div style={{ padding: '1.25rem 1.5rem', background: 'var(--bg-table-header)', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h2 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-primary)' }}>{t('expenses_page.new_transaction')}</h2>
                                    <p style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.7rem' }}>{t('expenses_page.subtitle')}</p>
                                </div>
                                <button onClick={() => setShowModal(false)} style={{ background: 'var(--bg-active)', border: 'none', padding: '0.35rem', borderRadius: '0.6rem', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}><X size={16} /></button>
                            </div>

                            <form onSubmit={handleSubmit} style={{ padding: '1.25rem 1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {/* Form fields remain identical */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('expenses_page.category')}</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                                        {categories.map(c => (
                                            <button
                                                key={c.value}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, category: c.value })}
                                                style={{
                                                    padding: '0.5rem 0.25rem',
                                                    borderRadius: '1rem',
                                                    border: '1.5px solid',
                                                    borderColor: formData.category === c.value ? 'var(--primary)' : 'var(--border-light)',
                                                    background: formData.category === c.value ? 'var(--primary-bg)' : 'var(--bg-input)',
                                                    cursor: 'pointer',
                                                    textAlign: 'center',
                                                    transition: 'all 0.2s',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    gap: '0.25rem'
                                                }}
                                            >
                                                <div style={{ color: formData.category === c.value ? 'var(--primary)' : c.color }}>{React.cloneElement(c.icon, { size: 16 })}</div>
                                                <p style={{ fontSize: '0.6rem', fontWeight: 800, color: formData.category === c.value ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{t(`expenses_page.${c.value.toLowerCase()}`)}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.75rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)' }}>{t('expenses_page.date')}</label>
                                        <input
                                            type="date"
                                            value={formData.date}
                                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                                            required
                                            style={{ height: '2.75rem', borderRadius: '0.8rem', border: '1.5px solid var(--border-light)', padding: '0 0.6rem', fontWeight: 700, fontSize: '0.85rem', background: 'var(--bg-input)', color: 'var(--text-primary)', width: '100%' }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)' }}>{t('expenses_page.amount')}</label>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                type="number"
                                                placeholder="0"
                                                value={formData.amount}
                                                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                                required
                                                style={{ height: '2.75rem', borderRadius: '0.8rem', border: '1.5px solid var(--border-light)', padding: i18n.language === 'ar' ? '0 0.6rem 0 2rem' : '0 2rem 0 0.6rem', fontWeight: 900, fontSize: '0.9rem', background: 'var(--bg-input)', width: '100%' }}
                                            />
                                            <span style={{ position: 'absolute', [i18n.language === 'ar' ? 'left' : 'right']: '0.6rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.65rem' }}>DH</span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)' }}>{t('expenses_page.description')}</label>
                                    <textarea
                                        rows="2"
                                        placeholder="Note..."
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        required
                                        style={{ borderRadius: '0.8rem', border: '1.5px solid var(--border-light)', padding: '0.6rem', fontWeight: 600, fontSize: '0.85rem', background: 'var(--bg-input)', resize: 'none' }}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="btn-primary"
                                    style={{ height: '3.25rem', borderRadius: '1rem', fontSize: '0.9rem', fontWeight: 900, boxShadow: '0 12px 24px -8px rgba(107, 102, 255, 0.4)', marginTop: '0.25rem' }}
                                >
                                    {t('common.confirm')}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {showDeleteConfirm && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(8px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="card"
                            style={{ width: '100%', maxWidth: '340px', padding: '2rem', textAlign: 'center', borderRadius: '1.75rem' }}
                        >
                            <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'var(--bg-active)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                <Trash2 size={32} />
                            </div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{t('common.delete')} {t('expenses_page.purpose')}?</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, lineHeight: 1.5, marginBottom: '2rem' }}>
                                {t('common.confirm_delete_msg')}
                            </p>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button className="btn-ghost" onClick={() => setShowDeleteConfirm(false)} style={{ flex: 1, height: '3rem' }}>{t('common.cancel')}</button>
                                <button className="btn-primary" onClick={confirmDelete} style={{ flex: 1, height: '3rem', background: '#ef4444', borderColor: '#ef4444' }}>{t('common.confirm')}</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

// MetricBox component remains unchanged
const MetricBox = ({ title, value, icon, trend, type }) => {
    const color = type === 'primary' ? 'var(--primary)' : type === 'danger' ? '#f43f5e' : '#10b981';
    const bg = type === 'primary' ? 'rgba(107, 102, 255, 0.1)' : type === 'danger' ? 'rgba(244, 63, 94, 0.1)' : 'rgba(16, 185, 129, 0.1)';

    return (
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.75rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: bg, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {icon}
            </div>
            <div>
                <p style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '0.25rem' }}>{title}</p>
                <h2 style={{ fontSize: '2rem', fontWeight: 950, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{value}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: color }}></div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>{trend}</span>
                </div>
            </div>
        </div>
    );
};

export default Expenses;
