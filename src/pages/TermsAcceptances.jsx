import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminTermsAPI } from '../services/adminApi';
import Sidebar from '../components/Sidebar';

// ✅ Legal audit trail — every time a tenant accepts the Terms &
// Conditions to publish a store, it's recorded (tenant, store, exact
// version accepted, timestamp, IP). This page lets you look that record
// up if it's ever needed as evidence.
const TermsAcceptances = () => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            navigate('/login');
            return;
        }
        fetchRecords();
    }, []);

    const fetchRecords = async () => {
        try {
            const result = await adminTermsAPI.getAcceptances();
            if (result.success) setRecords(result.data);
        } catch (error) {
            console.error('Error fetching terms acceptances:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <Sidebar />
            <div style={styles.main}>
                <h1>📋 Terms Acceptance Records</h1>
                <p style={{ color: '#8e9eab', marginBottom: '20px' }}>
                    Audit trail of every Terms &amp; Conditions acceptance recorded when a tenant published a store.
                </p>

                {loading ? (
                    <div style={styles.loading}>Loading...</div>
                ) : records.length === 0 ? (
                    <div style={styles.empty}>No acceptance records yet.</div>
                ) : (
                    <div style={styles.tableWrap}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>Tenant</th>
                                    <th style={styles.th}>Store</th>
                                    <th style={styles.th}>Terms Version</th>
                                    <th style={styles.th}>Accepted At</th>
                                    <th style={styles.th}>IP Address</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.map((r) => (
                                    <tr key={r.id}>
                                        <td style={styles.td}>
                                            <div style={{ fontWeight: '600' }}>{r.tenant_name || '—'}</div>
                                            <div style={{ fontSize: '12px', color: '#8e9eab' }}>{r.tenant_phone}</div>
                                        </td>
                                        <td style={styles.td}>
                                            <div style={{ fontWeight: '600' }}>{r.store_name || '—'}</div>
                                            <div style={{ fontSize: '12px', color: '#8e9eab' }}>{r.subdomain}</div>
                                        </td>
                                        <td style={styles.td}><code style={styles.code}>{r.terms_version}</code></td>
                                        <td style={styles.td}>{new Date(r.accepted_at).toLocaleString('en-IN')}</td>
                                        <td style={styles.td}>{r.ip_address || '—'}</td>
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
    container: { display: 'flex', minHeight: '100vh', background: '#f5f6fa' },
    main: { flex: 1, marginLeft: '260px', padding: '32px' },
    loading: { textAlign: 'center', padding: '40px', color: '#666' },
    empty: { textAlign: 'center', padding: '40px', color: '#8e9eab', background: '#fff', borderRadius: '12px' },
    tableWrap: { background: '#fff', borderRadius: '14px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', overflow: 'hidden' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '14px 16px', fontSize: '12px', color: '#8e9eab', textTransform: 'uppercase', borderBottom: '1px solid #f0f2f5' },
    td: { padding: '14px 16px', fontSize: '14px', color: '#1a1a2e', borderBottom: '1px solid #f7f9fb' },
    code: { fontSize: '12px', background: '#f0f2f5', padding: '3px 8px', borderRadius: '6px', fontFamily: 'monospace' },
};

export default TermsAcceptances;
