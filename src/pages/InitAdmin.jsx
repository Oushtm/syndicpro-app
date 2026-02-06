import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { motion } from 'framer-motion';
import { Shield, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const InitAdmin = () => {
    const { userProfile } = useAuth(); // Listen to profile changes
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [message, setMessage] = useState('');

    const ADMIN_EMAIL = 'admin@syndicpro.ma';
    const ADMIN_PASS = 'adminPassword2026';

    // Auto-detect success if profile updates
    useEffect(() => {
        if (userProfile?.role === 'admin' && status === 'loading') {
            setStatus('success');
            setMessage('Administrator profile created!');
        }
    }, [userProfile, status]);

    const bootstrap = async () => {
        setStatus('loading');
        try {
            let userId;

            // 1. Check/Create User in Auth
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            if (session?.user?.email === ADMIN_EMAIL) {
                console.log("Already logged in as admin.");
                userId = session.user.id;
            } else {
                // Try to sign up
                const { data, error } = await supabase.auth.signUp({
                    email: ADMIN_EMAIL,
                    password: ADMIN_PASS,
                });

                if (error) {
                    console.log("Sign up warning:", error.message);
                    // If user already exists, try signing in
                    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                        email: ADMIN_EMAIL,
                        password: ADMIN_PASS,
                    });

                    if (signInError) throw signInError;
                    userId = signInData.user.id;
                } else {
                    userId = data.user.id;
                }
            }

            // 2. Create/Update Profile in Supabase
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: userId,
                    email: ADMIN_EMAIL,
                    display_name: 'Primary Admin',
                    role: 'admin',
                    can_manage_users: true
                });

            if (profileError) throw profileError;

            // Trigger manual feedback if useEffect is slow
            setTimeout(() => {
                if (status !== 'success') {
                    setStatus('success');
                    setMessage('Administrator initialized!');
                }
            }, 1000);

        } catch (err) {
            console.error("Bootstrap Error:", err);
            setStatus('error');
            setMessage(err.message);
        }
    };

    return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)' }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                    padding: '3rem',
                    background: 'var(--bg-card)',
                    borderRadius: '2rem',
                    boxShadow: 'var(--shadow-premium)',
                    border: '1px solid var(--border-light)',
                    textAlign: 'center',
                    maxWidth: '400px',
                    width: '100%'
                }}
            >
                <div style={{
                    width: '64px',
                    height: '64px',
                    background: 'var(--primary)',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    margin: '0 auto 1.5rem'
                }}>
                    <Shield size={32} />
                </div>

                <h1 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '1rem' }}>Admin Setup</h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
                    Click below to initialize the primary administrator account (Supabase).
                </p>

                {status === 'success' ? (
                    <div style={{ color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <Check size={20} />
                        {message}
                    </div>
                ) : status === 'error' ? (
                    <div style={{ color: '#f43f5e', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <AlertCircle size={20} />
                        {message}
                    </div>
                ) : (
                    <button
                        onClick={bootstrap}
                        disabled={status === 'loading'}
                        className="btn-primary"
                        style={{ width: '100%', height: '3.5rem', borderRadius: '1rem', fontWeight: 900 }}
                    >
                        {status === 'loading' ? 'Initializing...' : 'Initialize Admin'}
                    </button>
                )}

                <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--bg-main)', borderRadius: '1rem', fontSize: '0.8rem', textAlign: 'left' }}>
                    <p style={{ marginBottom: '0.5rem' }}><strong>Email:</strong> {ADMIN_EMAIL}</p>
                    <p><strong>Password:</strong> {ADMIN_PASS}</p>
                </div>
            </motion.div>
        </div>
    );
};

export default InitAdmin;
