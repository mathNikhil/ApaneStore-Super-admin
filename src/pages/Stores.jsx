import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminStoreAPI } from '../services/adminApi';
import Sidebar from '../components/Sidebar';

const Stores = () => {
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            navigate('/login');
            return;
        }
        fetchStores();
    }, []);

    const fetchStores = async () => {
        try {
            const result = await adminStoreAPI.getAll();
            if (result.success) {
                setStores(result.data);
            }
        } catch (error) {
            console.error('Error fetching stores:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredStores = stores.filter(store =>
        store.store_name?.toLowerCase().includes(search.toLowerCase()) ||
        store.tenant_name?.toLowerCase().includes(search.toLowerCase()) ||
        store.subdomain?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div style={styles.container}>
            <Sidebar />
            <div style={styles.main}>
                <div style={styles.header}>
                    <h1>🏪 Stores</h1>
                    <span style={{color:'#8e9eab'}}>{stores.length} stores</span>
                </div>

                <div style={styles.searchBar}>
                    <input
                        type="text"
                        placeholder="Search stores by name, tenant, subdomain..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={styles.searchInput}
                    />
                </div>

                {loading ? (
                    <div style={styles.loading}>Loading stores...</div>
                ) : (
                    <div style={styles.tableContainer}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th>Store</th>
                                    <th>Tenant</th>
                                    <th>Subdomain</th>
                                    <th>Admin</th>
                                    <th>Production</th>
                                    <th>Delivery</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStores.map(store => {
                                    const permissions = store.permissions || {};
                                    return (
                                        <tr key={store.id}>
                                            <td>
                                                <a style={styles.link} onClick={() => navigate(`/stores/${store.id}`)}>
                                                    {store.store_name}
                                                </a>
                                            </td>
                                            <td>
                                                <a style={styles.link} onClick={() => navigate(`/tenants/${store.tenant_id}`)}>
                                                    {store.tenant_name}
                                                </a>
                                            </td>
                                            <td>{store.subdomain}.aapnaestore.com</td>
                                            <td><span style={styles.panelEnabled}>✅</span></td>
                                            <td>
                                                <span style={permissions.production ? styles.panelEnabled : styles.panelDisabled}>
                                                    {permissions.production ? '✅' : '❌'}
                                                </span>
                                            </td>
                                            <td>
                                                <span style={permissions.delivery ? styles.panelEnabled : styles.panelDisabled}>
                                                    {permissions.delivery ? '✅' : '❌'}
                                                </span>
                                            </td>
                                            <td>
                                                <span style={{
                                                    ...styles.statusBadge,
                                                    background: store.status === 'published' ? 'rgba(46,213,115,0.15)' : 'rgba(52,152,219,0.15)',
                                                    color: store.status === 'published' ? '#2ecc71' : '#3498db'
                                                }}>
                                                    {store.status || 'Draft'}
                                                </span>
                                            </td>
                                            <td>
                                                <button style={styles.btnPrimary} onClick={() => navigate(`/stores/${store.id}`)}>
                                                    Configure
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
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
    searchBar: { marginBottom: '20px' },
    searchInput: { width: '100%', maxWidth: '400px', padding: '12px 16px', border: '1px solid #e0e0e0', borderRadius: '10px', fontSize: '14px' },
    tableContainer: { background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
    table: { width: '100%', borderCollapse: 'collapse' },
    link: { color: '#667eea', cursor: 'pointer', fontWeight: '600' },
    statusBadge: { padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', display: 'inline-block' },
    panelEnabled: { padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', background: 'rgba(46,213,115,0.15)', color: '#2ecc71' },
    panelDisabled: { padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', background: 'rgba(231,76,60,0.15)', color: '#e74c3c' },
    btnPrimary: { padding: '6px 14px', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', background: '#667eea', color: '#fff', cursor: 'pointer' },
    loading: { textAlign: 'center', padding: '40px', color: '#666' },
};

export default Stores;
