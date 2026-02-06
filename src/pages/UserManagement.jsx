import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
        displayName: '',
        role: 'viewer'
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
            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', userId);

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
            const permissions = {
                canView: true,
                canModify: newRole === 'admin' || newRole === 'editor',
                canManageUsers: newRole === 'admin'
            };

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
        setLoading(true);

        try {
            // Determine permissions based on role
            let permissions = {
                canView: true,
                canModify: false,
                canManageUsers: false
            };

            if (newUser.role === 'admin') {
                permissions = {
                    canView: true,
                    canModify: true,
                    canManageUsers: true
                };
            } else if (newUser.role === 'editor') {
                permissions = {
                    canView: true,
                    canModify: true,
                    canManageUsers: false
                };
            }

            // Create profile in Supabase
            // Note: This does NOT create the Auth user. 
            // The Auth user must be invited or created via Dashboard with the same email.
            // Or if RLS allows, this profile will sit waiting for the user to sign up.
            // For now we assume the admin will create the Auth user separately.

            // To link them, we'd typically need the UID from Auth. 
            // Without it, we can't key this profile correctly unless we use email as key (bad practice) 
            // OR we just assume this is a "Pre-provisioning" step.

            // LIMITATION: We can't insert a profile with a random ID if we want it to match the Auth UID later.
            // WORKAROUND: We will display a message that this feature is limited in Client-Only mode.

            // However, to be helpful, let's just insert it. If allow_public_registration is on, 
            // a Trigger could handle this, but here we are manual.

            // ACTUAL FIX: We will just alert the user.
            throw new Error("Client-side user creation is not supported in this migration. Please use the Supabase Dashboard to Invite/Create users.");

        } catch (err) {
            console.error('Error creating user:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
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
        <div style={{ padding: '2rem' }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem'
            }}>
                <div>
                    <h1 style={{
                        fontSize: '2rem',
                        fontWeight: 800,
                        color: 'var(--text-primary)',
                        marginBottom: '0.5rem'
                    }}>
                        {t('users.title')}
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
                        {t('users.subtitle')}
                    </p>
                </div>
                <button
                    className="btn-primary"
                    onClick={() => setShowCreateModal(true)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1.5rem',
                        opacity: 0.5,
                        cursor: 'not-allowed'
                    }}
                    title="User creation requires Supabase Dashboard access"
                >
                    <UserPlus size={20} />
                    {t('users.create_btn')}
                </button>
            </div>

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

            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        padding: '1rem',
                        background: '#fef2f2',
                        color: '#dc2626',
                        borderRadius: '1rem',
                        marginBottom: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontWeight: 600
                    }}
                >
                    <AlertCircle size={20} />
                    {error}
                </motion.div>
            )}

            {/* Users List */}
            <div style={{
                display: 'grid',
                gap: '1rem',
                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))'
            }}>
                {users.map((userItem) => (
                    <motion.div
                        key={userItem.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="card"
                        style={{
                            padding: '1.5rem',
                            background: 'var(--bg-card)',
                            borderRadius: '1.5rem',
                            boxShadow: 'var(--shadow-sm)',
                            border: '1px solid var(--border-light)'
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

                        <div style={{ marginTop: '1rem' }}>
                            {getRoleBadge(userItem.role)}
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
                                    defaultValue={userItem.role}
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
                                    <option value="viewer">{t('users.role_viewer').split(' (')[0]}</option>
                                    <option value="editor">{t('users.role_editor').split(' (')[0]}</option>
                                    <option value="admin">{t('users.role_admin').split(' (')[0]}</option>
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

            {/* Modal - Removed Functionality, keeping code for structure but disabled entering */}
            {showCreateModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '1.5rem'
                }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{
                            background: 'var(--bg-card)',
                            borderRadius: '2rem',
                            padding: '2.5rem',
                            maxWidth: '500px',
                            width: '100%',
                            boxShadow: 'var(--shadow-premium)',
                            border: '1px solid var(--border-light)',
                            textAlign: 'center'
                        }}
                    >
                        <AlertCircle size={48} style={{ color: 'var(--primary)', margin: '0 auto 1rem' }} />
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--text-primary)' }}>Feature Update</h2>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '2rem' }}>
                            User creation is now managed via the Supabase Dashboard.
                            <br /><br />
                            Please invite users via <strong>Authentication &gt; Add User</strong> in your Supabase project.
                            Their profile will automatically appear here once they sign in.
                        </p>
                        <button onClick={() => setShowCreateModal(false)} className="btn-primary" style={{ width: '100%' }}>
                            {t('common.close')}
                        </button>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
