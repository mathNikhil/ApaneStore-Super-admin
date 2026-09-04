import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const API = 'https://api.aapnaestore.com/api/admin';
const getToken = () => localStorage.getItem('adminToken') || localStorage.getItem('token') || '';

const styles = {
  container: { padding: '30px', marginLeft: '260px', flex: 1 },
  title: { fontSize: '28px', fontWeight: '700', color: '#1a2332', marginBottom: '8px' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' },
  statCard: { background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e8ecf0' },
  statNum: { fontSize: '28px', fontWeight: '700', color: '#1a2332' },
  statLabel: { fontSize: '13px', color: '#8e9eab', marginTop: '4px' },
  table: { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e8ecf0' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#8e9eab', textTransform: 'uppercase', background: '#f8fafc', borderBottom: '1px solid #e8ecf0' },
  td: { padding: '12px 16px', fontSize: '14px', color: '#1a2332', borderBottom: '1px solid #f0f4f8' },
};

const badge = (color, text) => (
  <span style={{ display:'inline-block', padding:'3px 10px', borderRadius:'20px', fontSize:'12px', fontWeight:'600',
    background: color==='green'?'#e8f5e9':color==='red'?'#fce4ec':'#fff3e0',
    color: color==='green'?'#2e7d32':color==='red'?'#c62828':'#e65100' }}>{text}</span>
);

export default function WhatsAppMarket() {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetch(`${API}/market/subscriptions`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    }).then(r => r.json()).then(d => {
      setSubs(Array.isArray(d) ? d : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = subs.filter(s => {
    const matchSearch = !search ||
      s.tenant_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.tenant_email?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || (filter === 'active' ? s.is_active : !s.is_active);
    return matchSearch && matchFilter;
  });

  const totalActive = subs.filter(s => s.is_active).length;
  const totalRevenue = subs.reduce((sum, s) => sum + (s.price_paid || 0), 0);
  const totalSent = subs.reduce((sum, s) => sum + (s.quota_used || 0), 0);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <Sidebar />
      <div style={styles.container}>
      <h1 style={styles.title}>📱 WhatsApp Market</h1>
      <p style={{ color:'#8e9eab', fontSize:'14px', marginBottom:'24px' }}>Tenant subscriptions and usage</p>

      <div style={styles.statsRow}>
        <div style={styles.statCard}><div style={styles.statNum}>{subs.length}</div><div style={styles.statLabel}>Total subscribers</div></div>
        <div style={styles.statCard}><div style={{...styles.statNum,color:'#43a047'}}>{totalActive}</div><div style={styles.statLabel}>Active plans</div></div>
        <div style={styles.statCard}><div style={{...styles.statNum,color:'#1976d2'}}>₹{(totalRevenue/100).toFixed(0)}</div><div style={styles.statLabel}>Total revenue</div></div>
        <div style={styles.statCard}><div style={styles.statNum}>{totalSent}</div><div style={styles.statLabel}>Messages sent</div></div>
      </div>

      <div style={{ display:'flex', gap:'12px', marginBottom:'16px' }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          style={{ flex:1, padding:'10px 14px', borderRadius:'8px', border:'1px solid #e8ecf0', fontSize:'14px', outline:'none' }} />
        <select value={filter} onChange={e => setFilter(e.target.value)}
          style={{ padding:'10px 14px', borderRadius:'8px', border:'1px solid #e8ecf0', fontSize:'14px', outline:'none' }}>
          <option value="all">All Plans</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {loading ? <div style={{ textAlign:'center', padding:'40px', color:'#8e9eab' }}>Loading...</div> : (
        <table style={styles.table}>
          <thead>
            <tr>
              {['Tenant','Plan','Status','Quota used','Price paid','Activated','Expires'].map(h => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} style={{...styles.td, textAlign:'center', color:'#8e9eab'}}>No subscriptions found</td></tr>
            ) : filtered.map(s => {
              const quotaPct = s.max_scheduled > 0 ? (s.quota_used / s.max_scheduled) * 100 : 0;
              const barColor = quotaPct >= 80 ? '#e53935' : quotaPct >= 50 ? '#fb8c00' : '#43a047';
              const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'}) : '—';
              return (
                <tr key={s.id}>
                  <td style={styles.td}>
                    <Link to={`/tenants/${s.tenant_id}`} style={{ fontWeight:'600', color:'#1976d2', textDecoration:'none' }}>{s.tenant_name || '—'}</Link>
                    <div style={{ fontSize:'12px', color:'#8e9eab' }}>{s.tenant_email}</div>
                  </td>
                  <td style={styles.td}>{badge('orange', s.plan_name || 'Unknown')}</td>
                  <td style={styles.td}>{badge(s.is_active ? 'green' : 'red', s.is_active ? 'Active' : (s.deactivation_reason || 'Inactive'))}</td>
                  <td style={styles.td}>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                      <div style={{ height:'6px', borderRadius:'3px', background:'#e8ecf0', overflow:'hidden', width:'80px' }}>
                        <div style={{ height:'100%', width:`${Math.min(quotaPct,100)}%`, background:barColor, borderRadius:'3px' }} />
                      </div>
                      <span style={{ fontSize:'12px', color:'#8e9eab' }}>{s.quota_used}/{s.max_scheduled}</span>
                    </div>
                  </td>
                  <td style={styles.td}>₹{((s.price_paid||0)/100).toFixed(0)}</td>
                  <td style={{...styles.td, fontSize:'12px', color:'#8e9eab'}}>{fmt(s.activated_at)}</td>
                  <td style={{...styles.td, fontSize:'12px', color: s.is_active && s.expires_at && new Date(s.expires_at) < new Date(Date.now()+3*24*60*60*1000) ? '#e53935' : '#8e9eab'}}>{fmt(s.expires_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      </div>
    </div>
  );
}
