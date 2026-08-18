import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';

const API = import.meta.env.VITE_API_URL || 'https://api.aapnaestore.com';

const PROVIDERS = [
    { id: 'cashfree', label: 'Cashfree', icon: '💳' },
    { id: 'razorpay', label: 'Razorpay', icon: '🪙' },
    { id: 'stripe', label: 'Stripe', icon: '⚡' },
];

const styles = {
    container: { display: 'flex', minHeight: '100vh', background: '#f5f6fa' },
    main: { flex: 1, marginLeft: '260px', padding: '32px' },
    card: { background: '#fff', borderRadius: '12px', border: '1px solid #e8eaf0', padding: '28px', maxWidth: '600px' },
    title: { fontSize: '24px', fontWeight: '700', color: '#1a1d23', marginBottom: '4px' },
    subtitle: { fontSize: '14px', color: '#6b7280', marginBottom: '28px' },
    label: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' },
    input: { width: '100%', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
    hint: { fontSize: '12px', color: '#9ca3af', marginTop: '4px' },
    row: { marginBottom: '20px' },
    envBtn: (active) => ({ flex: 1, padding: '10px', borderRadius: '8px', border: `2px solid ${active ? '#16a34a' : '#e5e7eb'}`, background: active ? '#f0fdf4' : '#fff', color: active ? '#15803d' : '#6b7280', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }),
    providerBtn: (active) => ({ flex: 1, padding: '12px', borderRadius: '8px', border: `2px solid ${active ? '#4f46e5' : '#e5e7eb'}`, background: active ? '#eef2ff' : '#fff', color: active ? '#4338ca' : '#6b7280', fontWeight: '600', cursor: 'pointer', fontSize: '13px', textAlign: 'center' }),
    toggleTrack: (on) => ({ width: '44px', height: '24px', borderRadius: '12px', background: on ? '#16a34a' : '#d1d5db', position: 'relative', cursor: 'pointer', transition: 'background 0.2s' }),
    toggleThumb: (on) => ({ position: 'absolute', top: '2px', left: on ? '22px' : '2px', width: '20px', height: '20px', borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s' }),
    saveBtn: { width: '100%', padding: '12px', background: '#16a34a', color: '#fff', fontWeight: '700', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '15px' },
    infoBox: { background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '14px', marginBottom: '20px' },
    tag: { display: 'inline-block', background: '#dbeafe', color: '#1d4ed8', borderRadius: '20px', padding: '3px 12px', fontSize: '12px', fontFamily: 'monospace', marginRight: '6px' },
    successMsg: { color: '#16a34a', fontSize: '14px', fontWeight: '600', marginBottom: '12px' },
    errorMsg: { color: '#dc2626', fontSize: '14px', fontWeight: '600', marginBottom: '12px' },
    warningBox: { background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '6px', padding: '8px 12px', fontSize: '12px', color: '#c2410c', marginTop: '6px' },
    divider: { border: 'none', borderTop: '1px solid #f3f4f6', margin: '20px 0' },
};

const PaymentGateway = () => {
    const [config, setConfig] = useState({
        pg_provider: 'cashfree', pg_key_id: '', pg_secret: '',
        pg_webhook_url: 'https://api.aapnaestore.com/api/webhooks/payment',
        pg_environment: 'sandbox', pg_enabled: 'false',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => { fetchConfig(); }, []);

    const fetchConfig = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${API}/api/admin/payment-gateway`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (data.success) setConfig(prev => ({ ...prev, ...data.data }));
        } catch (e) { setError('Failed to load configuration'); }
        finally { setLoading(false); }
    };

    const handleSave = async () => {
        setSaving(true); setMessage(''); setError('');
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${API}/api/admin/payment-gateway`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(config),
            });
            const data = await res.json();
            if (data.success) setMessage('Configuration saved!');
            else setError(data.error || 'Failed to save');
        } catch (e) { setError('Failed to save'); }
        finally { setSaving(false); }
    };

    const isEnabled = config.pg_enabled === 'true';
    const selectedProvider = PROVIDERS.find(p => p.id === config.pg_provider) || PROVIDERS[0];

    return (
        <div style={styles.container}>
            <Sidebar />
            <div style={styles.main}>
                <h1 style={styles.title}>Payment Gateway</h1>
                <p style={styles.subtitle}>Configure payment gateway for tenant subscriptions. Switch providers anytime — just update credentials.</p>

                {loading ? <div style={{ color: '#9ca3af' }}>Loading...</div> : (
                    <div style={styles.card}>

                        {/* Enable Toggle */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9fafb', borderRadius: '8px', padding: '14px 16px', marginBottom: '24px' }}>
                            <div>
                                <div style={{ fontWeight: '600', color: '#111827', fontSize: '14px' }}>Enable Payment Gateway</div>
                                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>When enabled, tenants must pay to publish their store</div>
                            </div>
                            <div style={styles.toggleTrack(isEnabled)} onClick={() => setConfig(p => ({ ...p, pg_enabled: isEnabled ? 'false' : 'true' }))}>
                                <div style={styles.toggleThumb(isEnabled)} />
                            </div>
                        </div>

                        {/* Provider Selection */}
                        <div style={styles.row}>
                            <label style={styles.label}>Payment Provider</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                {PROVIDERS.map(p => (
                                    <button key={p.id} style={styles.providerBtn(config.pg_provider === p.id)} onClick={() => setConfig(prev => ({ ...prev, pg_provider: p.id }))}>
                                        <div style={{ fontSize: '20px', marginBottom: '4px' }}>{p.icon}</div>
                                        <div>{p.label}</div>
                                    </button>
                                ))}
                            </div>
                            <div style={styles.hint}>Switching provider only requires updating credentials below</div>
                        </div>

                        <hr style={styles.divider} />

                        {/* Environment */}
                        <div style={styles.row}>
                            <label style={styles.label}>Environment</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                {['sandbox', 'production'].map(env => (
                                    <button key={env} style={styles.envBtn(config.pg_environment === env)} onClick={() => setConfig(p => ({ ...p, pg_environment: env }))}>
                                        {env === 'sandbox' ? '🧪 Sandbox' : '🚀 Production'}
                                    </button>
                                ))}
                            </div>
                            {config.pg_environment === 'production' && (
                                <div style={styles.warningBox}>⚠️ Production mode — real payments will be charged</div>
                            )}
                        </div>

                        {/* Key ID */}
                        <div style={styles.row}>
                            <label style={styles.label}>Key ID / App ID</label>
                            <input style={styles.input} type="text" value={config.pg_key_id || ''} onChange={e => setConfig(p => ({ ...p, pg_key_id: e.target.value }))} placeholder={`Enter ${selectedProvider.label} Key ID`} />
                        </div>

                        {/* Secret Key */}
                        <div style={styles.row}>
                            <label style={styles.label}>Secret Key</label>
                            <input style={styles.input} type="password" value={config.pg_secret || ''} onChange={e => setConfig(p => ({ ...p, pg_secret: e.target.value }))} placeholder="Enter new secret key to update" />
                            <div style={styles.hint}>Leave blank to keep existing secret key</div>
                        </div>

                        {/* Webhook URL */}
                        <div style={styles.row}>
                            <label style={styles.label}>Webhook URL</label>
                            <input style={styles.input} type="text" value={config.pg_webhook_url || ''} onChange={e => setConfig(p => ({ ...p, pg_webhook_url: e.target.value }))} />
                            <div style={styles.hint}>Add this URL in your {selectedProvider.label} dashboard under Webhooks</div>
                        </div>

                        <hr style={styles.divider} />

                        {/* Test Tenants */}
                        <div style={styles.infoBox}>
                            <div style={{ fontWeight: '600', color: '#1e40af', fontSize: '13px', marginBottom: '8px' }}>🧪 Test Accounts (bypass payment)</div>
                            <div style={{ marginBottom: '8px' }}>
                                {['5555555555', '6666666666', '7777777777'].map(num => <span key={num} style={styles.tag}>{num}</span>)}
                            </div>
                            <div style={{ fontSize: '12px', color: '#3730a3' }}>These numbers skip payment and go live immediately — regardless of gateway settings</div>
                        </div>

                        {message && <div style={styles.successMsg}>✅ {message}</div>}
                        {error && <div style={styles.errorMsg}>❌ {error}</div>}

                        <button style={styles.saveBtn} onClick={handleSave} disabled={saving}>
                            {saving ? 'Saving...' : `Save ${selectedProvider.label} Configuration`}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentGateway;
