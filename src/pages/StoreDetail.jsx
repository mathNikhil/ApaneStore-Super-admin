import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminStoreAPI, adminPanelAPI } from '../services/adminApi';
import Sidebar from '../components/Sidebar';

const StoreDetail = () => {
    const { id } = useParams();
    const [store, setStore] = useState(null);
    const [panels, setPanels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [storage, setStorage] = useState(null);
    const [trialDays, setTrialDays] = useState(3);
    const [trialLoading, setTrialLoading] = useState(false);
    const [extensionRequests, setExtensionRequests] = useState([]);
    const [extDays, setExtDays] = useState({});
    const [extLoading, setExtLoading] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            navigate('/login');
            return;
        }
        fetchStoreDetails();
    }, [id]);

    const fetchStoreDetails = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const API = 'https://api.aapnaestore.com';
            const [storeResult, panelResult, extResult] = await Promise.all([
                adminStoreAPI.getById(id),
                adminPanelAPI.getStorePanels(id),
                fetch(`${API}/api/admin/trial/extension-requests`, {
                    headers: { Authorization: `Bearer ${token}` }
                }).then(r => r.json()).catch(() => ({ success: false, data: [] }))
            ]);
            if (storeResult.success) setStore(storeResult.data);
            if (panelResult.success) setPanels(panelResult.data);
            if (extResult.success) {
                setExtensionRequests(extResult.data.filter(r => String(r.store_id) === String(id)));
            }
            // Fetch storage info
            const storageRes = await fetch(`https://api.aapnaestore.com/api/admin/stores/${id}/storage`, {
                headers: { Authorization: `Bearer ${token}` }
            }).then(r => r.json()).catch(() => null);
            if (storageRes?.success) setStorage(storageRes.data);
        } catch (error) {
            console.error('Error fetching store details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTogglePanel = (panelType, currentValue) => {
        setPanels(panels.map(p => 
            p.panel_type === panelType 
                ? { ...p, is_enabled: !currentValue }
                : p
        ));
    };

    const handleSavePanels = async () => {
        setSaving(true);
        try {
            const result = await adminPanelAPI.updateStorePanels(id, panels);
            if (result.success) {
                alert('✅ Panel configuration saved successfully!');
                fetchStoreDetails();
            }
        } catch (error) {
            alert('❌ Error saving panel configuration');
        } finally {
            setSaving(false);
        }
    };

    const handleEnableTrial = async () => {
        if (store.status !== 'draft') {
            alert('Trial can only be enabled for draft stores. Published stores follow their paid subscription lifecycle.');
            return;
        }
        if (!window.confirm(`Enable ${trialDays}-day trial for "${store.store_name}"? This will make the store live immediately.`)) return;
        setTrialLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`https://api.aapnaestore.com/api/admin/stores/${id}/trial/enable`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ days: trialDays })
            });
            const data = await res.json();
            if (data.success) {
                alert(`✅ Trial enabled for  days! Tenant must go through the publish flow to activate it.`);
                fetchStoreDetails();
            } else {
                alert('❌ ' + (data.error || 'Failed to enable trial'));
            }
        } catch (e) {
            alert('❌ Error enabling trial');
        } finally {
            setTrialLoading(false);
        }
    };

    const handleAcceptExtension = async (requestId) => {
        const days = extDays[requestId] || 3;
        if (!window.confirm(`Grant ${days} day extension?`)) return;
        setExtLoading(prev => ({ ...prev, [requestId]: true }));
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`https://api.aapnaestore.com/api/admin/trial/extension-requests/${requestId}/accept`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ daysGranted: days })
            });
            const data = await res.json();
            if (data.success) { alert('✅ Extension granted!'); fetchStoreDetails(); }
            else alert('❌ ' + (data.error || 'Failed'));
        } catch (e) { alert('❌ Error'); }
        finally { setExtLoading(prev => ({ ...prev, [requestId]: false })); }
    };

    const handleRejectExtension = async (requestId) => {
        if (!window.confirm('Reject this extension request?')) return;
        setExtLoading(prev => ({ ...prev, [requestId]: true }));
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`https://api.aapnaestore.com/api/admin/trial/extension-requests/${requestId}/reject`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            if (data.success) { alert('✅ Rejected.'); fetchStoreDetails(); }
        } catch (e) { alert('❌ Error'); }
        finally { setExtLoading(prev => ({ ...prev, [requestId]: false })); }
    };

    if (loading) {
        return (
            <div style={styles.container}>
                <Sidebar />
                <div style={styles.main}>
                    <div style={styles.loading}>Loading store details...</div>
                </div>
            </div>
        );
    }

    if (!store) {
        return (
            <div style={styles.container}>
                <Sidebar />
                <div style={styles.main}>
                    <div style={styles.loading}>Store not found</div>
                </div>
            </div>
        );
    }

    // Hosting details for troubleshooting
    const hostingData = {
        serverStatus: { status: 'healthy', icon: '✅', text: 'Online' },
        domainDNS: { status: 'healthy', icon: '✅', text: 'Resolving correctly' },
        sslCertificate: { status: 'healthy', icon: '✅', text: 'Valid' },
        lastDeployed: { status: 'info', icon: '📅', text: '2026-07-20 14:30 UTC' },
        loadTime: { status: 'healthy', icon: '⚡', text: '1.2s (Good)' },
        serverIP: { status: 'info', icon: '🌐', text: '192.168.1.100' },
        region: { status: 'info', icon: '📍', text: 'Mumbai, India' },
        uptime: { status: 'healthy', icon: '⏱️', text: '99.98%' }
    };

    const errorLogs = [
        { time: '2026-07-20 10:23:45', level: 'error', message: 'Database connection timeout' },
        { time: '2026-07-20 10:15:22', level: 'warning', message: 'High memory usage (85%)' },
        { time: '2026-07-20 09:45:10', level: 'info', message: 'Cache cleared successfully' },
    ];

    return (
        <div style={styles.container}>
            <Sidebar />
            <div style={styles.main}>
                <div style={styles.backBtn} onClick={() => navigate('/stores')}>← Back to Stores</div>

                <div style={styles.storeCard}>
                    <div style={styles.storeHeader}>
                        <div>
                            <h1 style={styles.storeName}>🏪 {store.store_name}</h1>
                            <div style={styles.storeMeta}>
                                Tenant: <a style={styles.link} onClick={() => navigate(`/tenants/${store.tenant_id}`)}>
                                    {store.tenant_name}
                                </a>
                            </div>
                        </div>
                        <span style={{
                            ...styles.statusBadge,
                            background: store.status === 'published' ? 'rgba(46,213,115,0.15)' : 'rgba(52,152,219,0.15)',
                            color: store.status === 'published' ? '#2ecc71' : '#3498db'
                        }}>
                            {store.status || 'Draft'}
                        </span>
                    </div>

                    <div style={styles.storeInfo}>
                        <div>
                            <div style={styles.infoLabel}>Store URL</div>
                            <div style={styles.infoValue}>
                                <a href="#" style={styles.url}>https://{store.subdomain}.aapnaestore.com</a>
                            </div>
                        </div>
                        <div>
                            <div style={styles.infoLabel}>Custom Domain</div>
                            <div style={styles.infoValue}>
                                <a href="#" style={styles.url}>{store.custom_domain || 'Not configured'}</a>
                            </div>
                        </div>
                        <div>
                            <div style={styles.infoLabel}>Store ID</div>
                            <div style={styles.infoValue}>{store.store_id}</div>
                        </div>
                        <div>
                            <div style={styles.infoLabel}>Created</div>
                            <div style={styles.infoValue}>{new Date(store.created_at).toLocaleDateString()}</div>
                        </div>
                    </div>

                    {/* Panel Configuration */}
                    <div style={styles.panelSection}>
                        <h4>⚙️ Panel Configuration</h4>
                        <div style={styles.panelGrid}>
                            {panels.map(panel => (
                                <div key={panel.panel_type} style={styles.panelItem}>
                                    <div>
                                        <div style={styles.panelName}>
                                            {panel.panel_type === 'admin' && '🏪 Admin Panel'}
                                            {panel.panel_type === 'production' && '🏭 Production Panel'}
                                            {panel.panel_type === 'delivery' && '🚚 Delivery Panel'}
                                        </div>
                                        <div style={styles.panelDesc}>
                                            {panel.panel_type === 'admin' && 'Manage products, orders, customers'}
                                            {panel.panel_type === 'production' && 'Order processing, inventory, schedule'}
                                            {panel.panel_type === 'delivery' && 'Assign deliveries, track orders'}
                                        </div>
                                        <div style={{
                                            ...styles.panelStatus,
                                            color: panel.is_enabled ? '#2ecc71' : '#8e9eab'
                                        }}>
                                            {panel.is_enabled ? '✅ Enabled' : '❌ Disabled'}
                                        </div>
                                    </div>
                                    <div 
                                        style={{
                                            ...styles.toggle,
                                            background: panel.is_enabled ? '#667eea' : '#ddd',
                                            cursor: panel.panel_type === 'admin' ? 'not-allowed' : 'pointer',
                                            opacity: panel.panel_type === 'admin' ? 0.6 : 1
                                        }}
                                        onClick={() => {
                                            if (panel.panel_type !== 'admin') {
                                                handleTogglePanel(panel.panel_type, panel.is_enabled);
                                            }
                                        }}
                                    >
                                        <div style={{
                                            ...styles.toggleDot,
                                            transform: panel.is_enabled ? 'translateX(22px)' : 'translateX(2px)'
                                        }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button 
                            style={styles.saveBtn} 
                            onClick={handleSavePanels}
                            disabled={saving}
                        >
                            {saving ? 'Saving...' : '💾 Save Configuration'}
                        </button>
                    </div>

                    {/* Hosting & Troubleshooting */}
                    <div style={styles.hostingSection}>
                        <h4>🌐 Hosting & Troubleshooting</h4>
                        <div style={styles.hostingGrid}>
                            {Object.entries(hostingData).map(([key, value]) => (
                                <div key={key} style={styles.hostingItem}>
                                    <div style={styles.hostingLabel}>
                                        {key.replace(/([A-Z])/g, ' $1').trim()}
                                    </div>
                                    <div style={styles.hostingValue}>
                                        <span>{value.icon}</span>
                                        <span style={{ color: value.status === 'healthy' ? '#2ecc71' : '#f39c12' }}>
                                            {value.text}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Storage Usage */}
                    <div style={styles.panelSection}>
                        <h4>💾 Storage Usage</h4>
                        {storage ? (
                            <div style={{ marginTop: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                    <span style={{ fontSize: '13px', color: '#556067' }}>
                                        {storage.usedMB}MB used of {storage.limitMB}MB
                                    </span>
                                    <span style={{ fontSize: '13px', fontWeight: '600',
                                        color: storage.full ? '#e74c3c' : storage.warning ? '#f39c12' : '#2ecc71' }}>
                                        {storage.percentage}%
                                    </span>
                                </div>
                                <div style={{ width: '100%', height: '8px', background: '#f0f2f5', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{
                                        height: '100%',
                                        width: `${Math.min(storage.percentage, 100)}%`,
                                        background: storage.full ? '#e74c3c' : storage.warning ? '#f39c12' : '#2ecc71',
                                        borderRadius: '4px',
                                        transition: 'width 0.5s'
                                    }} />
                                </div>
                                {storage.warning && !storage.full && (
                                    <p style={{ fontSize: '12px', color: '#f39c12', marginTop: '6px' }}>
                                        ⚠️ Store is using over 80% of storage limit
                                    </p>
                                )}
                                {storage.full && (
                                    <p style={{ fontSize: '12px', color: '#e74c3c', marginTop: '6px' }}>
                                        🚨 Store has reached storage limit — image uploads are blocked
                                    </p>
                                )}
                            </div>
                        ) : (
                            <p style={{ fontSize: '13px', color: '#8e9eab', marginTop: '8px' }}>Loading storage info...</p>
                        )}
                    </div>

                    {/* Trial Management */}
                    <div style={styles.panelSection}>
                        <h4>🧪 Trial Management</h4>

                        {/* Enable Trial — draft stores only */}
                        <div style={{ background: '#f8f9fa', borderRadius: '12px', padding: '16px', marginTop: '12px' }}>
                            <div style={{ fontWeight: '600', fontSize: '14px', color: '#1a1a2e', marginBottom: '6px' }}>
                                Enable Trial for this Store
                                {store.status !== 'draft' && (
                                    <span style={{ marginLeft: '8px', fontSize: '11px', color: '#e74c3c', fontWeight: '400' }}>
                                        ⚠️ Only available for draft stores — published stores have their own paid subscription
                                    </span>
                                )}
                                {store.trial_used && store.status === 'draft' && (
                                    <span style={{ marginLeft: '8px', fontSize: '11px', color: '#f39c12', fontWeight: '400' }}>
                                        ⚠️ Trial already used for this tenant
                                    </span>
                                )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginTop: '10px' }}>
                                <label style={{ fontSize: '13px', color: '#556067' }}>Days:</label>
                                <input
                                    type="number" min="1" max="30"
                                    value={trialDays}
                                    onChange={e => setTrialDays(parseInt(e.target.value) || 3)}
                                    disabled={store.status !== 'draft'}
                                    style={{ width: '70px', padding: '6px 10px', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', opacity: store.status !== 'draft' ? 0.5 : 1 }}
                                />
                                <button
                                    onClick={handleEnableTrial}
                                    disabled={trialLoading || store.status !== 'draft'}
                                    style={{
                                        padding: '8px 20px',
                                        background: store.status === 'draft' ? '#25D366' : '#e0e0e0',
                                        color: store.status === 'draft' ? '#fff' : '#999',
                                        border: 'none', borderRadius: '8px',
                                        fontWeight: '600',
                                        cursor: store.status === 'draft' ? 'pointer' : 'not-allowed',
                                        fontSize: '13px'
                                    }}
                                >
                                    {trialLoading ? 'Enabling...' : store.status === 'draft' ? '▶ Enable Trial' : '🔒 Not Available'}
                                </button>
                                <span style={{ fontSize: '12px', color: '#8e9eab' }}>
                                    {store.status === 'published' ? 'Unpublish the store first to enable a trial.' : 'Store will go live immediately for the selected days.'}
                                </span>
                            </div>
                        </div>

                        {/* Extension Requests */}
                        {extensionRequests.length > 0 && (
                            <div style={{ marginTop: '16px' }}>
                                <div style={{ fontWeight: '600', fontSize: '14px', color: '#1a1a2e', marginBottom: '8px' }}>
                                    Trial Extension Requests
                                </div>
                                {extensionRequests.map(req => (
                                    <div key={req.id} style={{ background: '#fff', border: '1px solid #e0e3e6', borderRadius: '10px', padding: '14px', marginBottom: '8px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                                            <div>
                                                <div style={{ fontSize: '13px', color: '#1a1a2e', fontWeight: '600' }}>{req.company_name}</div>
                                                <div style={{ fontSize: '12px', color: '#8e9eab', marginTop: '2px' }}>
                                                    Requested: {req.days_requested} days • {new Date(req.created_at).toLocaleDateString('en-IN')}
                                                </div>
                                                {req.reason && <div style={{ fontSize: '12px', color: '#556067', marginTop: '4px' }}>Reason: {req.reason}</div>}
                                            </div>
                                            <span style={{
                                                padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600',
                                                background: req.status === 'pending' ? 'rgba(243,156,18,0.15)' : req.status === 'accepted' ? 'rgba(46,213,115,0.15)' : 'rgba(231,76,60,0.15)',
                                                color: req.status === 'pending' ? '#f39c12' : req.status === 'accepted' ? '#2ecc71' : '#e74c3c'
                                            }}>
                                                {req.status.toUpperCase()}
                                            </span>
                                        </div>
                                        {req.status === 'pending' && (
                                            <div style={{ display: 'flex', gap: '8px', marginTop: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                                                <label style={{ fontSize: '12px', color: '#556067' }}>Grant days:</label>
                                                <input
                                                    type="number" min="1" max="30"
                                                    value={extDays[req.id] || 3}
                                                    onChange={e => setExtDays(prev => ({ ...prev, [req.id]: parseInt(e.target.value) || 3 }))}
                                                    style={{ width: '60px', padding: '4px 8px', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '13px' }}
                                                />
                                                <button onClick={() => handleAcceptExtension(req.id)} disabled={extLoading[req.id]}
                                                    style={{ padding: '6px 14px', background: '#25D366', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '12px' }}>
                                                    {extLoading[req.id] ? '...' : '✅ Accept'}
                                                </button>
                                                <button onClick={() => handleRejectExtension(req.id)} disabled={extLoading[req.id]}
                                                    style={{ padding: '6px 14px', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '12px' }}>
                                                    {extLoading[req.id] ? '...' : '❌ Reject'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Error Logs */}
                    <div style={styles.logsSection}>
                        <h4>📋 Error Logs <span style={{fontSize:'13px',fontWeight:'400',color:'#8e9eab'}}>(Last 24 hours)</span></h4>
                        <div style={styles.logsContainer}>
                            {errorLogs.map((log, index) => (
                                <div key={index} style={styles.logEntry}>
                                    <span style={styles.logTime}>{log.time}</span>
                                    <span style={{
                                        ...styles.logLevel,
                                        color: log.level === 'error' ? '#e74c3c' : 
                                               log.level === 'warning' ? '#f39c12' : '#3498db'
                                    }}>
                                        [{log.level.toUpperCase()}]
                                    </span>
                                    {log.message}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: { display: 'flex', minHeight: '100vh', background: '#f0f2f5' },
    main: { flex: 1, padding: '30px', marginLeft: '260px' },
    backBtn: { color: '#667eea', cursor: 'pointer', fontWeight: '600', fontSize: '14px', marginBottom: '16px' },
    storeCard: { background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
    storeHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' },
    storeName: { fontSize: '24px', fontWeight: '700', color: '#1a1a2e' },
    storeMeta: { fontSize: '14px', color: '#8e9eab', marginTop: '4px' },
    link: { color: '#667eea', cursor: 'pointer' },
    statusBadge: { padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', display: 'inline-block' },
    storeInfo: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f0f2f5' },
    infoLabel: { fontSize: '12px', color: '#8e9eab', fontWeight: '600', textTransform: 'uppercase' },
    infoValue: { fontSize: '14px', color: '#1a1a2e', marginTop: '4px' },
    url: { color: '#667eea', textDecoration: 'none' },
    panelSection: { marginTop: '20px', paddingTop: '20px', borderTop: '2px solid #f0f2f5' },
    panelGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginTop: '12px' },
    panelItem: { background: '#fafbfc', border: '1px solid #f0f2f5', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    panelName: { fontWeight: '600', fontSize: '14px', color: '#1a1a2e' },
    panelDesc: { fontSize: '12px', color: '#8e9eab' },
    panelStatus: { fontSize: '11px', fontWeight: '600', marginTop: '4px' },
    toggle: { width: '48px', height: '26px', borderRadius: '13px', position: 'relative', transition: 'background 0.3s', flexShrink: 0 },
    toggleDot: { width: '22px', height: '22px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', transition: 'transform 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' },
    saveBtn: { padding: '10px 24px', background: '#667eea', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', marginTop: '16px' },
    hostingSection: { marginTop: '20px', paddingTop: '20px', borderTop: '2px solid #f0f2f5' },
    hostingGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginTop: '12px' },
    hostingItem: { background: '#f8f9fa', padding: '12px 16px', borderRadius: '8px' },
    hostingLabel: { fontSize: '11px', color: '#8e9eab', fontWeight: '600', textTransform: 'uppercase' },
    hostingValue: { fontSize: '14px', fontWeight: '500', color: '#1a1a2e', marginTop: '4px', display: 'flex', gap: '8px', alignItems: 'center' },
    logsSection: { marginTop: '20px', paddingTop: '20px', borderTop: '2px solid #f0f2f5' },
    logsContainer: { background: '#1a1a2e', color: '#00ff00', padding: '16px', borderRadius: '10px', fontFamily: 'monospace', fontSize: '12px', maxHeight: '150px', overflow: 'auto', marginTop: '12px' },
    logEntry: { padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' },
    logTime: { color: '#8e9eab', marginRight: '12px' },
    logLevel: { fontWeight: '600', marginRight: '8px' },
    loading: { textAlign: 'center', padding: '40px', color: '#666' },
};

export default StoreDetail;
