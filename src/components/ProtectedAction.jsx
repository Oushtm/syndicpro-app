import React from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedAction component - Wraps UI elements that require specific permissions
 * @param {string} requires - Permission required: 'admin', 'modify', or 'view'
 * @param {boolean} hideIfDenied - If true, hides the element instead of disabling it
 * @param {string} tooltip - Tooltip message to show when action is disabled
 */
const ProtectedAction = ({
    children,
    requires = 'modify',
    hideIfDenied = false,
    tooltip = 'You do not have permission to perform this action'
}) => {
    const { isAdmin, canModify, canView, userProfile, loading } = useAuth();

    // If still loading, show children enabled (optimistic rendering)
    if (loading) {
        return <>{children}</>;
    }

    // Check permission based on requirement
    let hasPermission = false;

    if (requires === 'admin') {
        hasPermission = isAdmin();
    } else if (requires === 'modify') {
        hasPermission = canModify();
    } else if (requires === 'view') {
        hasPermission = canView();
    }

    // Hide element if permission denied and hideIfDenied is true
    if (!hasPermission && hideIfDenied) {
        return null;
    }

    // If permission granted, render children as-is
    if (hasPermission) {
        return <>{children}</>;
    }

    // If permission denied, wrap children and disable interactions
    return (
        <div
            style={{
                position: 'relative',
                opacity: 0.5,
                pointerEvents: 'none',
                cursor: 'not-allowed'
            }}
            title={tooltip}
        >
            {children}
        </div>
    );
};

export default ProtectedAction;
