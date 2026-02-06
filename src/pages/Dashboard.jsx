import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Building2, Wallet, TrendingUp, TrendingDown, Clock,
    CheckCircle2, AlertTriangle, Plus, FileDown, ArrowUpRight, ArrowDownRight,
    Receipt
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    ResponsiveContainer, Cell, PieChart, Pie, Tooltip
} from 'recharts';
import { useData } from '../context/DataContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { loadArabicFont, addHeader, addFooter, COMPANY_COLOR, TEXT_MUTED } from '../utils/pdfHelper';

const Dashboard = () => {
    const { apartments, payments, expenses, loading, selectedYear, setSelectedYear } = useData();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();

    const [showExportModal, setShowExportModal] = useState(false);
    const [exportYear, setExportYear] = useState(selectedYear);

    const CHART_COLORS = ['#6b66ff', '#10b981', '#f43f5e', '#fbbf24', '#8b5cf6', '#94a3b8'];

    const years = useMemo(() => {
        const start = 2026;
        const end = 2050;
        return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    }, []);

    const dashboardData = useMemo(() => {
        // Safe default if loading
        if (loading) return {
            summary: {
                totalApartments: 0,
                totalPaidRecords: 0,
                totalPotentialRecords: 0,
                balance: 0
            },
            financials: {
                totalIncome: 0,
                totalExpenses: 0,
                incomeChange: 0,
                expenseChange: 0
            },
            expenseCategories: [],
            allPayments: [],
            alerts: [],
            recentActivity: {
                recentPayments: [],
                recentExpenses: []
            }
        };

        // 0. Safety filter: only count payments for existing apartments
        const activeApartmentIds = new Set(apartments.map(a => a.id));
        const validPayments = payments.filter(p => activeApartmentIds.has(p.apartment_id));

        // 1. Totals
        const totalApartments = apartments.length;

        // 2. Yearly Payments (summing all months)
        const paidPayments = validPayments.filter(p => p.status === 'PAID');

        const totalPaidRecords = paidPayments.length;
        const totalPotentialRecords = totalApartments * 12;

        // 3. Yearly Expenses (already filtered by DataContext)
        const yearlyExpenses = expenses;

        // 4. Financials
        const totalIncome = paidPayments.reduce((acc, curr) => acc + (curr.amount || 0), 0);
        const totalExpenses = yearlyExpenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);
        const balance = totalIncome - totalExpenses;

        // 5. Expense Categories
        const categoryMap = {};
        yearlyExpenses.forEach(e => {
            const cat = e.category || 'OTHER';
            categoryMap[cat] = (categoryMap[cat] || 0) + e.amount;
        });
        const expenseCategories = Object.keys(categoryMap).map(key => ({
            category: key,
            _sum: { amount: categoryMap[key] }
        }));

        // 6. Recent Activity (already sorted/limited by DataContext or locally)
        const recentPaymentsSelection = [...validPayments]
            .filter(p => p.status === 'PAID' && p.paid_at)
            .sort((a, b) => new Date(b.paid_at) - new Date(a.paid_at))
            .slice(0, 5)
            .map(p => ({
                ...p,
                apartment: apartments.find(a => a.id === p.apartment_id)
            }));

        const recentExpensesSelection = expenses.slice(0, 5);

        // 7. Alerts (Yearly Scale)
        const alerts = [];
        if (totalPaidRecords < (totalPotentialRecords / 2)) {
            alerts.push({ id: 1, type: 'danger', message: t('dashboard.low_collection_alert') || 'Low collection rate for this fiscal year.' });
        }
        if (balance < 0) {
            alerts.push({ id: 2, type: 'warning', message: t('dashboard.negative_balance_alert_year') || 'Expenses exceed income for this year.' });
        }

        return {
            summary: {
                totalApartments,
                totalPaidRecords,
                totalPotentialRecords,
                balance
            },
            financials: {
                totalIncome,
                totalExpenses,
                incomeChange: 0,
                expenseChange: 0
            },
            expenseCategories,
            allPayments: validPayments.map(p => ({
                ...p,
                apartment: apartments.find(a => a.id === p.apartment_id)
            })),
            alerts,
            recentActivity: {
                recentPayments: recentPaymentsSelection,
                recentExpenses: recentExpensesSelection
            }
        };
    }, [apartments, payments, expenses, loading, selectedYear, t]);

    const generateAnnualReport = async () => {
        const isAr = i18n.language === 'ar';
        const doc = new jsPDF('p', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();

        // Load Arabic Font
        await loadArabicFont(doc);

        // --- Page 1: Executive Summary ---
        addHeader(doc, isAr ? 'التقرير المالي السنوي' : 'Annual Financial Report', `${t('dashboard.yearly_overview')} - ${exportYear}`, isAr);

        // Financial Highlights Box
        doc.setDrawColor(241, 245, 249);
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(14, 45, pageWidth - 28, 40, 3, 3, 'FD');

        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text(isAr ? 'مجموع المداخيل' : 'Total Income', 25, 55);
        doc.text(isAr ? 'مجموع المصاريف' : 'Total Expenses', 25, 65);
        doc.text(isAr ? 'صافي الرصيد' : 'Net Balance', 25, 75);

        doc.setFontSize(12);
        doc.setTextColor(15, 23, 42);
        doc.text(`${financials.totalIncome} DH`, pageWidth - 25, 55, { align: 'right' });
        doc.text(`${financials.totalExpenses} DH`, pageWidth - 25, 65, { align: 'right' });

        const balanceColor = summary.balance >= 0 ? [16, 185, 129] : [244, 63, 94];
        doc.setTextColor(...balanceColor);
        doc.text(`${summary.balance} DH`, pageWidth - 25, 75, { align: 'right' });

        // Financial Details
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(10);
        doc.text(isAr ? 'معدل الاستخلاص' : 'Collection Rate', 25, 95);
        doc.setTextColor(15, 23, 42);
        doc.text(`${collectionRate}%`, pageWidth - 25, 95, { align: 'right' });

        // --- Page 2: Expenses Details ---
        if (expenses.length > 0) {
            doc.addPage();
            addHeader(doc, isAr ? 'تفاصيل المصاريف' : 'Expense Details', `${exportYear}`, isAr);

            const expenseData = expenses.map(e => [
                e.description,
                t(`expenses_page.${e.category?.toLowerCase() || 'other'}`),
                new Date(e.date).toLocaleDateString(),
                `${e.amount} DH`
            ]);

            // Reorder for RTL if needed, but simple arrays usually render LTR in code order
            // If table is RTL, columns reverse. 
            // Correct column order for Arabic: Amount | Date | Category | Description
            // But jsPDF AutoTable handles RTL columns if `styles: { direction: 'rtl' }` ? No, simpler to just reverse the array of data.

            let headRow = [t('expenses_page.description'), t('expenses_page.category'), t('expenses_page.date'), t('expenses_page.amount')];
            let bodyData = expenseData;

            if (isAr) {
                headRow = [t('expenses_page.amount'), t('expenses_page.date'), t('expenses_page.category'), t('expenses_page.description')];
                bodyData = expenses.map(e => [
                    `${e.amount} DH`,
                    new Date(e.date).toLocaleDateString(),
                    t(`expenses_page.${e.category?.toLowerCase() || 'other'}`),
                    e.description
                ]);
            }

            autoTable(doc, {
                startY: 40,
                head: [headRow],
                body: bodyData,
                theme: 'striped',
                styles: {
                    font: 'Amiri', // CRITICAL for Arabic
                    fontSize: 9,
                    cellPadding: 3,
                    halign: isAr ? 'right' : 'left'
                },
                headStyles: {
                    fillColor: [107, 102, 255],
                    font: 'Amiri',
                    halign: isAr ? 'right' : 'left'
                },
            });
        }

        // Footer for all pages
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            addFooter(doc, i, pageCount);
        }

        doc.save(`annual_report_${exportYear}.pdf`);
        setShowExportModal(false);
    };

    const { summary, financials, expenseCategories, alerts, recentActivity } = dashboardData || {
        summary: {}, financials: {}, expenseCategories: [], alerts: [], recentActivity: { recentPayments: [], recentExpenses: [] }
    };

    // Derived state
    const collectionRate = summary.totalPotentialRecords ? Math.round((summary.totalPaidRecords / summary.totalPotentialRecords) * 100) : 0;

    // CONDITIONAL RENDER AT THE END
    if (loading) return (
        <div style={{ height: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{
                    width: '48px',
                    height: '48px',
                    border: '4px solid #f3f4f6',
                    borderTop: '4px solid var(--primary)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 1.5rem'
                }}></div>
                <div style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{t('dashboard.syncing')}</div>
            </div>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="dashboard-container animate-slide-up">
            {/* Header & Controls */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{t('dashboard.title')} <span style={{ color: 'var(--primary)' }}>{t('dashboard.hub')}</span></h1>
                    <p style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem' }}>{t('dashboard.yearly_overview')} - {selectedYear}</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-card)', padding: '0.5rem', borderRadius: '1rem', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' }}>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            style={{
                                width: 'auto',
                                border: 'none',
                                background: 'transparent',
                                color: 'var(--text-primary)',
                                fontWeight: 700,
                                padding: '0.25rem 0.5rem',
                                cursor: 'pointer'
                            }}
                        >
                            {years.map(y => (
                                <option
                                    key={y}
                                    value={y}
                                    style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                                >
                                    {y}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button
                        className="btn-ghost"
                        style={{ height: '3rem', background: 'var(--bg-card)', border: 'none', boxShadow: 'var(--shadow-sm)', borderRadius: '1rem' }}
                        onClick={() => setShowExportModal(true)}
                        title={t('dashboard.export_report')}
                    >
                        <FileDown size={20} />
                        <span>{t('dashboard.export_report')}</span>
                    </button>
                    <button className="btn-primary" onClick={() => navigate('/expenses')}>
                        <Plus size={18} />
                        <span>{t('dashboard.record_expense')}</span>
                    </button>
                </div>
            </header>

            <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
                <SummaryCard title={t('dashboard.total_units')} value={summary.totalApartments} sub={t('dashboard.registered')} icon={<Building2 />} color="var(--primary)" />
                <SummaryCard title={t('dashboard.paid_contributions')} value={summary.totalPaidRecords} sub={t('dashboard.this_year')} icon={<CheckCircle2 />} color="#10b981" />
                <SummaryCard title={t('dashboard.pending_contributions')} value={summary.totalPotentialRecords - summary.totalPaidRecords} sub={t('dashboard.this_year')} icon={<Clock />} color="#f43f5e" />
                <SummaryCard title={t('dashboard.total_balance')} value={`${(summary.balance).toLocaleString()} DH`} sub={t('dashboard.net_reserve')} icon={<Wallet />} color="#6366f1" />
            </div>

            <div className="dashboard-main-split" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="financial-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                        <FinancialCard
                            title={t('dashboard.income')}
                            amount={financials.totalIncome}
                            change={financials.incomeChange}
                            icon={<TrendingUp />}
                            positive
                        />
                        <FinancialCard
                            title={t('dashboard.expenses')}
                            amount={financials.totalExpenses}
                            change={financials.expenseChange}
                            icon={<TrendingDown />}
                            danger
                        />
                        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{t('dashboard.collection_rate')}</p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                <span style={{ fontWeight: 800, fontSize: '1.25rem' }}>{collectionRate}%</span>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{summary.totalPaidRecords}/{summary.totalPotentialRecords} {t('dashboard.paid_of_year')}</span>
                            </div>
                            <div style={{ height: '8px', background: 'var(--bg-active)', borderRadius: '10px', overflow: 'hidden' }}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${collectionRate}%` }}
                                    style={{ height: '100%', background: 'var(--primary)', borderRadius: '10px' }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="activity-split" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
                        <div className="card" style={{ padding: 0 }}>
                            <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>{t('dashboard.collection_progress')}</h3>
                                <button className="btn-ghost" style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }} onClick={() => navigate('/payments')}>View Details</button>
                            </div>
                            <div style={{ overflowX: 'auto', maxHeight: '400px' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 10 }}>
                                        <tr>
                                            <th style={{ padding: '1rem 1.5rem', fontSize: '0.7rem' }}>{t('dashboard.unit')}</th>
                                            <th style={{ padding: '1rem 1.5rem', fontSize: '0.7rem' }}>{t('dashboard.owner')}</th>
                                            <th style={{ padding: '1rem 1.5rem', fontSize: '0.7rem' }}>{t('dashboard.annual_status')}</th>
                                            <th style={{ padding: '1rem 1.5rem', fontSize: '0.7rem', textAlign: 'right' }}>{t('dashboard.total_paid')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {apartments.map(apt => {
                                            const aptPayments = payments.filter(p => p.apartment_id === apt.id);
                                            const paidCount = aptPayments.filter(p => p.status === 'PAID').length;
                                            const totalAmount = aptPayments.filter(p => p.status === 'PAID').reduce((acc, curr) => acc + (curr.amount || 0), 0);

                                            return (
                                                <tr key={apt.id}>
                                                    <td style={{ padding: '1rem 1.5rem', fontWeight: 700 }}>{t('apartments.unit')} {apt.number || '??'}</td>
                                                    <td style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{apt.resident_name || apt.residentName || 'Anonymous'}</td>
                                                    <td style={{ padding: '1rem 1.5rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <div style={{ flex: 1, height: '6px', background: 'var(--bg-active)', borderRadius: '10px', overflow: 'hidden', minWidth: '60px' }}>
                                                                <div style={{ height: '100%', width: `${(paidCount / 12) * 100}%`, background: paidCount === 12 ? '#10b981' : 'var(--primary)', borderRadius: '10px' }} />
                                                            </div>
                                                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: paidCount === 12 ? '#10b981' : 'var(--text-primary)' }}>{paidCount}/12</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right', fontWeight: 800 }}>{totalAmount.toLocaleString()} DH</td>
                                                </tr>
                                            );
                                        })}
                                        {apartments.length === 0 && (
                                            <tr>
                                                <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>{t('dashboard.no_data')}</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="card">
                            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.5rem' }}>{t('dashboard.expense_breakdown')}</h3>
                            <div style={{ width: '100%', height: '260px', marginBottom: '1rem', position: 'relative' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={expenseCategories}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="_sum.amount"
                                            nameKey="category"
                                        >
                                            {expenseCategories.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {expenseCategories.map((cat, i) => (
                                    <div key={cat.category} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: CHART_COLORS[i % CHART_COLORS.length] }} />
                                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{cat.category}</span>
                                        </div>
                                        <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>{cat._sum.amount.toLocaleString()} DH</span>
                                    </div>
                                ))}
                                {expenseCategories.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t('dashboard.no_expenses')}</p>}
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="card" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>{t('dashboard.recent_activity')}</h3>
                            <Clock size={18} color="var(--text-muted)" />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            {recentActivity.recentPayments.map(p => (
                                <ActivityItem
                                    key={p.id}
                                    title={`${t('nav.payments')}: ${t('apartments.unit')} ${p.apartment?.number || '??'}`}
                                    sub={`${p.amount} DH • ${new Date(p.paid_at).toLocaleDateString(i18n.language)}`}
                                    type="income"
                                />
                            ))}
                            {recentActivity.recentExpenses.map(e => (
                                <ActivityItem
                                    key={e.id}
                                    title={e.category}
                                    sub={`${e.amount} DH • ${new Date(e.date).toLocaleDateString(i18n.language)}`}
                                    type="expense"
                                />
                            ))}
                            {recentActivity.recentPayments.length === 0 && recentActivity.recentExpenses.length === 0 && (
                                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t('dashboard.no_activity')}</p>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', paddingLeft: '0.5rem' }}>{t('dashboard.system_alerts')}</h4>
                        <AnimatePresence>
                            {alerts.map(alert => (
                                <motion.div
                                    key={alert.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={`card alert-${alert.type}`}
                                    style={{
                                        padding: '1rem',
                                        display: 'flex',
                                        gap: '1rem',
                                        border: '1.5px solid var(--border-light)',
                                        background: 'var(--bg-main)',
                                        color: alert.type === 'danger' ? '#f43f5e' : '#fbbf24'
                                    }}
                                >
                                    <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.4)', borderRadius: '0.75rem' }}>
                                        <AlertTriangle size={20} />
                                    </div>
                                    <p style={{ fontSize: '0.8rem', fontWeight: 700, lineHeight: 1.4 }}>{alert.message}</p>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {alerts.length === 0 && (
                            <div className="card" style={{ textAlign: 'center', padding: '1.5rem', background: 'var(--bg-main)', border: '1.5px solid var(--border-light)' }}>
                                <CheckCircle2 size={24} color="#10b981" style={{ marginBottom: '0.5rem' }} />
                                <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#10b981' }}>{t('dashboard.health_stable')}</p>
                            </div>
                        )}
                    </div>

                    <div className="card" style={{ background: 'var(--primary)', color: 'white', padding: '1.5rem', border: 'none', boxShadow: 'var(--shadow-premium)' }}>
                        <h3 style={{ fontWeight: 800, marginBottom: '0.5rem' }}>{t('dashboard.quick_actions')}</h3>
                        <p style={{ fontSize: '0.8rem', opacity: 0.8, marginBottom: '1.5rem' }}>{t('dashboard.manual_entry')}</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <ShortcutBtn onClick={() => navigate('/apartments')} label={t('dashboard.add_apartment')} icon={<Building2 size={16} />} />
                            <ShortcutBtn onClick={() => navigate('/expenses')} label={t('dashboard.record_expense')} icon={<Receipt size={16} />} />
                            <ShortcutBtn onClick={() => setShowExportModal(true)} label={t('dashboard.export_report')} icon={<FileDown size={16} />} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Export Modal */}
            {showExportModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="card"
                        style={{ width: '400px', padding: '2rem', background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}
                    >
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>{t('dashboard.export_report')}</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Select the fiscal year for the annual financial report.</p>

                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Fiscal Year</label>
                            <select
                                value={exportYear}
                                onChange={(e) => setExportYear(parseInt(e.target.value))}
                                className="form-input"
                                style={{
                                    width: '100%',
                                    height: '3.5rem',
                                    background: 'var(--bg-main)',
                                    color: 'var(--text-primary)',
                                    border: '1.5px solid var(--border-light)',
                                    borderRadius: '1rem',
                                    padding: '0 1rem',
                                    fontWeight: 700
                                }}
                            >
                                {years.map(y => (
                                    <option
                                        key={y}
                                        value={y}
                                        style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                                    >
                                        {y}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setShowExportModal(false)}>{t('common.cancel')}</button>
                            <button className="btn-primary" style={{ flex: 1 }} onClick={generateAnnualReport}>{i18n.language === 'ar' ? 'تصدير' : 'Export PDF'}</button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

const SummaryCard = ({ title, value, sub, icon, color }) => (
    <div className="card" style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
        <div style={{ width: '52px', height: '52px', borderRadius: '1rem', background: `${color}15`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {React.cloneElement(icon, { size: 24 })}
        </div>
        <div>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{title}</p>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900 }}>{value.toLocaleString()}</h2>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{sub}</p>
        </div>
    </div>
);

const FinancialCard = ({ title, amount, change, icon, positive, danger }) => (
    <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--bg-main)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {React.cloneElement(icon, { size: 18 })}
            </div>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem',
                fontSize: '0.75rem',
                fontWeight: 800,
                color: change >= 0 ? (positive ? '#10b981' : '#f43f5e') : (positive ? '#f43f5e' : '#10b981')
            }}>
                {change >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {Math.abs(Math.round(change))}%
            </div>
        </div>
        <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{title}</p>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 900 }}>{(amount || 0).toLocaleString()} <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>DH</span></h3>
    </div>
);

const ActivityItem = ({ title, sub, type }) => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: type === 'income' ? '#10b981' : '#f43f5e' }} />
        <div style={{ flex: 1 }}>
            <p style={{ fontSize: '0.85rem', fontWeight: 700 }}>{title}</p>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{sub}</p>
        </div>
    </div>
);

const ShortcutBtn = ({ label, icon, onClick }) => (
    <button onClick={onClick} style={{ width: '100%', justifyContent: 'flex-start', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '0.75rem', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {icon}
        {label}
    </button>
);

export default Dashboard;
