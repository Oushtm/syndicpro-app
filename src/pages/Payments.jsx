import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    ChevronRight,
    ChevronLeft,
    FileDown,
    CheckCircle2,
    XCircle,
    Search,
    Building2,
    RefreshCw
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { loadArabicFont, addHeader, addFooter } from '../utils/pdfHelper';
import { useUI } from '../context/UIContext';
import { useData } from '../context/DataContext';
import { useTranslation } from 'react-i18next';
import { TableSkeleton } from '../components/Skeleton';
import { supabase } from '../supabase';
import ProtectedAction from '../components/ProtectedAction';

const Payments = () => {
    const { apartments, payments: allPayments, appSettings, loadingDetailed, selectedYear: year, setSelectedYear: setYear, actions } = useData();
    const [generating, setGenerating] = useState(false);
    const { searchQuery } = useUI();
    const { t, i18n } = useTranslation();
    const [localSearch, setLocalSearch] = useState('');

    const loading = loadingDetailed.apartments || loadingDetailed.payments || generating;

    const months = [
        { num: 1, short: 'Jan', full: 'January' },
        { num: 2, short: 'Feb', full: 'February' },
        { num: 3, short: 'Mar', full: 'March' },
        { num: 4, short: 'Apr', full: 'April' },
        { num: 5, short: 'May', full: 'May' },
        { num: 6, short: 'Jun', full: 'June' },
        { num: 7, short: 'Jul', full: 'July' },
        { num: 8, short: 'Aug', full: 'August' },
        { num: 9, short: 'Sep', full: 'September' },
        { num: 10, short: 'Oct', full: 'October' },
        { num: 11, short: 'Nov', full: 'November' },
        { num: 12, short: 'Dec', full: 'December' }
    ];

    const generateMissingPayments = async () => {
        if (!apartments.length || loadingDetailed.payments || generating) return;

        // Note: Filtered payments from context are already for the active year
        const currentYearPayments = allPayments;
        const paymentsToInsert = [];

        apartments.forEach(apt => {
            for (let m = 1; m <= 12; m++) {
                const exists = currentYearPayments.find(p => p.apartment_id === apt.id && Number(p.month) === m);
                if (!exists) {
                    paymentsToInsert.push({
                        month: m,
                        year: parseInt(year),
                        amount: parseFloat(apt.monthly_total || appSettings?.default_monthly_fee || 200),
                        status: 'UNPAID',
                        apartment_id: apt.id,
                        created_at: new Date().toISOString()
                    });
                }
            }
        });

        if (paymentsToInsert.length > 0) {
            setGenerating(true);
            try {
                const { error } = await supabase
                    .from('payments')
                    .upsert(paymentsToInsert, {
                        onConflict: 'apartment_id,month,year',
                        ignoreDuplicates: true
                    });

                if (error) throw error;
                console.log(`Synced ${paymentsToInsert.length} payments for ${year}`);

                // Instant Refresh
                await actions.fetchPayments();
            } catch (err) {
                console.error("Payment sync failed:", err);
                // Don't alert for duplicate key errors as they are handled by ignoreDuplicates
                if (!err.message?.includes('unique constraint')) {
                    alert(t('common.error_occurred', { message: err.message }));
                }
            } finally {
                setGenerating(false);
            }
        }
    };

    useEffect(() => {
        // Only attempt generate if we are fully loaded and have apartments
        if (!loadingDetailed.apartments && !loadingDetailed.payments && apartments.length > 0) {
            generateMissingPayments();
        }
    }, [year, apartments.length, loadingDetailed.payments]);

    const apartmentsData = useMemo(() => {
        if (!apartments.length) return [];

        const currentYearPayments = allPayments.filter(p => p.year === parseInt(year));

        const result = apartments.map(apt => ({
            apartment: apt,
            payments: currentYearPayments.filter(p => p.apartment_id === apt.id)
        }));

        // Sort by floor then apartment number
        return result.sort((a, b) => {
            const floorDiff = (a.apartment.floor || 0) - (b.apartment.floor || 0);
            if (floorDiff !== 0) return floorDiff;
            return a.apartment.number.localeCompare(b.apartment.number, undefined, { numeric: true });
        });
    }, [apartments, allPayments, year]);

    const togglePayment = async (payment) => {
        const newStatus = payment.status === 'PAID' ? 'UNPAID' : 'PAID';
        const updates = {
            status: newStatus,
            paid_at: newStatus === 'PAID' ? new Date().toISOString() : null
        };

        try {
            // Apply local update immediately (Optimistic)
            actions.updatePaymentOptimistically(payment.id, updates);

            const { error } = await supabase
                .from('payments')
                .update(updates)
                .eq('id', payment.id);

            if (error) throw error;
        } catch (err) {
            console.error("Error toggling payment:", err);
            // Rollback on error
            actions.updatePaymentOptimistically(payment.id, {
                status: payment.status,
                paid_at: payment.paid_at
            });
            alert(t('common.error_occurred', { message: err.message }));
        }
    };

    const effectiveSearch = searchQuery || localSearch;
    const filteredData = useMemo(() => {
        return apartmentsData.filter(({ apartment }) =>
            apartment.number.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
            (apartment.resident_name && apartment.resident_name.toLowerCase().includes(effectiveSearch.toLowerCase())) ||
            (apartment.residentName && apartment.residentName.toLowerCase().includes(effectiveSearch.toLowerCase())) || // legacy support
            false
        );
    }, [apartmentsData, effectiveSearch]);

    const exportPDF = async () => {
        const isAr = i18n.language === 'ar';
        const doc = new jsPDF('landscape');

        // Load Arabic Font
        await loadArabicFont(doc);

        // Add standardized header
        addHeader(doc, isAr ? 'تقرير المدفوعات السنوي' : 'Annual Payment Report', `${t('dashboard.yearly_overview')}: ${year}`, isAr);

        const tableData = filteredData.map(({ apartment, payments }) => {
            const row = [
                apartment.number,
                apartment.resident_name || apartment.residentName || 'Unknown',
                ...months.map(m => {
                    const p = payments.find(pay => pay.month === m.num);
                    return p?.status === 'PAID' ? 'OK' : '';
                }),
                `${payments.filter(p => p.status === 'PAID').length}/12`
            ];

            // RTL Row Reversal check
            if (isAr) {
                return row.reverse();
            }
            return row;
        });

        // Prepare Head Row
        let headRow = [t('apartments.unit'), t('apartments.owner_name'), ...months.map(m => t(`months.${m.short.toLowerCase()}`)), t('common.total')];
        if (isAr) {
            headRow = headRow.reverse();
        }

        autoTable(doc, {
            startY: 40,
            head: [headRow],
            body: tableData,
            theme: 'grid',
            styles: {
                font: 'Amiri', // CRITICAL
                fontSize: 8,
                cellPadding: 2,
                halign: 'center'
            },
            headStyles: {
                fillColor: [107, 102, 255],
                fontSize: 9,
                fontStyle: 'bold',
                font: 'Amiri',
                halign: 'center'
            },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            didParseCell: (data) => {
                if (data.section === 'body') {
                    if (data.cell.raw === 'OK') {
                        data.cell.styles.textColor = [16, 185, 129]; // Green
                        data.cell.styles.fontStyle = 'bold';
                    }
                }
            }
        });

        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            addFooter(doc, i, pageCount);
        }

        doc.save(`payments_${year}_report.pdf`);
    };

    if (loading && !apartments.length) return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <TableSkeleton rows={10} />
        </div>
    );

    if (apartmentsData.length === 0) {
        return (
            <div style={{ padding: '4rem', textAlign: 'center' }}>
                <Building2 size={64} style={{ margin: '0 auto 1rem', color: 'var(--text-muted)', opacity: 0.5 }} />
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>No Apartments Found</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                    Add apartments first to see payment tracking.
                </p>
                <button
                    className="btn-primary"
                    onClick={() => generateMissingPayments()}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <RefreshCw size={18} className={generating ? 'animate-spin' : ''} />
                    {generating ? 'Syncing...' : 'Refresh Data'}
                </button>
            </div>
        );
    }

    return (
        <div className="page-root-container animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{t('payments.title')}</h1>
                    <p style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem' }}>{t('payments.subtitle')}</p>
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
                    <button
                        className="btn-ghost"
                        style={{ height: '3rem', background: 'var(--bg-card)', border: 'none', boxShadow: 'var(--shadow-sm)', borderRadius: '1rem' }}
                        onClick={() => generateMissingPayments()}
                        title="Sync payments"
                    >
                        <RefreshCw size={20} className={generating ? 'animate-spin' : ''} />
                    </button>
                    <ProtectedAction requires="modify">
                        <button className="btn-ghost" style={{ height: '3rem', background: 'var(--bg-card)', border: 'none', boxShadow: 'var(--shadow-sm)', borderRadius: '1rem' }} onClick={exportPDF}>
                            <FileDown size={20} />
                            <span className="hide-mobile">{t('payments.export')}</span>
                        </button>
                    </ProtectedAction>
                </div>
            </header>

            {/* Search Bar */}
            <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={18} style={{ position: 'absolute', [i18n.language === 'ar' ? 'right' : 'left']: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder={t('payments.filter_units')}
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)}
                        style={{
                            paddingLeft: i18n.language === 'ar' ? '1rem' : '3rem',
                            paddingRight: i18n.language === 'ar' ? '3rem' : '1rem',
                            height: '2.75rem',
                            fontSize: '0.9rem',
                            background: 'var(--bg-main)',
                            border: '1px solid var(--border-light)',
                            borderRadius: '0.75rem',
                            width: '100%'
                        }}
                    />
                </div>
            </div>

            {/* Payments View */}
            <div className="hide-desktop">
                <div className="mobile-payments-grid" style={{ display: 'grid', gap: '1rem' }}>
                    {filteredData.map(({ apartment, payments }) => (
                        <div key={apartment.id} className="card mobile-payment-card" style={{ padding: '1.25rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--primary)', marginBottom: '0.25rem' }}>
                                        {t('apartments.unit')} {apartment.number}
                                    </h3>
                                    <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                        {apartment.resident_name || apartment.residentName || '-'}
                                    </p>
                                </div>
                                <div style={{ textAlign: 'right', background: 'var(--primary-bg)', padding: '0.4rem 0.8rem', borderRadius: '0.75rem' }}>
                                    <span style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--primary)' }}>
                                        {payments.filter(p => p.status === 'PAID').length}/12
                                    </span>
                                </div>
                            </div>

                            <div className="mobile-months-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
                                {months.map(m => {
                                    const payment = payments.find(p => Number(p.month) === Number(m.num));
                                    const isPaid = payment?.status === 'PAID';
                                    return (
                                        <ProtectedAction key={m.num} requires="modify">
                                            <button
                                                onClick={() => payment && togglePayment(payment)}
                                                className={`mobile-month-toggle ${isPaid ? 'paid' : ''}`}
                                                style={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    gap: '0.3rem',
                                                    padding: '0.6rem 0.4rem',
                                                    borderRadius: '0.8rem',
                                                    background: isPaid ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-active)',
                                                    border: `1.5px solid ${isPaid ? '#10b981' : 'transparent'}`,
                                                    transition: 'all 0.2s',
                                                    height: 'auto',
                                                    width: '100%'
                                                }}
                                            >
                                                <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: isPaid ? '#10b981' : 'var(--text-muted)' }}>
                                                    {t(`months.${m.short.toLowerCase()}`)}
                                                </span>
                                                {isPaid ? (
                                                    <CheckCircle2 size={18} color="#10b981" />
                                                ) : (
                                                    <XCircle size={18} color="var(--text-muted)" opacity={0.4} />
                                                )}
                                            </button>
                                        </ProtectedAction>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="hide-mobile">
                <div className="card" style={{ padding: 0, overflow: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'var(--bg-table-header)', borderBottom: '2px solid var(--border-light)' }}>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', position: 'sticky', left: 0, background: 'var(--bg-table-header)', zIndex: 2 }}>
                                    <Building2 size={16} style={{ display: 'inline', marginInlineEnd: '0.5rem' }} />
                                    {t('apartments.unit')}
                                </th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', minWidth: '150px', position: 'sticky', left: '80px', background: 'var(--bg-table-header)', zIndex: 2 }}>
                                    {t('apartments.owner_name')}
                                </th>
                                {months.map(m => (
                                    <th key={m.num} style={{ padding: '1rem', textAlign: 'center', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', minWidth: '60px' }}>
                                        {t(`months.${m.short.toLowerCase()}`)}
                                    </th>
                                ))}
                                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', minWidth: '80px' }}>
                                    {t('common.total')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map(({ apartment, payments }) => {
                                const paidCount = payments.filter(p => p.status === 'PAID').length;
                                return (
                                    <tr key={apartment.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                        <td style={{ padding: '1rem', fontWeight: 800, fontSize: '1rem', position: 'sticky', left: 0, background: 'var(--bg-card)', zIndex: 1 }}>
                                            {apartment.number}
                                        </td>
                                        <td style={{ padding: '1rem', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)', position: 'sticky', left: '80px', background: 'var(--bg-card)', zIndex: 1 }}>
                                            {apartment.resident_name || apartment.residentName || '-'}
                                        </td>
                                        {months.map(m => {
                                            const payment = payments.find(p => Number(p.month) === Number(m.num));
                                            const isPaid = payment?.status === 'PAID';
                                            return (
                                                <td key={m.num} style={{ padding: '0.5rem', textAlign: 'center' }}>
                                                    {payment && (
                                                        <ProtectedAction requires="modify">
                                                            <motion.button
                                                                whileHover={{ scale: 1.1 }}
                                                                whileTap={{ scale: 0.95 }}
                                                                onClick={() => togglePayment(payment)}
                                                                style={{
                                                                    width: '36px',
                                                                    height: '36px',
                                                                    borderRadius: '8px',
                                                                    border: 'none',
                                                                    background: isPaid ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                                                                    color: isPaid ? '#10b981' : '#f43f5e',
                                                                    cursor: 'pointer',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    transition: 'all 0.2s'
                                                                }}
                                                            >
                                                                {isPaid ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                                                            </motion.button>
                                                        </ProtectedAction>
                                                    )}
                                                </td>
                                            );
                                        })}
                                        <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 900, fontSize: '1rem' }}>
                                            {paidCount}/12
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Payments;
