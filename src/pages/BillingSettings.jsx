import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import API_BASE_URL from '../config/api';

const BillingSettings = () => {
    const [settings, setSettings] = useState({
        company_name: 'AapnaEstore Pvt. Ltd.',
        gstin: '', pan: '', address: '', state: '',
        hsn_code: '998314', gst_rate: '18',
        bank_name: '', bank_account: '', bank_ifsc: '', bank_branch: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const token = localStorage.getItem('adminToken');
    const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

    useEffect(() => {
        fetch(`${API_BASE_URL}/api/admin/billing-settings`, { headers })
            .then(r => r.json())
            .then(d => { if (d.success) setSettings(prev => ({ ...prev, ...d.data })); })
            .finally(() => setLoading(false));
    }, []);

    const handleChange = (field, value) => setSettings(prev => ({ ...prev, [field]: value }));

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/billing-settings`, {
                method: 'POST', headers, body: JSON.stringify(settings)
            });
            const d = await res.json();
            if (d.success) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
        } catch (e) { alert('Save failed'); }
        setSaving(false);
    };

    const inputStyle = { width: '100%', padding: '10px 14px', border: '1px solid #e0e3e6', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', marginTop: 6 };
    const labelStyle = { display: 'block', fontSize: 12, fontWeight: 700, color: '#556067', textTransform: 'uppercase' };
    const fieldStyle = { marginBottom: 20 };
    const hintStyle = { fontSize: 12, color: '#888', marginTop: 4 };
    const cardStyle = { background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 24 };
    const h2Style = { fontSize: 16, fontWeight: 700, marginBottom: 20, color: '#191c1e' };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
            <Sidebar />
            <div style={{ flex: 1, marginLeft: '260px', padding: 32 }}>
                <div style={{ maxWidth: 700 }}>
                    <h1 style={{ fontSize: 24, fontWeight: 800, color: '#191c1e', marginBottom: 4 }}>Billing Settings</h1>
                    <p style={{ color: '#556067', fontSize: 14, marginBottom: 32 }}>Configure AapnaEstore details for tenant tax invoices</p>
                    {loading ? <p>Loading...</p> : (<>
                        <div style={cardStyle}>
                            <h2 style={h2Style}>Company Details</h2>
                            <div style={fieldStyle}><label style={labelStyle}>Company Name</label><input style={inputStyle} value={settings.company_name} onChange={e => handleChange('company_name', e.target.value)} placeholder="AapnaEstore Pvt. Ltd." /></div>
                            <div style={fieldStyle}><label style={labelStyle}>GSTIN</label><input style={inputStyle} value={settings.gstin} onChange={e => handleChange('gstin', e.target.value)} placeholder="e.g. 07AAAAA0000A1Z5" /><p style={hintStyle}>AapnaEstore GST registration number</p></div>
                            <div style={fieldStyle}><label style={labelStyle}>PAN Number</label><input style={inputStyle} value={settings.pan} onChange={e => handleChange('pan', e.target.value)} placeholder="e.g. AAAAA0000A" /></div>
                            <div style={fieldStyle}><label style={labelStyle}>Registered Address</label><textarea style={{...inputStyle, height: 80, resize: 'vertical'}} value={settings.address} onChange={e => handleChange('address', e.target.value)} placeholder="Full registered business address" /></div>
                            <div style={fieldStyle}><label style={labelStyle}>State</label><input style={inputStyle} value={settings.state} onChange={e => handleChange('state', e.target.value)} placeholder="e.g. Delhi, Maharashtra" /></div>
                        </div>
                        <div style={cardStyle}>
                            <h2 style={h2Style}>Tax Details</h2>
                            <div style={fieldStyle}><label style={labelStyle}>HSN/SAC Code</label><input style={inputStyle} value={settings.hsn_code} onChange={e => handleChange('hsn_code', e.target.value)} placeholder="998314" /><p style={hintStyle}>998314 = Information Technology Software Services (SaaS)</p></div>
                            <div style={fieldStyle}><label style={labelStyle}>GST Rate (%)</label><input style={inputStyle} value={settings.gst_rate} onChange={e => handleChange('gst_rate', e.target.value)} placeholder="18" /><p style={hintStyle}>SaaS services attract 18% GST</p></div>
                        </div>
                        <div style={cardStyle}>
                            <h2 style={h2Style}>Bank Details</h2>
                            <div style={fieldStyle}><label style={labelStyle}>Bank Name</label><input style={inputStyle} value={settings.bank_name} onChange={e => handleChange('bank_name', e.target.value)} placeholder="e.g. HDFC Bank" /></div>
                            <div style={fieldStyle}><label style={labelStyle}>Account Number</label><input style={inputStyle} value={settings.bank_account} onChange={e => handleChange('bank_account', e.target.value)} placeholder="Bank account number" /></div>
                            <div style={fieldStyle}><label style={labelStyle}>IFSC Code</label><input style={inputStyle} value={settings.bank_ifsc} onChange={e => handleChange('bank_ifsc', e.target.value)} placeholder="e.g. HDFC0001234" /></div>
                            <div style={fieldStyle}><label style={labelStyle}>Branch</label><input style={inputStyle} value={settings.bank_branch} onChange={e => handleChange('bank_branch', e.target.value)} placeholder="e.g. Connaught Place, New Delhi" /></div>
                        </div>
                        <button onClick={handleSave} disabled={saving}
                            style={{ background: '#006d2f', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 32px', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                            {saving ? 'Saving...' : saved ? '✅ Saved!' : 'Save Settings'}
                        </button>
                    </>)}
                </div>
            </div>
        </div>
    );
};

export default BillingSettings;
