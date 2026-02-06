import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Search, Filter, Edit3, Trash2, Building2, User as UserIcon,
    X
} from 'lucide-react';
import { useUI } from '../context/UIContext';
import { useData } from '../context/DataContext';
import { useTranslation } from 'react-i18next';
import { CardSkeleton } from '../components/Skeleton';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';

const Apartments = () => {
    const { t } = useTranslation();
    const { isRTL } = useUI();
    const { apartments, loadingDetailed, actions } = useData();
    const { canModify } = useAuth();
    const loading = loadingDetailed.apartments;

    // Local State
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingApt, setEditingApt] = useState(null);
    const [formData, setFormData] = useState({
        number: '',
        floor: '',
        residentName: '',
        residentCin: '',
        occupancyType: 'owner',
        roommateCount: 1,
        roommates: [], // [{ name: '', cin: '' }]
        status: 'occupied',
        amount: 0,
        monthlyTotal: 0,
        email: '',
        phone: ''
    });
    const [actionLoading, setActionLoading] = useState(false);

    // Filter Logic
    const filteredApartments = apartments.filter(apt => {
        const matchesSearch =
            apt.number?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
            apt.resident_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            apt.residentName?.toLowerCase().includes(searchTerm.toLowerCase()) || // legacy support
            '';
        const matchesFilter = filterStatus === 'all' || apt.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    // Handlers
    const handleSubmit = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            const dataToSave = {
                number: formData.number,
                floor: parseInt(formData.floor),
                resident_name: formData.residentName,
                resident_cin: formData.residentCin,
                occupancy_type: formData.occupancyType,
                roommate_count: parseInt(formData.roommateCount),
                roommates_data: formData.roommates,
                status: formData.status,
                balance: parseFloat(formData.amount || 0),
                monthly_total: parseFloat(formData.monthlyTotal || 0),
                email: formData.email,
                phone: formData.phone
            };

            if (editingApt) {
                const { error } = await supabase
                    .from('apartments')
                    .update(dataToSave)
                    .eq('id', editingApt.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('apartments')
                    .insert([dataToSave]);
                if (error) throw error;
            }

            // Instant Refresh
            await actions.fetchApartments();

            setIsFormOpen(false);
            setEditingApt(null);
            resetForm();
        } catch (error) {
            console.error("Error saving apartment:", error);
            alert(t('common.error_occurred', { message: error.message }));
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t('common.confirm_delete'))) return;
        try {
            const { error } = await supabase
                .from('apartments')
                .delete()
                .eq('id', id);
            if (error) throw error;

            // Instant Refresh
            await actions.fetchApartments();

        } catch (error) {
            console.error("Error deleting apartment:", error);
            alert(t('common.error_occurred', { message: error.message }));
        }
    };

    const handleEdit = (apt) => {
        setEditingApt(apt);
        setFormData({
            number: apt.number,
            floor: apt.floor,
            residentName: apt.resident_name || apt.residentName || '',
            residentCin: apt.resident_cin || '',
            occupancyType: apt.occupancy_type || 'owner',
            roommateCount: apt.roommate_count || 1,
            roommates: apt.roommates_data || [],
            status: apt.status,
            amount: apt.balance || 0,
            monthlyTotal: apt.monthly_total || 0,
            email: apt.email || '',
            phone: apt.phone || ''
        });
        setIsFormOpen(true);
    };

    const resetForm = () => {
        setFormData({
            number: '',
            floor: '',
            residentName: '',
            residentCin: '',
            occupancyType: 'owner',
            roommateCount: 1,
            roommates: [],
            status: 'occupied',
            amount: 0,
            monthlyTotal: appSettings?.default_monthly_fee || 200,
            email: '',
            phone: ''
        });
    };

    return (
        <>
            <div className="page-root-container" style={{ padding: '2rem', maxWidth: '1600px', margin: '0 auto', direction: isRTL ? 'rtl' : 'ltr' }}>
                {/* Header Section */}
                <div className="page-header" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '2rem',
                    flexWrap: 'wrap',
                    gap: '1rem'
                }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', background: 'linear-gradient(135deg, var(--primary) 0%, #8b5cf6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            {t('apartments.title')}
                        </h1>
                        <p style={{ color: 'var(--text-secondary)' }}>{t('apartments.subtitle')}</p>
                    </div>

                    {canModify() && (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => { resetForm(); setIsFormOpen(true); }}
                            className="btn-primary"
                            style={{
                                borderRadius: '1rem',
                                padding: '0.75rem 1.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)'
                            }}
                        >
                            <Plus size={20} />
                            {t('apartments.add_new')}
                        </motion.button>
                    )}
                </div>

                {/* Filter & Search Bar */}
                <div className="card" style={{
                    marginBottom: '2rem',
                    padding: '1.25rem',
                    display: 'flex',
                    gap: '1.25rem',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                    borderRadius: '1rem'
                }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
                        <Search
                            size={18}
                            style={{
                                position: 'absolute',
                                [isRTL ? 'right' : 'left']: '1.25rem',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--text-muted)',
                                pointerEvents: 'none'
                            }}
                        />
                        <input
                            type="text"
                            placeholder={t('apartments.search_placeholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input-field"
                            style={{
                                padding: isRTL ? '0.85rem 3.5rem 0.85rem 1.25rem' : '0.85rem 1.25rem 0.85rem 3.5rem',
                                width: '100%',
                                borderRadius: '0.75rem',
                                border: '1px solid var(--border-light)',
                                background: 'var(--bg-input)',
                                color: 'var(--text-primary)',
                                fontSize: '0.95rem',
                                transition: 'all 0.2s'
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-active)', padding: '0.25rem', borderRadius: '0.75rem' }}>
                        {['all', 'occupied', 'vacant'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={filterStatus === status ? 'btn-primary' : 'btn-ghost'}
                                style={{
                                    borderRadius: '0.6rem',
                                    padding: '0.6rem 1.25rem',
                                    fontSize: '0.9rem',
                                    border: 'none',
                                    fontWeight: filterStatus === status ? 600 : 500,
                                    boxShadow: filterStatus === status ? '0 2px 8px rgba(99, 102, 241, 0.25)' : 'none'
                                }}
                            >
                                {t(`common.status.${status}`)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Grid */}
                {loading ? (
                    <div className="apartments-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        {[1, 2, 3, 4, 5, 6].map(i => <CardSkeleton key={i} />)}
                    </div>
                ) : filteredApartments.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}
                    >
                        <Building2 size={64} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                        <h3>{t('common.no_data')}</h3>
                    </motion.div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        <AnimatePresence>
                            {filteredApartments.map((apt) => (
                                <motion.div
                                    key={apt.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="card"
                                    style={{ position: 'relative', overflow: 'hidden', padding: '1.5rem' }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ background: 'var(--primary-bg)', padding: '0.5rem 1rem', borderRadius: '0.5rem', color: 'var(--primary)', fontWeight: 700 }}>
                                                {t('apartments.unit')} {apt.number}
                                            </div>
                                            <span className={`badge ${apt.status === 'occupied' ? 'badge-success' : 'badge-warning'}`}>
                                                {t(`common.status.${apt.status}`)}
                                            </span>
                                        </div>

                                        {canModify() && (
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    onClick={() => handleEdit(apt)}
                                                    style={{
                                                        padding: '0.5rem',
                                                        borderRadius: '0.5rem',
                                                        background: 'var(--bg-active)',
                                                        color: 'var(--text-secondary)',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        transition: 'all 0.2s',
                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                                    }}
                                                    className="btn-icon-hover"
                                                    title={t('common.edit')}
                                                >
                                                    <Edit3 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(apt.id)}
                                                    style={{
                                                        padding: '0.5rem',
                                                        borderRadius: '0.5rem',
                                                        background: 'rgba(239, 68, 68, 0.1)',
                                                        color: '#ef4444',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        transition: 'all 0.2s',
                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                                    }}
                                                    className="btn-icon-hover"
                                                    title={t('common.delete')}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 600 }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-active)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <UserIcon size={18} className="text-primary" />
                                            </div>
                                            {apt.resident_name || apt.residentName || t('common.unknown')}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', color: 'var(--text-secondary)', paddingInlineStart: '2.5rem' }}>
                                            <Building2 size={16} className="text-muted" />
                                            {t('apartments.floor')} {apt.floor}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1.25rem', borderTop: '1px solid var(--border-light)', marginTop: 'auto' }}>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                                            {t('common.balance')}
                                        </div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: (apt.balance || 0) <= 0 ? '#10b981' : '#ef4444' }}>
                                            {(apt.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} MAD
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}

            </div>

            {/* Modal Form - Moved outside transformed container */}
            <AnimatePresence>
                {isFormOpen && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.5)', zIndex: 1000,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '1rem',
                        backdropFilter: 'blur(4px)'
                    }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="card"
                            style={{
                                width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto',
                                background: 'var(--bg-card)', padding: '2rem', borderRadius: '1.5rem',
                                boxShadow: 'var(--shadow-premium)',
                                border: '1px solid var(--border-light)'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <h3 style={{ margin: 0, fontWeight: 800 }}>{editingApt ? t('apartments.edit_unit') : t('apartments.add_new')}</h3>
                                <button onClick={() => { setIsFormOpen(false); setEditingApt(null); }} style={{ background: 'var(--bg-active)', border: 'none', padding: '0.4rem', borderRadius: '0.75rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('apartments.unit_number')}</label>
                                        <input
                                            required
                                            value={formData.number}
                                            onChange={e => setFormData({ ...formData, number: e.target.value })}
                                            placeholder="A-101"
                                            className="input-field"
                                            style={{ width: '100%', padding: '0.85rem', borderRadius: '0.75rem', border: '1px solid var(--border-light)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontWeight: 600 }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('apartments.floor')}</label>
                                        <input
                                            required
                                            type="number"
                                            value={formData.floor}
                                            onChange={e => setFormData({ ...formData, floor: e.target.value })}
                                            placeholder="1"
                                            className="input-field"
                                            style={{ width: '100%', padding: '0.85rem', borderRadius: '0.75rem', border: '1px solid var(--border-light)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontWeight: 600 }}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('apartments.resident_name')}</label>
                                        <input
                                            required
                                            value={formData.residentName}
                                            onChange={e => setFormData({ ...formData, residentName: e.target.value })}
                                            placeholder="John Doe"
                                            className="input-field"
                                            style={{ width: '100%', padding: '0.85rem', borderRadius: '0.75rem', border: '1px solid var(--border-light)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontWeight: 600 }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('apartments.cin')}</label>
                                        <input
                                            value={formData.residentCin}
                                            onChange={e => setFormData({ ...formData, residentCin: e.target.value })}
                                            placeholder="AB123456"
                                            className="input-field"
                                            style={{ width: '100%', padding: '0.85rem', borderRadius: '0.75rem', border: '1px solid var(--border-light)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontWeight: 600 }}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('common.phone')}</label>
                                    <input
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="+212..."
                                        className="input-field"
                                        style={{ width: '100%', padding: '0.85rem', borderRadius: '0.75rem', border: '1px solid var(--border-light)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontWeight: 600 }}
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('apartments.occupancy_type')}</label>
                                        <select
                                            value={formData.occupancyType}
                                            onChange={e => {
                                                const type = e.target.value;
                                                const roommates = type === 'shared' ? Array.from({ length: formData.roommateCount - 1 }, () => ({ name: '', cin: '' })) : [];
                                                setFormData({ ...formData, occupancyType: type, roommates });
                                            }}
                                            className="input-field"
                                            style={{ width: '100%', padding: '0.85rem', borderRadius: '0.75rem', border: '1px solid var(--border-light)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontWeight: 600 }}
                                        >
                                            <option value="owner">{t('apartments.owner')}</option>
                                            <option value="tenant">{t('apartments.tenant')}</option>
                                            <option value="shared">{t('apartments.shared')}</option>
                                        </select>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('common.status.label')}</label>
                                        <select
                                            value={formData.status}
                                            onChange={e => setFormData({ ...formData, status: e.target.value })}
                                            className="input-field"
                                            style={{ width: '100%', padding: '0.85rem', borderRadius: '0.75rem', border: '1px solid var(--border-light)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontWeight: 600 }}
                                        >
                                            <option value="occupied">{t('common.status.occupied')}</option>
                                            <option value="vacant">{t('common.status.vacant')}</option>
                                        </select>
                                    </div>
                                </div>

                                {formData.occupancyType === 'shared' && (
                                    <div style={{ border: '1px solid var(--border-light)', padding: '1.25rem', borderRadius: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-main)' }}>
                                        <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>{t('apartments.roommates')}</label>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            {[2, 3, 4].map(count => (
                                                <button
                                                    key={count}
                                                    type="button"
                                                    onClick={() => {
                                                        const newRoommates = Array.from({ length: count - 1 }, (_, i) => formData.roommates[i] || { name: '', cin: '' });
                                                        setFormData({ ...formData, roommateCount: count, roommates: newRoommates });
                                                    }}
                                                    className={formData.roommateCount === count ? 'btn-primary' : 'btn-ghost'}
                                                    style={{ flex: 1, padding: '0.6rem', borderRadius: '0.75rem', fontSize: '0.85rem' }}
                                                >
                                                    {count}
                                                </button>
                                            ))}
                                        </div>

                                        {formData.roommates.map((rm, idx) => (
                                            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', padding: '1rem', background: 'var(--bg-card)', borderRadius: '0.75rem', border: '1px solid var(--border-light)' }}>
                                                <input
                                                    placeholder={t('apartments.roommate_name')}
                                                    value={rm.name}
                                                    onChange={e => {
                                                        const newRms = [...formData.roommates];
                                                        newRms[idx].name = e.target.value;
                                                        setFormData({ ...formData, roommates: newRms });
                                                    }}
                                                    className="input-field"
                                                    style={{ padding: '0.6rem', fontSize: '0.85rem', borderRadius: '0.5rem' }}
                                                />
                                                <input
                                                    placeholder={t('apartments.roommate_cin')}
                                                    value={rm.cin}
                                                    onChange={e => {
                                                        const newRms = [...formData.roommates];
                                                        newRms[idx].cin = e.target.value;
                                                        setFormData({ ...formData, roommates: newRms });
                                                    }}
                                                    className="input-field"
                                                    style={{ padding: '0.6rem', fontSize: '0.85rem', borderRadius: '0.5rem' }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div style={{ background: 'var(--primary-bg)', padding: '1.25rem', borderRadius: '1.25rem', border: '1px dashed var(--primary)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                        <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)' }}>{t('apartments.monthly_total')}</label>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                type="number"
                                                value={formData.monthlyTotal}
                                                onChange={e => setFormData({ ...formData, monthlyTotal: e.target.value })}
                                                className="input-field"
                                                style={{ width: '130px', textAlign: 'right', paddingInlineEnd: '2.5rem', height: '2.75rem', borderRadius: '0.75rem', fontWeight: 800, fontSize: '1rem' }}
                                            />
                                            <span style={{ position: 'absolute', [isRTL ? 'left' : 'right']: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, fontSize: '0.7rem', color: 'var(--primary)', opacity: 0.6 }}>MAD</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                        <span>{t('apartments.price_per_person')}</span>
                                        <span style={{ fontWeight: 800, color: 'var(--primary)' }}>
                                            {(formData.monthlyTotal / (formData.occupancyType === 'shared' ? formData.roommateCount : 1)).toFixed(2)} MAD
                                        </span>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={actionLoading}
                                    style={{ marginTop: '0.5rem', width: '100%', justifyContent: 'center', height: '3.5rem', borderRadius: '1.25rem', fontWeight: 900, boxShadow: '0 10px 20px -5px rgba(107, 102, 255, 0.4)' }}
                                >
                                    {actionLoading ? t('common.saving') : (editingApt ? t('common.save_changes') : t('apartments.create_unit'))}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Apartments;
