import React from 'react';
import { motion } from 'framer-motion';

const Skeleton = ({ width, height, borderRadius = '0.5rem', style }) => {
    return (
        <motion.div
            animate={{
                opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
            }}
            style={{
                width: width || '100%',
                height: height || '1rem',
                borderRadius,
                background: 'var(--bg-main)',
                border: '1px solid var(--border-light)',
                ...style
            }}
        />
    );
};

export const CardSkeleton = () => (
    <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
                <Skeleton width="48px" height="48px" borderRadius="12px" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <Skeleton width="80px" height="1.2rem" />
                    <Skeleton width="40px" height="0.8rem" />
                </div>
            </div>
            <Skeleton width="60px" height="20px" borderRadius="1rem" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', padding: '1rem', background: 'var(--bg-main)', borderRadius: '1rem' }}>
            <Skeleton width="60%" height="0.8rem" />
            <Skeleton width="40%" height="0.8rem" />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Skeleton width="100%" height="2.5rem" borderRadius="0.75rem" />
            <Skeleton width="40px" height="2.5rem" borderRadius="0.75rem" />
        </div>
    </div>
);

export const TableSkeleton = ({ rows = 5 }) => (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between' }}>
            <Skeleton width="150px" height="1.5rem" />
            <Skeleton width="200px" height="2rem" borderRadius="0.75rem" />
        </div>
        <div style={{ padding: '1rem' }}>
            {[...Array(rows)].map((_, i) => (
                <div key={i} style={{ display: 'flex', gap: '1rem', padding: '1rem 0', borderBottom: i === rows - 1 ? 'none' : '1px solid var(--border-light)' }}>
                    <Skeleton width="20%" height="1.2rem" />
                    <Skeleton width="30%" height="1.2rem" />
                    <Skeleton width="40%" height="1.2rem" />
                    <Skeleton width="10%" height="1.2rem" />
                </div>
            ))}
        </div>
    </div>
);

export default Skeleton;
