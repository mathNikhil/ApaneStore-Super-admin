import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminPricingAPI } from '../services/adminApi';
import Sidebar from '../components/Sidebar';

const CYCLE_LABELS = { monthly: 'Monthly', quarterly: 'Quarterly', annual: 'Annual' };
const CYCLE_ORDER = ['monthly', 'quarterly', 'annual'];

// ✅ Grouped by domain+hosting combination, each with its 3 billing-cycle
// rows (monthly/quarterly/annual) editable independently. The tenant's
// payment screen reads whichever row matches their combo + chosen cycle.
const PricingPlans = () => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [saving, setSaving] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            navigate('/login');
            return;
        }
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const result = await adminPricingAPI.getAll();
            if (result.success) setPlans(result.data);
        } catch (error) {
            console.error('Error fetching pricing plans:', error);
        } finally {
            setLoading(false);
        }
    };

    const startEdit = (plan) => {
        setEditingId(plan.id);
        setEditForm({
            display_name: plan.display_name,
            base_amount: plan.base_amount,
            tax_percentage: plan.tax_percentage,
            validity_days: plan.validity_days,
            is_active: plan.is_active,
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm({});
    };

    const saveEdit = async (id) => {
        setSaving(true);
        try {
            const result = await adminPricingAPI.update(id, editForm);
            if (result.success) {
                setPlans(prev => prev.map(p => p.id === id ? result.data : p));
                setEditingId(null);
            } else {
                alert(result.error || 'Failed to save');
            }
        } catch (error) {
            console.error('Error saving plan:', error);
            alert('Failed to save changes. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const totalFor = (plan) => {
        const base = parseFloat(plan.base_amount || 0);
        const tax = base * (parseFloat(plan.tax_percentage || 0) / 100);
        return (base + tax).toFixed(2);
    };

    // Group rows by plan_key, preserving a sensible cycle order within each group
    const grouped = plans.reduce((acc, plan) => {
        if (!acc[plan.plan_key]) acc[plan.plan_key] = [];
        acc[plan.plan_key].push(plan);
        return acc;
    }, {});
    Object.values(grouped).forEach(group => {
        group.sort((a, b) => CYCLE_ORDER.indexOf(a.billing_cycle) - CYCLE_ORDER.indexOf(b.billing_cycle));
    });

    return (
        <div style={styles.container}>
            <Sidebar />
            <div style={styles.main}>
                <div style={styles.header}>
                    <h1>💳 Pricing Plans</h1>
                    <span style={{ color: '#8e9eab' }}>
                        Controls what tenants pay when publishing, based on their domain/hosting choice and billing cycle
                    </span>
                </div>

                {loading ? (
                    <div style={styles.loading}>Loading pricing plans...</div>
                ) : (
                    <div style={styles.groupsWrap}>
                        {Object.entries(grouped).map(([planKey, cycles]) => (
                            <div key={planKey} style={styles.groupCard}>
                                <div style={styles.groupHeader}>
                                    <span style={styles.planKey}>{planKey}</span>
                                    <h3 style={styles.groupTitle}>{cycles[0]?.display_name}</h3>
                                </div>
                                <div style={styles.cycleRows}>
                                    {cycles.map((plan) => {
                                        const isEditing = editingId === plan.id;
                                        return (
                                            <div key={plan.id} style={styles.cycleRow}>
                                                <div style={styles.cycleLabelCol}>
                                                    <span style={styles.cycleLabel}>{CYCLE_LABELS[plan.billing_cycle] || plan.billing_cycle}</span>
                                                    <span style={plan.is_active ? styles.badgeActive : styles.badgeInactive}>
                                                        {plan.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>

                                                {isEditing ? (
                                                    <div style={styles.editCols}>
                                                        <div style={styles.fieldGroup}>
                                                            <label style={styles.label}>Base ₹</label>
                                                            <input
                                                                type="number"
                                                                style={styles.input}
                                                                value={editForm.base_amount}
                                                                onChange={(e) => setEditForm({ ...editForm, base_amount: e.target.value })}
                                                            />
                                                        </div>
                                                        <div style={styles.fieldGroup}>
                                                            <label style={styles.label}>Tax %</label>
                                                            <input
                                                                type="number"
                                                                style={styles.input}
                                                                value={editForm.tax_percentage}
                                                                onChange={(e) => setEditForm({ ...editForm, tax_percentage: e.target.value })}
                                                            />
                                                        </div>
                                                        <div style={styles.fieldGroup}>
                                                            <label style={styles.label}>Days</label>
                                                            <input
                                                                type="number"
                                                                style={styles.input}
                                                                value={editForm.validity_days}
                                                                onChange={(e) => setEditForm({ ...editForm, validity_days: e.target.value })}
                                                            />
                                                        </div>
                                                        <label style={styles.checkboxLabel}>
                                                            <input
                                                                type="checkbox"
                                                                checked={editForm.is_active}
                                                                onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                                                            />
                                                            Active
                                                        </label>
                                                        <div style={styles.actions}>
                                                            <button style={styles.saveBtn} disabled={saving} onClick={() => saveEdit(plan.id)}>
                                                                {saving ? '...' : 'Save'}
                                                            </button>
                                                            <button style={styles.cancelBtn} onClick={cancelEdit}>Cancel</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div style={styles.viewCols}>
                                                        <div style={styles.priceBlock}>
                                                            <span style={styles.price}>₹{parseFloat(plan.base_amount).toLocaleString('en-IN')}</span>
                                                            <span style={styles.priceSub}>+ {plan.tax_percentage}% tax</span>
                                                        </div>
                                                        <div style={styles.totalText}>
                                                            Total: <strong>₹{parseFloat(totalFor(plan)).toLocaleString('en-IN')}</strong>
                                                        </div>
                                                        <div style={styles.validityText}>{plan.validity_days} days</div>
                                                        <button style={styles.editBtn} onClick={() => startEdit(plan)}>Edit</button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const styles = {
    container: { display: 'flex', minHeight: '100vh', background: '#f5f6fa' },
    main: { flex: 1, marginLeft: '260px', padding: '32px' },
    header: { marginBottom: '28px', display: 'flex', flexDirection: 'column', gap: '4px' },
    loading: { textAlign: 'center', padding: '40px', color: '#666' },
    groupsWrap: { display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '900px' },
    groupCard: { background: '#fff', borderRadius: '14px', padding: '22px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' },
    groupHeader: { marginBottom: '14px' },
    planKey: { fontSize: '11px', color: '#8e9eab', fontFamily: 'monospace' },
    groupTitle: { fontSize: '17px', color: '#1a1a2e', margin: '2px 0 0' },
    cycleRows: { display: 'flex', flexDirection: 'column', gap: '10px' },
    cycleRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#f8f9fb', borderRadius: '10px', flexWrap: 'wrap', gap: '10px' },
    cycleLabelCol: { display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '110px' },
    cycleLabel: { fontWeight: '700', color: '#1a1a2e', fontSize: '14px' },
    badgeActive: { fontSize: '10px', fontWeight: '700', color: '#1e8e3e', background: '#e6f4ea', padding: '2px 8px', borderRadius: '999px', width: 'fit-content' },
    badgeInactive: { fontSize: '10px', fontWeight: '700', color: '#8e9eab', background: '#f0f2f5', padding: '2px 8px', borderRadius: '999px', width: 'fit-content' },
    viewCols: { display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' },
    priceBlock: { display: 'flex', alignItems: 'baseline', gap: '6px' },
    price: { fontSize: '20px', fontWeight: '800', color: '#1a1a2e' },
    priceSub: { fontSize: '12px', color: '#8e9eab' },
    totalText: { fontSize: '13px', color: '#556067' },
    validityText: { fontSize: '12px', color: '#8e9eab' },
    editBtn: { padding: '7px 14px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '7px', fontWeight: '600', fontSize: '12px', cursor: 'pointer' },
    editCols: { display: 'flex', alignItems: 'flex-end', gap: '12px', flexWrap: 'wrap' },
    fieldGroup: { display: 'flex', flexDirection: 'column', gap: '3px' },
    label: { fontSize: '11px', fontWeight: '600', color: '#556067' },
    input: { width: '80px', padding: '6px 8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px' },
    checkboxLabel: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#556067' },
    actions: { display: 'flex', gap: '8px' },
    saveBtn: { padding: '7px 14px', background: '#1e8e3e', color: '#fff', border: 'none', borderRadius: '7px', fontWeight: '600', fontSize: '12px', cursor: 'pointer' },
    cancelBtn: { padding: '7px 14px', background: '#f0f2f5', color: '#556067', border: 'none', borderRadius: '7px', fontWeight: '600', fontSize: '12px', cursor: 'pointer' },
};

export default PricingPlans;
