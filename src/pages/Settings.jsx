import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Mail, Shield, Calendar, Bell, Lock,
    Building2, Save, RefreshCw, Key, Check,
    AlertCircle, Globe, Palette, LogOut, ChevronRight,
    Settings as SettingsIcon, Database, Cpu, ExternalLink, Cloud
} from 'lucide-react';
import { supabase } from '../supabase';
import { useTranslation } from 'react-i18next';
import { useData } from '../context/DataContext';

const Settings = () => {
    const { user, userProfile, isAdmin } = useAuth();
    const { actions, selectedYear } = useData();
    const { t, i18n } = useTranslation();
    const [activeTab, setActiveTab] = useState('building');
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);

    // Form states
    const [formData, setFormData] = useState({
        displayName: userProfile?.display_name || userProfile?.displayName || 'Guest Admin',
        buildingName: '',
        buildingAddress: '',
        defaultMonthlyFee: 200,
        currency: 'DH'
    });

    useEffect(() => {
        // Fetch building settings
        const fetchBuildingSettings = async () => {
            try {
                const { data, error } = await supabase
                    .from('settings')
                    .select('*')
                    .eq('id', 'app')
                    .single();

                if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found"
                    console.error("Error fetching app settings:", error);
                    return;
                }

                if (data) {
                    setFormData(prev => ({
                        ...prev,
                        buildingName: data.building_name || 'SyndicPro',
                        buildingAddress: data.building_address || '',
                        defaultMonthlyFee: data.default_monthly_fee || 200,
                        currency: data.currency || 'DH'
                    }));
                }
            } catch (err) {
                console.error("Error fetching app settings:", err);
            }
        };
        fetchBuildingSettings();

        if (userProfile) {
            setFormData(prev => ({
                ...prev,
                displayName: userProfile.display_name || userProfile.displayName || 'Guest Admin'
            }));
        }
    }, [userProfile]);

    const handleSaveBuilding = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            const { error } = await supabase
                .from('settings')
                .upsert({
                    id: 'app',
                    building_name: formData.buildingName,
                    building_address: formData.buildingAddress,
                    default_monthly_fee: parseInt(formData.defaultMonthlyFee),
                    currency: formData.currency,
                    updated_at: new Date().toISOString(),
                    updated_by: user?.email || 'guest-admin'
                });

            if (error) throw error;

            // STEP 2: Update all apartments to use the new fee (AS REQUESTED)
            // This ensures "monthly_total" for each unit changes to the new setting
            const newFee = parseInt(formData.defaultMonthlyFee);
            const { error: aptError } = await supabase
                .from('apartments')
                .update({ monthly_total: newFee });

            if (aptError) {
                console.error("Failed to bulk update apartment fees:", aptError);
            }

            // STEP 3: Update all payments GLOBALLY to use the new fee 
            // We remove the year filter to ensure historical/future records are consistent with new building policy
            const { error: payError } = await supabase
                .from('payments')
                .update({ amount: newFee })
                .gt('year', 2000); // Safety filter to allow bulk update

            if (payError) {
                console.error("Failed to bulk update payment amounts:", payError);
            }

            // Trigger global refresh
            if (actions?.refreshSettings) await actions.refreshSettings();
            if (actions?.fetchApartments) await actions.fetchApartments();
            if (actions?.fetchPayments) await actions.fetchPayments();

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
            window.dispatchEvent(new Event('settingsUpdated'));
        } catch (err) {
            console.error(err);
            setError(t('settings.save_error') || "Failed to update building settings");
        } finally {
            setSaving(false);
        }
    };

    const tabs = [
        { id: 'building', label: t('settings.building') || 'Building', icon: <Building2 size={20} /> },
        { id: 'appearance', label: t('settings.appearance') || 'Appearance', icon: <Palette size={20} /> },
        { id: 'status', label: t('settings.system_status') || 'System Status', icon: <Cpu size={20} /> },
    ];

    const glassStyle = {
        background: 'var(--bg-card)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--border-light)',
        boxShadow: 'var(--shadow-premium)',
    };

    return (
        <div className="page-root-container animate-slide-up" style={{
            maxWidth: '1200px',
            margin: '0 auto',
            minHeight: 'calc(100vh - 80px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '2rem',
            paddingBottom: '3rem'
        }}>
            {/* Header Area */}
            <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                        <SettingsIcon size={16} />
                        <span>{t('nav.management') || 'Management'}</span>
                        <ChevronRight size={14} />
                        <span style={{ color: 'var(--primary)' }}>{t('settings.configuration') || 'Configuration'}</span>
                    </div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                        {t('settings.title') || 'Settings'}
                    </h1>
                </motion.div>

                <div className="guest-admin-banner" style={{
                    padding: '0.6rem 1rem',
                    borderRadius: '1rem',
                    background: 'var(--primary)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    boxShadow: 'var(--shadow-premium)',
                    whiteSpace: 'nowrap'
                }}>
                    <Shield size={16} />
                    <span>{t('settings.guest_admin_mode') || 'Guest Admin Mode'}</span>
                </div>
            </header>

            <div className="settings-responsive-grid" style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '2.5rem', alignItems: 'start' }}>
                {/* Navigation Sidebar */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mobile-settings-nav"
                    style={{
                        ...glassStyle,
                        borderRadius: '2rem',
                        padding: '1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem'
                    }}
                >
                    <p className="hide-mobile" style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em', paddingLeft: '0.75rem' }}>{t('settings.preferences') || 'Preferences'}</p>
                    <div className="settings-tabs-container" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`tab-nav-btn ${activeTab === tab.id ? 'active' : ''}`}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    padding: '1rem 1.25rem',
                                    borderRadius: '1.25rem',
                                    border: 'none',
                                    background: activeTab === tab.id ? 'var(--primary)' : 'transparent',
                                    color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
                                    fontWeight: 700,
                                    fontSize: '0.95rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    textAlign: 'left',
                                    position: 'relative',
                                    width: '100%'
                                }}
                            >
                                <span style={{ zIndex: 2 }}>{tab.icon}</span>
                                <span style={{ zIndex: 2 }}>{tab.label}</span>
                                {activeTab === tab.id && (
                                    <motion.div
                                        layoutId="tab-highlight"
                                        className="tab-nav-highlight"
                                        style={{
                                            position: 'absolute',
                                            inset: 0,
                                            background: 'var(--primary)',
                                            borderRadius: '1.25rem',
                                            zIndex: 1,
                                            boxShadow: '0 10px 20px -5px var(--primary-light)'
                                        }}
                                    />
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="hide-mobile" style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-light)' }}>
                        <div style={{ padding: '1rem', background: 'var(--bg-main)', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '10px',
                                background: 'linear-gradient(135deg, var(--primary) 0%, #8b5cf6 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: 800
                            }}>
                                G
                            </div>
                            <div>
                                <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{t('settings.guest_admin') || 'Guest Admin'}</p>
                                <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)' }}>{t('settings.public_access') || 'Public Access'}</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Content Area */}
                <div style={{ minHeight: '600px' }}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                        >
                            {activeTab === 'building' && (
                                <div className="settings-tab-content" style={{ ...glassStyle, borderRadius: '2.5rem', padding: '3rem' }}>
                                    <div style={{ marginBottom: '2.5rem' }}>
                                        <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                                            <Building2 size={24} />
                                        </div>
                                        <h2 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                                            {t('settings.building_management') || 'Building Identity'}
                                        </h2>
                                        <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{t('settings.building_subtitle') || 'Configure the core details of your residence or complex.'}</p>
                                    </div>

                                    <form onSubmit={handleSaveBuilding} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                        <div className="form-group">
                                            <label style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'block' }}>
                                                {t('settings.building_name') || 'Display Name'}
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.buildingName}
                                                onChange={(e) => setFormData({ ...formData, buildingName: e.target.value })}
                                                placeholder="e.g. Atlas Residence"
                                                style={{
                                                    width: '100%',
                                                    padding: '1rem 1.25rem',
                                                    borderRadius: '1rem',
                                                    border: '2.5px solid var(--border-light)',
                                                    background: 'var(--bg-main)',
                                                    color: 'var(--text-primary)',
                                                    fontSize: '1rem',
                                                    fontWeight: 600,
                                                    transition: 'all 0.3s ease'
                                                }}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'block' }}>
                                                {t('settings.address') || 'Location Address'}
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.buildingAddress}
                                                onChange={(e) => setFormData({ ...formData, buildingAddress: e.target.value })}
                                                placeholder="123 Street, City, Country"
                                                style={{
                                                    width: '100%',
                                                    padding: '1rem 1.25rem',
                                                    borderRadius: '1rem',
                                                    border: '2.5px solid var(--border-light)',
                                                    background: 'var(--bg-main)',
                                                    color: 'var(--text-primary)',
                                                    fontSize: '1rem',
                                                    fontWeight: 600
                                                }}
                                            />
                                        </div>

                                        <div className="responsive-form-row" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
                                            <div className="form-group">
                                                <label style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'block' }}>
                                                    {t('settings.default_fee') || 'Standard Monthly Contribution'}
                                                </label>
                                                <div style={{ position: 'relative' }}>
                                                    <input
                                                        type="number"
                                                        value={formData.defaultMonthlyFee}
                                                        onChange={(e) => setFormData({ ...formData, defaultMonthlyFee: e.target.value })}
                                                        disabled={!isAdmin()}
                                                        title={!isAdmin() ? "Only Admins can change this" : ""}
                                                        style={{
                                                            width: '100%',
                                                            padding: '1rem 4rem 1rem 1.25rem',
                                                            borderRadius: '1rem',
                                                            border: '2.5px solid var(--border-light)',
                                                            background: !isAdmin() ? 'var(--bg-main-dim)' : 'var(--bg-main)',
                                                            color: !isAdmin() ? 'var(--text-muted)' : 'var(--text-primary)',
                                                            fontSize: '1rem',
                                                            fontWeight: 600,
                                                            cursor: !isAdmin() ? 'not-allowed' : 'text'
                                                        }}
                                                    />
                                                    <span style={{ position: 'absolute', right: '1.25rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: 'var(--text-muted)' }}>
                                                        {formData.currency}
                                                    </span>
                                                    {!isAdmin() && <Lock size={14} style={{ position: 'absolute', right: '3rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />}
                                                </div>
                                            </div>
                                            <div className="form-group">
                                                <label style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'block' }}>
                                                    {t('settings.currency') || 'Local Currency'}
                                                </label>
                                                <select
                                                    value={formData.currency}
                                                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                                    style={{
                                                        width: '100%',
                                                        height: '3.5rem',
                                                        padding: '0 1.25rem',
                                                        borderRadius: '1rem',
                                                        border: '2.5px solid var(--border-light)',
                                                        background: 'var(--bg-main)',
                                                        fontSize: '1rem',
                                                        fontWeight: 700,
                                                        color: 'var(--text-primary)',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <option value="DH">MAD (DH)</option>
                                                    <option value="€">Euro (€)</option>
                                                    <option value="$">Dollar ($)</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                            <button
                                                type="submit"
                                                disabled={saving}
                                                className="btn-primary"
                                                style={{
                                                    padding: '1rem 3rem',
                                                    height: 'auto',
                                                    fontSize: '1rem',
                                                    borderRadius: '1rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.75rem'
                                                }}
                                            >
                                                {saving ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} />}
                                                {saving ? t('settings.saving') || 'Syncing...' : t('settings.save_building') || 'Apply Changes'}
                                            </button>

                                            <AnimatePresence>
                                                {success && (
                                                    <motion.div
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0 }}
                                                        style={{ color: '#10b981', fontWeight: 800, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                                    >
                                                        <Check size={20} strokeWidth={3} />
                                                        {t('settings.saved') || 'System Updated'}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {activeTab === 'appearance' && (
                                <div className="settings-tab-content" style={{ ...glassStyle, borderRadius: '2.5rem', padding: '3rem' }}>
                                    <div style={{ marginBottom: '2.5rem' }}>
                                        <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                                            <Palette size={24} />
                                        </div>
                                        <h2 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                                            {t('settings.look_and_feel') || 'Visual Experience'}
                                        </h2>
                                        <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{t('settings.appearance_subtitle') || 'Personalize how SyndicPro looks and feels for you.'}</p>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                                        <div className="form-group">
                                            <label style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1rem', display: 'block' }}>
                                                {t('settings.language_pref') || 'System Language'}
                                            </label>
                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                                                gap: '1rem'
                                            }}>
                                                {[
                                                    { id: 'en', label: 'English', sub: 'Primary' },
                                                    { id: 'fr', label: 'Français', sub: 'Secondaire' },
                                                    { id: 'ar', label: 'العربية', sub: 'رسمية' }
                                                ].map(lang => (
                                                    <button
                                                        key={lang.id}
                                                        onClick={() => i18n.changeLanguage(lang.id)}
                                                        style={{
                                                            padding: '1.5rem',
                                                            borderRadius: '1.5rem',
                                                            border: i18n.language === lang.id ? '3px solid var(--primary)' : '2.5px solid var(--border-light)',
                                                            background: i18n.language === lang.id ? 'var(--bg-main)' : 'transparent',
                                                            color: i18n.language === lang.id ? 'var(--primary)' : 'var(--text-secondary)',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.3s ease',
                                                            textAlign: 'center',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            gap: '0.25rem',
                                                            boxShadow: i18n.language === lang.id ? '0 10px 20px -5px var(--primary-light)' : 'none'
                                                        }}
                                                    >
                                                        <span style={{ fontSize: '1.1rem', fontWeight: 900 }}>{lang.label}</span>
                                                        <span style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.6 }}>{lang.sub}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div style={{ background: 'var(--bg-main)', padding: '2rem', borderRadius: '2rem', textAlign: 'center' }}>
                                            <Globe size={40} className="text-primary" style={{ opacity: 0.4, marginBottom: '1rem' }} />
                                            <h4 style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Multi-Region Support</h4>
                                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600, maxWidth: '400px', margin: '0 auto' }}>
                                                SyndicPro dynamically adjusts layouts for Right-to-Left (RTL) languages like Arabic to ensure a premium reading experience.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'status' && (
                                <div className="settings-tab-content" style={{ ...glassStyle, borderRadius: '2.5rem', padding: '3rem' }}>
                                    <div style={{ marginBottom: '2.5rem' }}>
                                        <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                                            <Cpu size={24} />
                                        </div>
                                        <h2 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                                            {t('settings.infrastructure_health') || 'Infrastructure & Health'}
                                        </h2>
                                        <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>System performance and connection status.</p>
                                    </div>

                                    <div className="responsive-form-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                                        {[
                                            { label: 'Database', status: 'Operational', icon: <Database size={18} /> },
                                            { label: 'Authentication', status: 'Secure', icon: <Shield size={18} /> },
                                            { label: 'Cloud Sync', status: 'Verified', icon: <Cloud size={18} /> },
                                            { label: 'Security', status: 'Locked', icon: <Lock size={18} /> }
                                        ].map(stat => (
                                            <div key={stat.label} style={{ padding: '1.5rem', borderRadius: '1.5rem', background: 'var(--bg-main)', border: '1.5px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{ color: 'var(--primary)' }}>{stat.icon}</div>
                                                <div>
                                                    <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{stat.label}</p>
                                                    <p style={{ fontSize: '1rem', fontWeight: 900, color: '#10b981' }}>{stat.status}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div style={{ marginTop: '2.5rem', padding: '2rem', borderRadius: '2rem', border: '1.5px dashed var(--border-light)', textAlign: 'center' }}>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>
                                            This instance is running on a private, secure infrastructure.
                                            Access is restricted to authorized administrative personnel only.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default Settings;
