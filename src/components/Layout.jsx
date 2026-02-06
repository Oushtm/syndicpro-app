import React from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Building2,
    CreditCard,
    Receipt,
    Settings,
    LogOut,
    Users,
    Bell,
    Sun,
    Moon,
    Shield,
    Menu,
    X,
    Mic,
    ChevronDown,
    Globe,
    AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { useData } from '../context/DataContext';
import { useTranslation } from 'react-i18next';

const Layout = () => {
    const { user, userProfile, logout, isAdmin, canManageUsers } = useAuth();
    const { darkMode, toggleDarkMode } = useUI();
    const { t, i18n } = useTranslation();
    const { appSettings, error, hasPendingWrites } = useData();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    const isRTL = i18n.language === 'ar';

    const menuItems = [
        {
            group: 'Menu',
            items: [
                { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/' },
                { icon: <Building2 size={20} />, label: 'Security', path: '/security' }, // Placeholder matching image
                { icon: <Building2 size={20} />, label: 'My Locations', path: '/apartments' },
                { icon: <Bell size={20} />, label: 'Notifications', path: '/notifications' },
            ]
        },
        {
            group: 'Appearance',
            items: [
                { icon: <Moon size={20} />, label: 'Dark mode', toggle: true },
                { icon: <Sun size={20} />, label: 'Help', path: '/help' },
            ]
        },
        {
            group: 'Action',
            items: [
                { icon: <Settings size={20} />, label: 'Settings', path: '/settings' },
                { icon: <LogOut size={20} />, label: 'Log Out', action: handleLogout },
            ]
        }
    ];

    // Specific mapping for our functional routes
    const functionalItems = [
        { icon: <LayoutDashboard size={20} />, label: t('nav.dashboard'), path: '/' },
        { icon: <Building2 size={20} />, label: t('nav.apartments'), path: '/apartments' },
        { icon: <CreditCard size={20} />, label: t('nav.payments'), path: '/payments' },
        { icon: <Receipt size={20} />, label: t('nav.expenses'), path: '/expenses' },
    ];

    // Admin-only items
    const role = userProfile?.role?.toLowerCase();
    const isSystemAdmin = role === 'admin';

    if (userProfile) {
        console.log("Current User Role:", role, "isAdmin:", isSystemAdmin);
    }

    const adminItems = canManageUsers() ? [
        { icon: <Users size={20} />, label: t('nav.users'), path: '/users' }
    ] : [];

    return (
        <div className="app-container" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-main)' }}>
            {/* Sidebar */}
            <aside className="sidebar" style={{
                width: '260px',
                background: 'var(--bg-sidebar)',
                borderRight: !isRTL ? '1px solid var(--border-light)' : 'none',
                borderLeft: isRTL ? '1px solid var(--border-light)' : 'none',
                display: 'flex',
                flexDirection: 'column',
                position: 'fixed',
                [isRTL ? 'right' : 'left']: 0,
                height: '100vh',
                padding: '2rem 1.5rem',
                zIndex: 100
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '3rem', paddingLeft: '0.5rem' }}>
                    <div style={{ width: '32px', height: '32px', background: 'var(--primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800 }}>
                        {(appSettings?.buildingName || 'S')[0].toUpperCase()}
                    </div>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{appSettings?.buildingName || 'SyndicPro'}</h1>
                </div>

                <nav style={{ flex: 1 }}>
                    {/* Main Menu Group */}
                    <div style={{ marginBottom: '2rem' }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', paddingLeft: '0.75rem' }}>{t('nav.menu_group')}</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {functionalItems.map(item => (
                                <NavLink key={item.path} to={item.path} style={{ textDecoration: 'none' }}>
                                    {({ isActive }) => (
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.75rem',
                                            padding: '0.75rem 1rem',
                                            borderRadius: '0.75rem',
                                            background: isActive ? 'var(--primary)' : 'transparent',
                                            color: isActive ? 'white' : 'var(--text-secondary)',
                                            fontWeight: 600,
                                            fontSize: '0.9rem',
                                            transition: 'var(--transition)'
                                        }}>
                                            {item.icon}
                                            <span>{item.label}</span>
                                        </div>
                                    )}
                                </NavLink>
                            ))}
                            {adminItems.map(item => (
                                <NavLink key={item.path} to={item.path} style={{ textDecoration: 'none' }}>
                                    {({ isActive }) => (
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.75rem',
                                            padding: '0.75rem 1rem',
                                            borderRadius: '0.75rem',
                                            background: isActive ? 'var(--primary)' : 'transparent',
                                            color: isActive ? 'white' : 'var(--text-secondary)',
                                            fontWeight: 600,
                                            fontSize: '0.9rem',
                                            transition: 'var(--transition)'
                                        }}>
                                            {item.icon}
                                            <span>{item.label}</span>
                                        </div>
                                    )}
                                </NavLink>
                            ))}
                        </div>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', paddingLeft: '0.75rem' }}>{t('nav.appearance_group')}</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div
                                onClick={toggleDarkMode}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '0.75rem 1rem',
                                    color: 'var(--text-secondary)',
                                    fontWeight: 600,
                                    fontSize: '0.9rem',
                                    cursor: 'pointer',
                                    borderRadius: '0.75rem',
                                    background: 'var(--bg-active)',
                                    transition: 'var(--transition)'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                                    <span>{darkMode ? t('nav.light_mode') : t('nav.dark_mode')}</span>
                                </div>
                                <div style={{ width: '36px', height: '20px', background: darkMode ? 'var(--primary)' : 'var(--text-muted)', borderRadius: '10px', position: 'relative', transition: '0.3s' }}>
                                    <div style={{ width: '14px', height: '14px', background: 'white', borderRadius: '50%', position: 'absolute', left: darkMode ? '19px' : '3px', top: '3px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', transition: '0.3s' }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', paddingLeft: '0.75rem' }}>{t('nav.language')}</p>
                        <div style={{ display: 'flex', gap: '0.5rem', padding: '0 0.5rem' }}>
                            {['en', 'fr', 'ar'].map(lng => (
                                <button
                                    key={lng}
                                    onClick={() => changeLanguage(lng)}
                                    style={{
                                        flex: 1,
                                        height: '32px',
                                        fontSize: '0.7rem',
                                        borderRadius: '0.5rem',
                                        background: i18n.language === lng ? 'var(--primary)' : 'var(--bg-main)',
                                        color: i18n.language === lng ? 'white' : 'var(--text-secondary)',
                                        border: 'none',
                                        textTransform: 'uppercase',
                                        fontWeight: 800
                                    }}
                                >
                                    {lng}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', paddingLeft: '0.75rem' }}>{t('nav.action_group')}</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <NavLink
                                to="/settings"
                                style={({ isActive }) => ({
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    padding: '0.75rem 1rem',
                                    color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                                    fontWeight: 600,
                                    fontSize: '0.9rem',
                                    cursor: 'pointer',
                                    borderRadius: '0.75rem',
                                    background: isActive ? 'var(--bg-active)' : 'transparent',
                                    textDecoration: 'none'
                                })}
                            >
                                <Settings size={20} />
                                <span>{t('nav.settings')}</span>
                            </NavLink>

                            <div
                                onClick={handleLogout}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    padding: '0.75rem 1rem',
                                    color: '#f43f5e',
                                    fontWeight: 700,
                                    fontSize: '0.9rem',
                                    cursor: 'pointer',
                                    borderRadius: '0.75rem',
                                    transition: 'var(--transition)',
                                    marginTop: '0.5rem'
                                }}
                            >
                                <LogOut size={20} />
                                <span>{t('nav.logout')}</span>
                            </div>
                        </div>
                    </div>
                </nav>
            </aside>

            {/* Main Content Area */}
            <div className="main-content" style={{ flex: 1, [isRTL ? 'marginRight' : 'marginLeft']: '260px' }}>
                {/* Top Navigation Bar */}
                <header className="app-header" style={{
                    height: '80px',
                    padding: '0 2.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'transparent'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '32px', height: '32px', background: 'var(--primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800 }}>
                            {(appSettings?.buildingName || 'S')[0].toUpperCase()}
                        </div>
                        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{appSettings?.buildingName || 'SyndicPro'}</h1>
                    </div>

                    <div className="header-user" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ height: '32px', width: '1px', background: 'var(--border-light)' }}></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>{userProfile?.displayName || user?.email?.split('@')[0]}</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'flex-end' }}>
                                    {hasPendingWrites && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.2rem 0.5rem', background: 'rgba(251, 191, 36, 0.1)', borderRadius: '0.5rem', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fbbf24', animation: 'pulse 2s infinite' }}></div>
                                            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#fbbf24' }}>SAVING LOCALLY...</span>
                                        </div>
                                    )}
                                    {(userProfile?.role === 'offline' || error) ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.2rem 0.5rem', background: 'rgba(244, 63, 94, 0.1)', borderRadius: '0.5rem', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
                                            <AlertTriangle size={12} color="#f43f5e" />
                                            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#f43f5e' }}>CONNECTION BLOCKED (Disable AdBlock)</span>
                                        </div>
                                    ) : (
                                        !hasPendingWrites && (
                                            <>
                                                <Shield size={12} color="var(--primary)" />
                                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'capitalize' }}>{userProfile?.role || 'user'}</span>
                                            </>
                                        )
                                    )}
                                </div>
                            </div>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '14px',
                                background: 'linear-gradient(135deg, var(--primary) 0%, #8b5cf6 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: 800,
                                fontSize: '1.2rem',
                                boxShadow: '0 8px 16px rgba(107, 102, 255, 0.2)'
                            }}>
                                {(userProfile?.displayName || user?.email || 'U')[0].toUpperCase()}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content Outlet */}
                <main className="page-container" style={{ padding: '0 2.5rem 2.5rem' }}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
};

export default Layout;
