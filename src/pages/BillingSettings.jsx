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

    const Field = ({ label, field, placeholder, hint }) => (
        <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#556067', textTransform: 'uppercase', marginBottom: 6 }}>{label}</label>
            <input value={settings[field] || ''} onChange={e => setSettings(prev => ({ ...prev, [field]: e.target.value }))}
                placeholder={placeholder}
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #e0e3e6', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
            {hint && <p style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{hint}</p>}
        </div>
    );

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
            <Sidebar />
            <div style={{ flex: 1, padding: 32 }}>
                <div style={{ maxWidth: 700 }}>
                    <h1 style={{ fontSize: 24, fontWeight: 800, color: '#191c1e', marginBottom: 4 }}>Billing Settings</h1>
                    <p style={{ color: '#556067', fontSize: 14, marginBottom: 32 }}>Configure AapnaEstore details for tenant tax invoices</p>
                    {loading ? <p>Loading...</p> : (<>
                        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 24 }}>
                            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: '#191c1e' }}>Company Details</h2>
                            <Field label="Company Name" field="company_name" placeholder="AapnaEstore Pvt. Ltd." />
                            <Field label="GSTIN" field="gstin" placeholder="e.g. 07AAAAA0000A1Z5" hint="AapnaEstore GST registration number" />
                            <Field label="PAN Number" field="pan" placeholder="e.g. AAAAA0000A" />
                            <Field label="Registered Address" field="address" placeholder="Full registered business address" />
                            <Field label="State" field="state" placeholder="e.g. Delhi, Maharashtra" />
                        </div>
                        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 24 }}>
                            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: '#191c1e' }}>Tax Details</h2>
                            <Field label="HSN/SAC Code" field="hsn_code" placeholder="998314" hint="998314 = Information Technology Software Services (SaaS)" />
                            <Field label="GST Rate (%)" field="gst_rate" placeholder="18" hint="SaaS services attract 18% GST" />
                        </div>
                        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 24 }}>
                            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: '#191c1e' }}>Bank Details</h2>
                            <Field label="Bank Name" field="bank_name" placeholder="e.g. HDFC Bank" />
                            <Field label="Account Number" field="bank_account" placeholder="Bank account number" />
                            <Field label="IFSC Code" field="bank_ifsc" placeholder="e.g. HDFC0001234" />
                            <Field label="Branch" field="bank_branch" placeholder="e.g. Connaught Place, New Delhi" />
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
