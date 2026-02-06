import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Mail, Lock, LogIn, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();

    const from = location.state?.from?.pathname || "/";

    // Redirect if already logged in
    React.useEffect(() => {
        if (!authLoading && user) {
            console.log("User already authenticated, redirecting to:", from);
            navigate(from, { replace: true });
        }
    }, [user, authLoading, navigate, from]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        console.log("Attempting login for:", email);
        try {
            await login(email, password);
            console.log("Login successful, navigating...");
            // Redirect happens via the useEffect above or manually:
            navigate(from, { replace: true });
        } catch (err) {
            console.error("Login failed:", err.code, err.message);
            setError(t('login.error_invalid') || 'Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page-container" style={{
            minHeight: '100vh',
            minHeight: '100dvh',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-main)',
            position: 'relative',
            overflow: 'hidden',
            padding: '1.25rem'
        }}>
            {/* Background Orbs */}
            <div style={{
                position: 'absolute',
                top: '-10%',
                right: '-5%',
                width: '40%',
                height: '40%',
                background: 'var(--primary)',
                filter: 'blur(120px)',
                opacity: 0.15,
                zIndex: 0
            }} />
            <div style={{
                position: 'absolute',
                bottom: '-10%',
                left: '-5%',
                width: '40%',
                height: '40%',
                background: '#8b5cf6',
                filter: 'blur(120px)',
                opacity: 0.1,
                zIndex: 0
            }} />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="login-card"
                style={{
                    width: '100%',
                    maxWidth: '420px',
                    padding: '2.5rem',
                    background: 'var(--bg-card)',
                    borderRadius: '2.5rem',
                    border: '1px solid var(--border-light)',
                    boxShadow: 'var(--shadow-premium)',
                    backdropFilter: 'blur(20px)',
                    zIndex: 1
                }}
            >
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        background: 'linear-gradient(135deg, var(--primary) 0%, #8b5cf6 100%)',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        margin: '0 auto 1.5rem',
                        boxShadow: '0 12px 24px -8px rgba(107, 102, 255, 0.4)'
                    }}>
                        <Shield size={32} />
                    </div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                        Syndic<span style={{ color: 'var(--primary)' }}>Pro</span>
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{t('login.subtitle') || 'Administrative Portal'}</p>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{
                            padding: '1rem',
                            background: 'rgba(244, 63, 94, 0.1)',
                            borderRadius: '1rem',
                            border: '1.5px solid rgba(244, 63, 94, 0.2)',
                            color: '#f43f5e',
                            display: 'flex',
                            gap: '0.75rem',
                            alignItems: 'center',
                            marginBottom: '1.5rem',
                            fontSize: '0.9rem',
                            fontWeight: 700
                        }}
                    >
                        <AlertCircle size={20} />
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', paddingLeft: '0.5rem' }}>
                            {t('login.email') || 'Email Address'}
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                style={{
                                    width: '100%',
                                    height: '3.5rem',
                                    background: 'var(--bg-main)',
                                    border: '2px solid var(--border-light)',
                                    borderRadius: '1.25rem',
                                    padding: '0 1rem 0 3rem',
                                    color: 'var(--text-primary)',
                                    fontWeight: 600,
                                    fontSize: '1rem',
                                    transition: 'all 0.3s ease'
                                }}
                                placeholder="admin@example.com"
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', paddingLeft: '0.5rem' }}>
                            {t('login.password') || 'Password'}
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={{
                                    width: '100%',
                                    height: '3.5rem',
                                    background: 'var(--bg-main)',
                                    border: '2px solid var(--border-light)',
                                    borderRadius: '1.25rem',
                                    padding: '0 1rem 0 3rem',
                                    color: 'var(--text-primary)',
                                    fontWeight: 600,
                                    fontSize: '1rem',
                                    transition: 'all 0.3s ease'
                                }}
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary"
                        style={{
                            height: '4rem',
                            marginTop: '1rem',
                            borderRadius: '1.25rem',
                            fontSize: '1.1rem',
                            fontWeight: 900,
                            gap: '0.75rem',
                            boxShadow: '0 12px 24px -8px rgba(107, 102, 255, 0.4)'
                        }}
                    >
                        {loading ? (
                            <div style={{
                                width: '24px',
                                height: '24px',
                                border: '3px solid rgba(255,255,255,0.3)',
                                borderTop: '3px solid white',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite'
                            }} />
                        ) : (
                            <>
                                <LogIn size={20} />
                                {t('login.btn') || 'Sign In'}
                            </>
                        )}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>
                        {t('login.no_account') || 'Access restricted to authorized personnel.'}
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
