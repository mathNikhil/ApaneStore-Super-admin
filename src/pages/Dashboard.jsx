import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalTenants: 0,
        activeTenants: 0,
        totalStores: 0,
        revenue: '₹0'
    });
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            navigate('/login');
            return;
        }
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            // Fetch tenants
            const response = await fetch('http://localhost:5002/api/admin/tenants', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
            });
            const result = await response.json();
            if (result.success) {
                const tenants = result.data;
                const activeTenants = tenants.filter(t => t.status === 'active').length;
                
                // Fetch stores
                const storeResponse = await fetch('http://localhost:5002/api/admin/stores', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
                });
                const storeResult = await storeResponse.json();
                
                setStats({
                    totalTenants: tenants.length,
                    activeTenants: activeTenants,
                    totalStores: storeResult.success ? storeResult.data.length : 0,
                    revenue: '₹12.4L' // Placeholder
                });
            }
        } catch (error) {
            console.error('Error fetching dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={styles.loading}>
                <div style={styles.spinner}></div>
                <p>Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <Sidebar />
            <div style={styles.main}>
                <div style={styles.header}>
                    <h1>📊 Dashboard</h1>
                    <div>Welcome back, Super Admin</div>
                </div>

                <div style={styles.statsGrid}>
                    <div style={styles.statCard} onClick={() => navigate('/tenants')}>
                        <div style={{...styles.iconBox, background: 'rgba(102,126,234,0.12)'}}>👥</div>
                        <div>
                            <div style={styles.statValue}>{stats.totalTenants}</div>
                            <div style={styles.statLabel}>Total Tenants</div>
                        </div>
                    </div>

                    <div style={styles.statCard} onClick={() => navigate('/tenants')}>
                        <div style={{...styles.iconBox, background: 'rgba(46,213,115,0.12)'}}>✅</div>
                        <div>
                            <div style={styles.statValue}>{stats.activeTenants}</div>
                            <div style={styles.statLabel}>Active Tenants</div>
                        </div>
                    </div>

                    <div style={styles.statCard} onClick={() => navigate('/stores')}>
                        <div style={{...styles.iconBox, background: 'rgba(255,165,0,0.12)'}}>🏪</div>
                        <div>
                            <div style={styles.statValue}>{stats.totalStores}</div>
                            <div style={styles.statLabel}>Total Stores</div>
                        </div>
                    </div>

                    <div style={styles.statCard}>
                        <div style={{...styles.iconBox, background: 'rgba(52,152,219,0.12)'}}>💰</div>
                        <div>
                            <div style={styles.statValue}>{stats.revenue}</div>
                            <div style={styles.statLabel}>Revenue</div>
                        </div>
                    </div>
                </div>

                <div style={styles.quickActions}>
                    <h3>⚡ Quick Actions</h3>
                    <div style={styles.actionsGrid}>
                        <button style={styles.actionBtn} onClick={() => navigate('/tenants')}>
                            <span style={{fontSize:'28px',display:'block'}}>👥</span>
                            View Tenants
                        </button>
                        <button style={styles.actionBtn} onClick={() => navigate('/stores')}>
                            <span style={{fontSize:'28px',display:'block'}}>🏪</span>
                            View Stores
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: { display: 'flex', minHeight: '100vh', background: '#f0f2f5' },
    main: { flex: 1, padding: '30px', marginLeft: '260px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' },
    statCard: { background: 'white', padding: '24px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', cursor: 'pointer' },
    iconBox: { width: '56px', height: '56px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' },
    statValue: { fontSize: '28px', fontWeight: 'bold', color: '#1a1a2e' },
    statLabel: { fontSize: '14px', color: '#8e9eab' },
    quickActions: { background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
    actionsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginTop: '16px' },
    actionBtn: { padding: '20px', border: '2px solid #f0f2f5', borderRadius: '12px', background: '#fafafa', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
    loading: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' },
    spinner: { width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #667eea', borderRadius: '50%', animation: 'spin 1s linear infinite' },
};

export default Dashboard;
