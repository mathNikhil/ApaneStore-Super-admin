import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminPricingAPI } from '../services/adminApi';
import Sidebar from '../components/Sidebar';
import API_BASE_URL from '../config/api';

const CYCLE_LABELS = { '30days': '30 Days', '90days': '90 Days', '365days': '365 Days', monthly: '30 Days', quarterly: '90 Days', annual: '365 Days', trial: 'Trial' };
const CYCLE_ORDER = ['30days', '90days', '365days', 'monthly', 'quarterly', 'annual'];

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


    // Trial config state
    const [trialDays, setTrialDays] = React.useState(3);
    const [trialSaving, setTrialSaving] = React.useState(false);
    const [trialMsg, setTrialMsg] = React.useState('');

    // Discount config state
    const [discountSettings, setDiscountSettings] = React.useState({
        first_publish_discount: 50,
        repeat_publish_discount: 25,
        referral_bonus_percent: 10,
        max_referral_count: 5,
    });
    const [discountSaving, setDiscountSaving] = React.useState(false);
    const [discountMsg, setDiscountMsg] = React.useState('');

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            navigate('/login');
            return;
        }
        fetchPlans();
        // Fetch discount settings
        fetch(`${API_BASE_URL}/api/admin/discount-settings`, { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } })
            .then(r => r.json()).then(d => { if (d.success) setDiscountSettings(d.data); }).catch(() => {});
        // Fetch trial days
        fetch(`${API_BASE_URL}/api/admin/settings`, { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } })
            .then(r => r.json()).then(d => { if (d.success && d.data.draftStoreExpiryDays) setTrialDays(d.data.draftStoreExpiryDays); }).catch(() => {});
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

    const handleTrialSave = async () => {
        setTrialSaving(true); setTrialMsg('');
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${API_BASE_URL}/api/admin/settings`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ draftStoreExpiryDays: trialDays }),
            });
            const d = await res.json();
            setTrialMsg(d.success ? '✅ Saved!' : '❌ Failed');
        } catch { setTrialMsg('❌ Failed'); }
        finally { setTrialSaving(false); }
    };

    const handleDiscountSave = async () => {
        setDiscountSaving(true); setDiscountMsg('');
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${API_BASE_URL}/api/admin/discount-settings`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(discountSettings),
            });
            const d = await res.json();
            setDiscountMsg(d.success ? '✅ Saved!' : '❌ Failed');
        } catch { setDiscountMsg('❌ Failed'); }
        finally { setDiscountSaving(false); }
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

            {/* Trial Configuration */}
            <div style={{background:'#fff',borderRadius:'14px',padding:'22px',boxShadow:'0 2px 10px rgba(0,0,0,0.06)',maxWidth:'900px',marginTop:'24px'}}>
                <h2 style={{fontSize:'17px',fontWeight:'700',color:'#1a1a2e',marginBottom:'4px'}}>Trial Configuration</h2>
                <p style={{fontSize:'12px',color:'#8e9eab',marginBottom:'16px'}}>Set the number of days for free trial period</p>
                <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                    <div>
                        <label style={{fontSize:'12px',fontWeight:'600',color:'#556067',display:'block',marginBottom:'4px'}}>Trial Days</label>
                        <input type="number" value={trialDays} onChange={e => setTrialDays(parseInt(e.target.value))}
                            style={{width:'100px',padding:'8px',border:'1px solid #ddd',borderRadius:'6px',fontSize:'15px',fontWeight:'700'}} />
                    </div>
                    <button onClick={handleTrialSave} disabled={trialSaving}
                        style={{padding:'10px 20px',background:'#1e8e3e',color:'#fff',border:'none',borderRadius:'8px',fontWeight:'700',fontSize:'13px',cursor:'pointer',marginTop:'18px'}}>
                        {trialSaving ? 'Saving...' : 'Save'}
                    </button>
                    {trialMsg && <span style={{fontSize:'13px',marginTop:'18px'}}>{trialMsg}</span>}
                </div>
            </div>

            {/* Discount Configuration */}
            <div style={{background:'#fff',borderRadius:'14px',padding:'22px',boxShadow:'0 2px 10px rgba(0,0,0,0.06)',maxWidth:'900px',marginTop:'24px',marginBottom:'32px'}}>
                <h2 style={{fontSize:'17px',fontWeight:'700',color:'#1a1a2e',marginBottom:'4px'}}>Discount Configuration</h2>
                <p style={{fontSize:'12px',color:'#8e9eab',marginBottom:'20px'}}>Configure publish discounts per billing cycle. Applies to all plans equally.</p>

                {/* First Publish */}
                <div style={{marginBottom:'20px'}}>
                    <h3 style={{fontSize:'14px',fontWeight:'700',color:'#1a1a2e',marginBottom:'12px',padding:'8px 12px',background:'#e6f4ea',borderRadius:'8px'}}>🎉 First Publish Discounts</h3>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'12px'}}>
                        {[
                            {key:'first_publish_30days', label:'30 Days (%)'},
                            {key:'first_publish_90days', label:'90 Days (%)'},
                            {key:'first_publish_365days', label:'365 Days (%)'},
                        ].map(f => (
                            <div key={f.key} style={{background:'#f8f9fb',borderRadius:'10px',padding:'14px'}}>
                                <label style={{fontSize:'12px',fontWeight:'600',color:'#556067',display:'block',marginBottom:'4px'}}>{f.label}</label>
                                <input type="number" min="0" max="100" value={discountSettings[f.key] ?? ''} onChange={e => setDiscountSettings(prev => ({...prev,[f.key]:parseFloat(e.target.value)}))}
                                    style={{width:'100%',padding:'8px',border:'1px solid #ddd',borderRadius:'6px',fontSize:'18px',fontWeight:'800',textAlign:'center'}} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Repeat Publish */}
                <div style={{marginBottom:'20px'}}>
                    <h3 style={{fontSize:'14px',fontWeight:'700',color:'#1a1a2e',marginBottom:'12px',padding:'8px 12px',background:'#e8f0fe',borderRadius:'8px'}}>🔄 Second Publish Discounts</h3>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'12px'}}>
                        {[
                            {key:'repeat_publish_30days', label:'30 Days (%)'},
                            {key:'repeat_publish_90days', label:'90 Days (%)'},
                            {key:'repeat_publish_365days', label:'365 Days (%)'},
                        ].map(f => (
                            <div key={f.key} style={{background:'#f8f9fb',borderRadius:'10px',padding:'14px'}}>
                                <label style={{fontSize:'12px',fontWeight:'600',color:'#556067',display:'block',marginBottom:'4px'}}>{f.label}</label>
                                <input type="number" min="0" max="100" value={discountSettings[f.key] ?? ''} onChange={e => setDiscountSettings(prev => ({...prev,[f.key]:parseFloat(e.target.value)}))}
                                    style={{width:'100%',padding:'8px',border:'1px solid #ddd',borderRadius:'6px',fontSize:'18px',fontWeight:'800',textAlign:'center'}} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Third+ Publish */}
                <div style={{marginBottom:'20px'}}>
                    <h3 style={{fontSize:'14px',fontWeight:'700',color:'#1a1a2e',marginBottom:'12px',padding:'8px 12px',background:'#fff3e0',borderRadius:'8px'}}>3️⃣ Third+ Publish Discounts (configurable per market)</h3>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'12px'}}>
                        {[
                            {key:'third_publish_30days', label:'30 Days (%)'},
                            {key:'third_publish_90days', label:'90 Days (%)'},
                            {key:'third_publish_365days', label:'365 Days (%)'},
                        ].map(f => (
                            <div key={f.key} style={{background:'#f8f9fb',borderRadius:'10px',padding:'14px'}}>
                                <label style={{fontSize:'12px',fontWeight:'600',color:'#556067',display:'block',marginBottom:'4px'}}>{f.label}</label>
                                <input type="number" min="0" max="100" value={discountSettings[f.key] ?? ''} onChange={e => setDiscountSettings(prev => ({...prev,[f.key]:parseFloat(e.target.value)}))}
                                    style={{width:'100%',padding:'8px',border:'1px solid #ddd',borderRadius:'6px',fontSize:'18px',fontWeight:'800',textAlign:'center'}} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Referral */}
                <div style={{marginBottom:'20px'}}>
                    <h3 style={{fontSize:'14px',fontWeight:'700',color:'#1a1a2e',marginBottom:'12px',padding:'8px 12px',background:'#fce4ec',borderRadius:'8px'}}>🎁 Referral Bonus (One Time Use)</h3>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
                        {[
                            {key:'referral_bonus_percent', label:'Bonus % per Referral', desc:'Shown to tenant (actual = this% of 2nd publish discount)'},
                            {key:'max_referral_count', label:'Max Referrals per Tenant', desc:'Maximum referrals that can earn bonus'},
                        ].map(f => (
                            <div key={f.key} style={{background:'#f8f9fb',borderRadius:'10px',padding:'14px'}}>
                                <label style={{fontSize:'12px',fontWeight:'600',color:'#556067',display:'block',marginBottom:'4px'}}>{f.label}</label>
                                <input type="number" min="0" value={discountSettings[f.key] ?? ''} onChange={e => setDiscountSettings(prev => ({...prev,[f.key]:parseFloat(e.target.value)}))}
                                    style={{width:'100%',padding:'8px',border:'1px solid #ddd',borderRadius:'6px',fontSize:'18px',fontWeight:'800',textAlign:'center'}} />
                                <p style={{fontSize:'11px',color:'#8e9eab',marginTop:'4px'}}>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {discountMsg && <p style={{fontSize:'13px',marginBottom:'12px'}}>{discountMsg}</p>}
                <button onClick={handleDiscountSave} disabled={discountSaving}
                    style={{padding:'10px 24px',background:'#1e8e3e',color:'#fff',border:'none',borderRadius:'8px',fontWeight:'700',fontSize:'13px',cursor:'pointer'}}>
                    {discountSaving ? 'Saving...' : 'Save All Discount Settings'}
                </button>
            </div>
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
