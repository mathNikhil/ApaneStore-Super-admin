import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminTenantAPI } from '../services/adminApi';
import Sidebar from '../components/Sidebar';

const Tenants = () => {
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            navigate('/login');
            return;
        }
        fetchTenants();
    }, []);

    const fetchTenants = async () => {
        try {
            const result = await adminTenantAPI.getAll();
            if (result.success) {
                setTenants(result.data);
            }
        } catch (error) {
            console.error('Error fetching tenants:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        const action = currentStatus === 'active' ? 'hide' : 'unhide';
        if (window.confirm(`Are you sure you want to ${action} this tenant?`)) {
            try {
                const result = await adminTenantAPI.toggleStatus(id, action);
                if (result.success) {
                    fetchTenants();
                }
            } catch (error) {
                console.error('Error toggling status:', error);
            }
        }
    };

    const handleDelete = async (id, name) => {
        if (window.confirm(`⚠️ Are you sure you want to permanently delete "${name}"? This will remove ALL data!`)) {
            try {
                const result = await adminTenantAPI.delete(id);
                if (result.success) {
                    fetchTenants();
                }
            } catch (error) {
                console.error('Error deleting tenant:', error);
            }
        }
    };

    const filteredTenants = tenants.filter(tenant => {
        const matchSearch = tenant.company_name?.toLowerCase().includes(search.toLowerCase()) ||
                           tenant.email?.toLowerCase().includes(search.toLowerCase()) ||
                           tenant.phone?.includes(search);
        const matchFilter = filter === 'all' || tenant.status === filter;
        return matchSearch && matchFilter;
    });

    return (
        <div style={styles.container}>
            <Sidebar />
            <div style={styles.main}>
                <div style={styles.header}>
                    <h1>👥 Tenants</h1>
                    <span style={{color:'#8e9eab'}}>{tenants.length} tenants</span>
                </div>

                <div style={styles.searchBar}>
                    <input
                        type="text"
                        placeholder="Search tenants by name, email, phone..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={styles.searchInput}
                    />
                    <select value={filter} onChange={(e) => setFilter(e.target.value)} style={styles.filterSelect}>
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="hidden">Hidden</option>
                        <option value="suspended">Suspended</option>
                    </select>
                </div>

                {loading ? (
                    <div style={styles.loading}>Loading tenants...</div>
                ) : (
                    <div style={styles.tableContainer}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th>Company</th>
                                    <th>Email</th>
                                    <th>Phone</th>
                                    <th>Plan</th>
                                    <th>Stores</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTenants.map(tenant => (
                                    <tr key={tenant.id}>
                                        <td>
                                            <a style={styles.link} onClick={() => navigate(`/tenants/${tenant.id}`)}>
                                                {tenant.company_name}
                                            </a>
                                        </td>
                                        <td>{tenant.email}</td>
                                        <td>{tenant.phone}</td>
                                        <td><span style={styles.planBadge}>{tenant.subscription_tier || 'Trial'}</span></td>
                                        <td>{tenant.store_count || 0}</td>
                                        <td>
                                            <span style={{
                                                ...styles.statusBadge,
                                                background: tenant.status === 'active' ? 'rgba(46,213,115,0.15)' : 
                                                           tenant.status === 'hidden' ? 'rgba(142,142,142,0.15)' : 'rgba(231,76,60,0.15)',
                                                color: tenant.status === 'active' ? '#2ecc71' : 
                                                       tenant.status === 'hidden' ? '#8e9eab' : '#e74c3c'
                                            }}>
                                                {tenant.status || 'Active'}
                                            </span>
                                        </td>
                                        <td>
                                            <button 
                                                style={styles.btnWarning}
                                                onClick={() => handleToggleStatus(tenant.id, tenant.status)}
                                            >
                                                {tenant.status === 'active' ? 'Hide' : 'Unhide'}
                                            </button>
                                            <button 
                                                style={styles.btnDanger}
                                                onClick={() => handleDelete(tenant.id, tenant.company_name)}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

const styles = {
    container: { display: 'flex', minHeight: '100vh', background: '#f0f2f5' },
    main: { flex: 1, padding: '30px', marginLeft: '260px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    searchBar: { display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' },
    searchInput: { flex: 1, minWidth: '250px', padding: '12px 16px', border: '1px solid #e0e0e0', borderRadius: '10px', fontSize: '14px' },
    filterSelect: { padding: '12px 16px', border: '1px solid #e0e0e0', borderRadius: '10px', fontSize: '14px', background: '#fff' },
    tableContainer: { background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
    table: { width: '100%', borderCollapse: 'collapse' },
    link: { color: '#667eea', cursor: 'pointer', fontWeight: '600' },
    planBadge: { padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: '#e3f2fd', color: '#1976d2' },
    statusBadge: { padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', display: 'inline-block' },
    btnWarning: { padding: '6px 14px', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', background: '#f39c12', color: '#fff', cursor: 'pointer', margin: '0 2px' },
    btnDanger: { padding: '6px 14px', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', background: '#e74c3c', color: '#fff', cursor: 'pointer', margin: '0 2px' },
    loading: { textAlign: 'center', padding: '40px', color: '#666' },
};

export default Tenants;
