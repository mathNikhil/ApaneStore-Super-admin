import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminTenantAPI } from '../services/adminApi';
import Sidebar from '../components/Sidebar';

const TenantDetail = () => {
    const { id } = useParams();
    const [tenant, setTenant] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            navigate('/login');
            return;
        }
        fetchTenant();
    }, [id]);

    const fetchTenant = async () => {
        try {
            const result = await adminTenantAPI.getById(id);
            if (result.success) {
                setTenant(result.data);
            }
        } catch (error) {
            console.error('Error fetching tenant:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={styles.container}>
                <Sidebar />
                <div style={styles.main}>
                    <div style={styles.loading}>Loading tenant details...</div>
                </div>
            </div>
        );
    }

    if (!tenant) {
        return (
            <div style={styles.container}>
                <Sidebar />
                <div style={styles.main}>
                    <div style={styles.loading}>Tenant not found</div>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <Sidebar />
            <div style={styles.main}>
                <div style={styles.backBtn} onClick={() => navigate('/tenants')}>← Back to Tenants</div>

                <div style={styles.tenantCard}>
                    <div style={styles.tenantHeader}>
                        <div>
                            <h1 style={styles.tenantName}>{tenant.company_name}</h1>
                            <div style={styles.tenantId}>Tenant ID: {tenant.tenant_id}</div>
                        </div>
                        <span style={{
                            ...styles.statusBadge,
                            background: tenant.status === 'active' ? 'rgba(46,213,115,0.15)' : 'rgba(142,142,142,0.15)',
                            color: tenant.status === 'active' ? '#2ecc71' : '#8e9eab'
                        }}>
                            {tenant.status || 'Active'}
                        </span>
                    </div>

                    <div style={styles.tenantInfo}>
                        <div>
                            <div style={styles.infoLabel}>Email</div>
                            <div style={styles.infoValue}>{tenant.email}</div>
                        </div>
                        <div>
                            <div style={styles.infoLabel}>Phone</div>
                            <div style={styles.infoValue}>{tenant.phone}</div>
                        </div>
                        <div>
                            <div style={styles.infoLabel}>Plan</div>
                            <div style={styles.infoValue}>{tenant.subscription_tier || 'Trial'}</div>
                        </div>
                        <div>
                            <div style={styles.infoLabel}>Stores</div>
                            <div style={styles.infoValue}>{tenant.stores?.length || 0}</div>
                        </div>
                    </div>
                </div>

                <h3 style={styles.storesTitle}>🏪 Stores ({tenant.stores?.length || 0})</h3>

                <div style={styles.storeGrid}>
                    {tenant.stores?.map(store => (
                        <div key={store.id} style={styles.storeCard} onClick={() => navigate(`/stores/${store.id}`)}>
                            <div style={styles.storeName}>{store.store_name}</div>
                            <div style={styles.storeUrl}>🔗 {store.subdomain}.aapnaestore.com</div>
                            <div style={styles.storeStatus}>
                                <span style={{
                                    ...styles.statusBadge,
                                    background: store.status === 'published' ? 'rgba(46,213,115,0.15)' : 'rgba(52,152,219,0.15)',
                                    color: store.status === 'published' ? '#2ecc71' : '#3498db'
                                }}>
                                    {store.status || 'Draft'}
                                </span>
                                <span style={styles.panelBadge}>Admin ✅</span>
                                <span style={{
                                    ...styles.panelBadge,
                                    background: store.permissions?.production ? 'rgba(46,213,115,0.15)' : 'rgba(231,76,60,0.15)',
                                    color: store.permissions?.production ? '#2ecc71' : '#e74c3c'
                                }}>
                                    Prod {store.permissions?.production ? '✅' : '❌'}
                                </span>
                                <span style={{
                                    ...styles.panelBadge,
                                    background: store.permissions?.delivery ? 'rgba(46,213,115,0.15)' : 'rgba(231,76,60,0.15)',
                                    color: store.permissions?.delivery ? '#2ecc71' : '#e74c3c'
                                }}>
                                    Del {store.permissions?.delivery ? '✅' : '❌'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: { display: 'flex', minHeight: '100vh', background: '#f0f2f5' },
    main: { flex: 1, padding: '30px', marginLeft: '260px' },
    backBtn: { color: '#667eea', cursor: 'pointer', fontWeight: '600', fontSize: '14px', marginBottom: '16px' },
    tenantCard: { background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: '24px' },
    tenantHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' },
    tenantName: { fontSize: '24px', fontWeight: '700', color: '#1a1a2e' },
    tenantId: { fontSize: '13px', color: '#8e9eab' },
    statusBadge: { padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', display: 'inline-block' },
    tenantInfo: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f0f2f5' },
    infoLabel: { fontSize: '12px', color: '#8e9eab', fontWeight: '600', textTransform: 'uppercase' },
    infoValue: { fontSize: '16px', fontWeight: '500', color: '#1a1a2e', marginTop: '4px' },
    storesTitle: { marginBottom: '16px', color: '#1a1a2e' },
    storeGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' },
    storeCard: { background: '#fafbfc', border: '1px solid #f0f2f5', borderRadius: '12px', padding: '16px', cursor: 'pointer', transition: 'all 0.3s' },
    storeName: { fontWeight: '600', fontSize: '16px', color: '#1a1a2e' },
    storeUrl: { fontSize: '13px', color: '#8e9eab', marginTop: '4px' },
    storeStatus: { display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' },
    panelBadge: { padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', background: 'rgba(52,152,219,0.15)', color: '#3498db' },
    loading: { textAlign: 'center', padding: '40px', color: '#666' },
};

export default TenantDetail;
