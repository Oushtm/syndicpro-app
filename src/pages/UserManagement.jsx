import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabase';
import {
    Users,
    UserPlus,
    Shield,
    Edit3,
    Eye,
    X,
    Check,
    AlertCircle,
    Trash2,
    Settings as SettingsIcon,
    UserCog
} from 'lucide-react';

const UserManagement = () => {
    const { user, isAdmin, userProfile } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [newUser, setNewUser] = useState({
        email: '',
        password: '',
        displayName: '',
        role: 'viewer',
        permissions: {
            canView: true,
            canModify: false,
            canManageUsers: false
        }
    });

    // Redirect if not admin
    useEffect(() => {
        if (!isAdmin()) {
            navigate('/');
        }
    }, [userProfile, navigate]);

    // Fetch users (profiles)
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(data);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError("Failed to fetch user profiles.");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (userId === user.id) {
            setError(t('users.error_self_delete') || "You cannot delete your own account.");
            return;
        }

        if (!window.confirm(t('users.confirm_remove'))) {
            return;
        }

        try {
            setLoading(true);
            const { error } = await supabase.rpc('delete_user_admin', {
                target_user_id: userId
            });

            if (error) throw error;

            setSuccess(t('users.user_removed'));
            fetchUsers();
        } catch (err) {
            console.error('Error deleting user:', err);
            setError("Failed to delete user: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateRole = async (userId, newRole) => {
        try {
            setLoading(true);

            // Set default permissions based on role if needed, or keep existing
            let permissions = {};
            if (newRole === 'admin') {
                permissions = { canView: true, canModify: true, canManageUsers: true };
            } else if (newRole === 'editor') {
                permissions = { canView: true, canModify: true, canManageUsers: false };
            } else {
                permissions = { canView: true, canModify: false, canManageUsers: false };
            }

            const { error } = await supabase
                .from('profiles')
                .update({
                    role: newRole,
                    permissions
                })
                .eq('id', userId);

            if (error) throw error;

            setSuccess(t('users.role_updated'));
            fetchUsers();
        } catch (err) {
            console.error('Error updating role:', err);
            setError("Failed to update role: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!newUser.email || !newUser.password || !newUser.displayName) {
            setError(t('common.error_required') || "Please fill in all required fields.");
            return;
        }

        setLoading(true);

        try {
            const { data, error: rpcError } = await supabase.rpc('create_user_admin', {
                email: newUser.email,
                password: newUser.password,
                display_name: newUser.displayName,
                user_role: newUser.role,
                user_permissions: newUser.permissions
            });

            if (rpcError) throw rpcError;

            setSuccess(t('users.create_success') || "Staff account created successfully!");
            setShowCreateModal(false);
            setNewUser({
                email: '',
                password: '',
                displayName: '',
                role: 'viewer',
                permissions: { canView: true, canModify: false, canManageUsers: false }
            });
            fetchUsers();
        } catch (err) {
            console.error('Error creating user:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const togglePermission = (perm) => {
        setNewUser(prev => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                [perm]: !prev.permissions[perm]
            }
        }));
    };

    const handleRoleChange = (role) => {
        let perms = { canView: true, canModify: false, canManageUsers: false };
        if (role === 'admin') perms = { canView: true, canModify: true, canManageUsers: true };
        if (role === 'editor') perms = { canView: true, canModify: true, canManageUsers: false };

        setNewUser(prev => ({
            ...prev,
            role,
            permissions: perms
        }));
    };

    const getRoleBadge = (role) => {
        const badges = {
            admin: { bg: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', icon: Shield, label: t('users.role_admin') },
            editor: { bg: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', icon: Edit3, label: t('users.role_editor') },
            viewer: { bg: 'var(--bg-active)', color: 'var(--text-secondary)', icon: Eye, label: t('users.role_viewer') }
        };
        const badge = badges[role] || badges.viewer;
        const Icon = badge.icon;

        return (
            <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                background: badge.bg,
                color: badge.color,
                borderRadius: '0.75rem',
                fontSize: '0.85rem',
                fontWeight: 700
            }}>
                <Icon size={16} />
                {badge.label}
            </div>
        );
    };

    if (loading && users.length === 0) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)' }}>{t('users.loading_users')}</p>
            </div>
        );
    }

    return (
        <>
            <div className="page-root-container animate-slide-up" style={{ paddingBottom: '2rem' }}>
                {/* Header */}
                <header className="page-header" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '2.5rem'
                }}>
                    <div>
                        <h1 style={{
                            fontSize: '2.5rem',
                            fontWeight: 900,
                            color: 'var(--text-primary)',
                            letterSpacing: '-0.03em',
                            marginBottom: '0.25rem'
                        }}>
                            {t('users.title')}
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '1rem' }}>
                            {t('users.subtitle')}
                        </p>
                    </div>
                    <button
                        className="btn-primary"
                        onClick={() => setShowCreateModal(true)}
                        style={{
                            height: '3.5rem',
                            padding: '0 2rem',
                            borderRadius: '1.25rem',
                            boxShadow: '0 10px 20px -5px rgba(107, 102, 255, 0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            position: 'relative',
                            zIndex: 10
                        }}
                    >
                        <UserPlus size={22} />
                        <span style={{ fontWeight: 800 }}>{t('users.create_btn')}</span>
                    </button>
                </header>

                {/* Success/Error Messages */}
                {success && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                            padding: '1rem',
                            background: '#f0fdf4',
                            color: '#16a34a',
                            borderRadius: '1rem',
                            marginBottom: '1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontWeight: 600
                        }}
                    >
                        <Check size={20} />
                        {success}
                    </motion.div>
                )}

                {/* Users List */}
                <div className="mobile-users-grid" style={{
                    display: 'grid',
                    gap: '1.5rem',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))'
                }}>
                    {users.map((userItem) => (
                        <motion.div
                            key={userItem.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="card mobile-user-card"
                            style={{
                                padding: '1.75rem',
                                background: 'var(--bg-card)',
                                borderRadius: '1.75rem',
                                boxShadow: 'var(--shadow-sm)',
                                border: '1px solid var(--border-light)',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                marginBottom: '1rem'
                            }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '12px',
                                    background: 'var(--primary)',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.25rem',
                                    fontWeight: 800
                                }}>
                                    {userItem.display_name?.[0]?.toUpperCase() || userItem.email?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{
                                        fontWeight: 700,
                                        color: 'var(--text-primary)',
                                        marginBottom: '0.25rem'
                                    }}>
                                        {userItem.display_name || 'No Name'}
                                    </h3>
                                    <p style={{
                                        fontSize: '0.85rem',
                                        color: 'var(--text-muted)',
                                        fontWeight: 600
                                    }}>
                                        {userItem.email}
                                    </p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
                                {getRoleBadge(userItem.role)}
                                {userItem.permissions?.canModify && (
                                    <div style={{ padding: '0.4rem 0.75rem', borderRadius: '0.5rem', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', fontSize: '0.75rem', fontWeight: 800 }}>
                                        {t('users.can_modify').split(' (')[0]}
                                    </div>
                                )}
                            </div>

                            <div style={{
                                marginTop: '1.5rem',
                                paddingTop: '1rem',
                                borderTop: '1px solid var(--border-light)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <select
                                        value={userItem.role}
                                        onChange={(e) => handleUpdateRole(userItem.id, e.target.value)}
                                        disabled={userItem.id === user.id}
                                        style={{
                                            padding: '0.3rem 0.5rem',
                                            borderRadius: '0.5rem',
                                            fontSize: '0.8rem',
                                            background: 'var(--bg-main)',
                                            border: '1px solid var(--border-light)',
                                            color: 'var(--text-primary)',
                                            fontWeight: 600
                                        }}
                                    >
                                        <option value="viewer">{t('users.role_viewer')}</option>
                                        <option value="editor">{t('users.role_editor')}</option>
                                        <option value="admin">{t('users.role_admin')}</option>
                                    </select>
                                </div>

                                {userItem.id !== user.id && (
                                    <button
                                        onClick={() => handleDeleteUser(userItem.id)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: '#f43f5e',
                                            cursor: 'pointer',
                                            padding: '0.5rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.25rem',
                                            fontSize: '0.8rem',
                                            fontWeight: 700
                                        }}
                                    >
                                        <Trash2 size={16} />
                                        {t('users.remove_user')}
                                    </button>
                                )}
                            </div>

                            <div style={{
                                marginTop: '0.5rem',
                                fontSize: '0.7rem',
                                color: 'var(--text-muted)',
                                fontWeight: 600,
                                textAlign: 'right'
                            }}>
                                Created: {new Date(userItem.created_at).toLocaleDateString()}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Create User Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(15, 23, 42, 0.75)',
                        backdropFilter: 'blur(8px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2000,
                        padding: '1.5rem'
                    }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            style={{
                                background: 'var(--bg-card)',
                                borderRadius: '2rem',
                                padding: '2.5rem',
                                maxWidth: '500px',
                                width: '100%',
                                boxShadow: 'var(--shadow-premium)',
                                border: '1px solid var(--border-light)',
                                maxHeight: '90vh',
                                overflowY: 'auto'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 900 }}>{t('users.create_modal_title')}</h2>
                                <button onClick={() => setShowCreateModal(false)} className="btn-ghost" style={{ padding: '0.5rem' }}>
                                    <X size={24} />
                                </button>
                            </div>

                            {error && (
                                <div style={{
                                    padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
                                    borderRadius: '1rem', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: 600,
                                    display: 'flex', alignItems: 'center', gap: '0.5rem'
                                }}>
                                    <AlertCircle size={18} />
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>{t('users.display_name')}</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={newUser.displayName}
                                        onChange={(e) => setNewUser(prev => ({ ...prev, displayName: e.target.value }))}
                                        placeholder="John Doe"
                                        required
                                        style={{ width: '100%', padding: '1rem', borderRadius: '1rem', border: '1.5px solid var(--border-light)', background: 'var(--bg-main)' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>{t('users.email')}</label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        value={newUser.email}
                                        onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                                        placeholder="john@example.com"
                                        required
                                        style={{ width: '100%', padding: '1rem', borderRadius: '1rem', border: '1.5px solid var(--border-light)', background: 'var(--bg-main)' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>{t('users.password')}</label>
                                    <input
                                        type="password"
                                        className="form-input"
                                        value={newUser.password}
                                        onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                                        placeholder="••••••••"
                                        required
                                        minLength={6}
                                        style={{ width: '100%', padding: '1rem', borderRadius: '1rem', border: '1.5px solid var(--border-light)', background: 'var(--bg-main)' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>{t('users.role')}</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                                        {['viewer', 'editor', 'admin'].map(r => (
                                            <button
                                                key={r}
                                                type="button"
                                                onClick={() => handleRoleChange(r)}
                                                style={{
                                                    padding: '0.75rem',
                                                    borderRadius: '0.75rem',
                                                    border: '1.5px solid',
                                                    borderColor: newUser.role === r ? 'var(--primary)' : 'var(--border-light)',
                                                    background: newUser.role === r ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                                                    color: newUser.role === r ? 'var(--primary)' : 'var(--text-muted)',
                                                    fontWeight: 700,
                                                    fontSize: '0.8rem',
                                                    textTransform: 'capitalize'
                                                }}
                                            >
                                                {t(`users.role_${r}`)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ background: 'var(--bg-main)', padding: '1.5rem', borderRadius: '1.5rem', border: '1px solid var(--border-light)' }}>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '1rem', textTransform: 'uppercase' }}>{t('users.permissions')}</label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {[
                                            { id: 'canView', label: t('users.can_view') },
                                            { id: 'canModify', label: t('users.can_modify') },
                                            { id: 'canManageUsers', label: t('users.can_manage_users') }
                                        ].map(perm => (
                                            <div key={perm.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{perm.label}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => togglePermission(perm.id)}
                                                    style={{
                                                        width: '40px',
                                                        height: '22px',
                                                        borderRadius: '20px',
                                                        background: newUser.permissions[perm.id] ? 'var(--primary)' : 'var(--border-light)',
                                                        position: 'relative',
                                                        transition: 'all 0.3s ease',
                                                        border: 'none',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <div style={{
                                                        width: '18px',
                                                        height: '18px',
                                                        borderRadius: '50%',
                                                        background: 'white',
                                                        position: 'absolute',
                                                        top: '2px',
                                                        left: newUser.permissions[perm.id] ? '20px' : '2px',
                                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                                    }} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn-primary"
                                    style={{ width: '100%', height: '3.5rem', marginTop: '1rem', borderRadius: '1.25rem' }}
                                >
                                    {loading ? t('users.creating') : t('users.create_btn')}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default UserManagement;
