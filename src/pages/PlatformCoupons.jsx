import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { platformCouponsAPI } from '../services/adminApi';

const UNIT_LABELS = { percent: '% off', flat: '₹ flat off', free_shipping: 'Free Shipping' };

const badge = (status) => {
    const map = {
        active:   { bg: 'rgba(46,213,115,0.15)',  color: '#2ecc71',  label: 'Active' },
        disabled: { bg: 'rgba(142,158,171,0.15)', color: '#8e9eab',  label: 'Disabled' },
        exhausted:{ bg: 'rgba(231,76,60,0.15)',   color: '#e74c3c',  label: 'Exhausted' },
    };
    const s = map[status] || map.disabled;
    return (
        <span style={{ padding:'3px 10px', borderRadius:12, fontSize:12, fontWeight:600,
            background: s.bg, color: s.color, display:'inline-block' }}>
            {s.label}
        </span>
    );
};

const emptyForm = {
    name: '', code: '', unit: 'percent', value: '', min_order_value: '',
    max_stores: '', validity_days: 30, max_uses_per_store: '',
};

export default function PlatformCoupons() {
    const navigate = useNavigate();
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState('');
    const [claimsModal, setClaimsModal] = useState(null); // { coupon, data }
    const [claimsLoading, setClaimsLoading] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) { navigate('/login'); return; }
        load();
    }, []);

    const load = async () => {
        setLoading(true);
        const res = await platformCouponsAPI.getAll();
        if (res.success) setCoupons(res.data);
        setLoading(false);
    };

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleCreate = async () => {
        setErr('');
        if (!form.name.trim() || !form.code.trim() || !form.value) {
            setErr('Name, code and discount value are required.'); return;
        }
        setSaving(true);
        const payload = {
            name: form.name.trim(),
            code: form.code.trim().toUpperCase(),
            unit: form.unit,
            value: parseFloat(form.value),
            min_order_value: parseFloat(form.min_order_value) || 0,
            max_stores: form.max_stores ? parseInt(form.max_stores) : null,
            validity_days: parseInt(form.validity_days) || 30,
            max_uses_per_store: form.max_uses_per_store ? parseInt(form.max_uses_per_store) : null,
        };
        const res = await platformCouponsAPI.create(payload);
        setSaving(false);
        if (res.success) {
            setShowForm(false);
            setForm(emptyForm);
            load();
        } else {
            setErr(res.error || 'Failed to create');
        }
    };

    const handleDisable = async (id) => {
        if (!confirm('Disable this platform coupon? Stores that already claimed it keep their copy.')) return;
        await platformCouponsAPI.disable(id);
        load();
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this coupon? Only possible if no store has claimed it yet.')) return;
        const res = await platformCouponsAPI.remove(id);
        if (!res.success) alert(res.error);
        load();
    };

    const openClaims = async (coupon) => {
        setClaimsLoading(true);
        setClaimsModal({ coupon, data: [] });
        const res = await platformCouponsAPI.getClaims(coupon.id);
        setClaimsModal({ coupon, data: res.success ? res.data : [] });
        setClaimsLoading(false);
    };

    const s = styles;

    return (
        <div style={s.layout}>
            <Sidebar />
            <div style={s.main}>
                <div style={s.header}>
                    <div>
                        <h1 style={s.title}>🎟️ Platform Coupons</h1>
                        <p style={s.sub}>Create coupons that auto-distribute to tenant stores on publish</p>
                    </div>
                    <button style={s.btnPrimary} onClick={() => setShowForm(true)}>+ Create Coupon</button>
                </div>

                {loading ? (
                    <div style={s.empty}>Loading...</div>
                ) : coupons.length === 0 ? (
                    <div style={s.emptyBox}>
                        <div style={{ fontSize:40, marginBottom:12 }}>🎟️</div>
                        <div style={{ fontWeight:600, color:'#1e293b', marginBottom:6 }}>No platform coupons yet</div>
                        <div style={{ fontSize:13, color:'#8e9eab' }}>Create a coupon and it will auto-apply to stores when they publish</div>
                    </div>
                ) : (
                    <div style={s.tableWrap}>
                        <table style={s.table}>
                            <thead>
                                <tr>
                                    {['Name','Code','Discount','Min Order','Validity','Stores','Status','Actions'].map(h => (
                                        <th key={h} style={s.th}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {coupons.map(c => (
                                    <tr key={c.id}>
                                        <td style={s.td}><span style={{ fontWeight:600 }}>{c.name}</span></td>
                                        <td style={s.td}>
                                            <code style={{ background:'#f1f5f9', padding:'2px 8px', borderRadius:6,
                                                fontFamily:'monospace', fontSize:13, fontWeight:700, color:'#6366f1' }}>
                                                {c.code}
                                            </code>
                                        </td>
                                        <td style={s.td}>
                                            {c.unit === 'free_shipping'
                                                ? 'Free Shipping'
                                                : `${c.unit === 'flat' ? '₹' : ''}${c.value}${c.unit === 'percent' ? '%' : ''} off`}
                                        </td>
                                        <td style={s.td}>{c.min_order_value > 0 ? `₹${c.min_order_value}` : '—'}</td>
                                        <td style={s.td}>{c.validity_days} days</td>
                                        <td style={s.td}>
                                            <button style={s.linkBtn} onClick={() => openClaims(c)}>
                                                {c.claimed_count_live ?? c.claimed_count}
                                                {c.max_stores ? ` / ${c.max_stores}` : ''} stores
                                            </button>
                                        </td>
                                        <td style={s.td}>{badge(c.status)}</td>
                                        <td style={s.td}>
                                            <div style={{ display:'flex', gap:6 }}>
                                                {c.status === 'active' && (
                                                    <button style={s.btnWarn} onClick={() => handleDisable(c.id)}>Disable</button>
                                                )}
                                                <button style={s.btnDanger} onClick={() => handleDelete(c.id)}>Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Create Form Drawer */}
                {showForm && (
                    <div style={s.overlay}>
                        <div style={s.drawer}>
                            <div style={s.drawerHead}>
                                <h2 style={{ margin:0, fontSize:18, fontWeight:700 }}>Create Platform Coupon</h2>
                                <button style={s.close} onClick={() => { setShowForm(false); setErr(''); setForm(emptyForm); }}>✕</button>
                            </div>
                            <div style={s.drawerBody}>
                                {err && <div style={s.errBox}>{err}</div>}

                                <Label>Coupon Name *</Label>
                                <input style={s.input} value={form.name} onChange={e => set('name', e.target.value)}
                                    placeholder="e.g. Launch Offer 2026" />

                                <Label>Coupon Code *</Label>
                                <input style={s.input} value={form.code} onChange={e => set('code', e.target.value.toUpperCase())}
                                    placeholder="e.g. LAUNCH20" />
                                <div style={s.hint}>Store owners will share this code with their customers</div>

                                <Label>Discount Type *</Label>
                                <select style={s.input} value={form.unit} onChange={e => set('unit', e.target.value)}>
                                    <option value="percent">% Percentage off</option>
                                    <option value="flat">₹ Flat off</option>
                                    <option value="free_shipping">Free Shipping</option>
                                </select>

                                {form.unit !== 'free_shipping' && (
                                    <>
                                        <Label>Discount Value *</Label>
                                        <input style={s.input} type="number" min="0" value={form.value}
                                            onChange={e => set('value', e.target.value)}
                                            placeholder={form.unit === 'percent' ? 'e.g. 20' : 'e.g. 100'} />
                                    </>
                                )}

                                <Label>Minimum Order Value (₹)</Label>
                                <input style={s.input} type="number" min="0" value={form.min_order_value}
                                    onChange={e => set('min_order_value', e.target.value)}
                                    placeholder="0 = no minimum" />

                                <Label>Validity (days from store publish)</Label>
                                <input style={s.input} type="number" min="1" value={form.validity_days}
                                    onChange={e => set('validity_days', e.target.value)}
                                    placeholder="30" />

                                <Label>Max Stores That Can Claim</Label>
                                <input style={s.input} type="number" min="1" value={form.max_stores}
                                    onChange={e => set('max_stores', e.target.value)}
                                    placeholder="Leave empty = unlimited" />

                                <Label>Max Uses Per Store</Label>
                                <input style={s.input} type="number" min="1" value={form.max_uses_per_store}
                                    onChange={e => set('max_uses_per_store', e.target.value)}
                                    placeholder="Leave empty = unlimited" />

                                <div style={{ marginTop:24, display:'flex', gap:12 }}>
                                    <button style={s.btnPrimary} onClick={handleCreate} disabled={saving}>
                                        {saving ? 'Creating…' : 'Create Coupon'}
                                    </button>
                                    <button style={s.btnSecondary} onClick={() => { setShowForm(false); setErr(''); setForm(emptyForm); }}>
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Claims Modal */}
                {claimsModal && (
                    <div style={s.overlay}>
                        <div style={{ ...s.drawer, maxWidth:600 }}>
                            <div style={s.drawerHead}>
                                <h2 style={{ margin:0, fontSize:18, fontWeight:700 }}>
                                    Claims — {claimsModal.coupon.code}
                                </h2>
                                <button style={s.close} onClick={() => setClaimsModal(null)}>✕</button>
                            </div>
                            <div style={s.drawerBody}>
                                {claimsLoading ? (
                                    <div style={{ padding:40, textAlign:'center', color:'#8e9eab' }}>Loading claims…</div>
                                ) : claimsModal.data.length === 0 ? (
                                    <div style={{ padding:40, textAlign:'center', color:'#8e9eab' }}>No stores have claimed this coupon yet</div>
                                ) : (
                                    <table style={{ ...s.table, marginTop:0 }}>
                                        <thead>
                                            <tr>
                                                {['Store','Subdomain','Claimed At','Uses','Status'].map(h => (
                                                    <th key={h} style={s.th}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {claimsModal.data.map(cl => (
                                                <tr key={cl.id}>
                                                    <td style={s.td}>{cl.store_name}</td>
                                                    <td style={s.td}>{cl.subdomain}</td>
                                                    <td style={s.td}>{new Date(cl.claimed_at).toLocaleDateString('en-IN')}</td>
                                                    <td style={s.td}>{cl.current_uses ?? 0}</td>
                                                    <td style={s.td}>{badge(cl.coupon_status || 'active')}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

const Label = ({ children }) => (
    <div style={{ fontSize:12, fontWeight:600, color:'#64748b', textTransform:'uppercase',
        letterSpacing:'0.05em', marginBottom:6, marginTop:16 }}>{children}</div>
);

const styles = {
    layout:     { display:'flex', minHeight:'100vh', background:'#f8fafc' },
    main:       { flex:1, padding:'32px 28px', maxWidth:1100 },
    header:     { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28 },
    title:      { fontSize:22, fontWeight:700, color:'#1e293b', margin:0 },
    sub:        { fontSize:13, color:'#8e9eab', margin:'4px 0 0' },
    empty:      { padding:60, textAlign:'center', color:'#8e9eab' },
    emptyBox:   { background:'white', borderRadius:16, padding:60, textAlign:'center',
                  boxShadow:'0 2px 12px rgba(0,0,0,0.06)' },
    tableWrap:  { background:'white', borderRadius:16, overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' },
    table:      { width:'100%', borderCollapse:'collapse' },
    th:         { padding:'10px 14px', textAlign:'left', fontSize:12, fontWeight:600, color:'#8e9eab',
                  borderBottom:'2px solid #e8ecf0', whiteSpace:'nowrap' },
    td:         { padding:'12px 14px', fontSize:13, color:'#1a2332', borderBottom:'1px solid #f0f4f8' },
    overlay:    { position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:1000,
                  display:'flex', justifyContent:'flex-end' },
    drawer:     { background:'white', width:'100%', maxWidth:480, height:'100%',
                  overflowY:'auto', boxShadow:'-4px 0 24px rgba(0,0,0,0.12)' },
    drawerHead: { display:'flex', justifyContent:'space-between', alignItems:'center',
                  padding:'20px 24px', borderBottom:'1px solid #e8ecf0', position:'sticky', top:0, background:'white' },
    drawerBody: { padding:'0 24px 40px' },
    close:      { background:'none', border:'none', fontSize:20, cursor:'pointer', color:'#8e9eab' },
    input:      { width:'100%', padding:'10px 12px', border:'1px solid #e2e8f0', borderRadius:8,
                  fontSize:14, boxSizing:'border-box', outline:'none' },
    hint:       { fontSize:12, color:'#94a3b8', marginTop:4 },
    errBox:     { background:'#fee2e2', color:'#dc2626', padding:'10px 14px', borderRadius:8,
                  fontSize:13, marginTop:16 },
    btnPrimary: { padding:'10px 20px', background:'#6366f1', color:'white', border:'none',
                  borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' },
    btnSecondary:{ padding:'10px 20px', background:'#f1f5f9', color:'#475569', border:'none',
                  borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' },
    btnWarn:    { padding:'5px 12px', background:'rgba(245,158,11,0.12)', color:'#d97706',
                  border:'none', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer' },
    btnDanger:  { padding:'5px 12px', background:'rgba(239,68,68,0.12)', color:'#ef4444',
                  border:'none', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer' },
    linkBtn:    { background:'none', border:'none', color:'#6366f1', fontSize:13, fontWeight:600,
                  cursor:'pointer', textDecoration:'underline', padding:0 },
};
