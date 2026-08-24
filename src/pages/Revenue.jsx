import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import API_BASE_URL from '../config/api';

const PLAN_LABELS = {
  subdomain_apnaestore: 'Free Subdomain + AapnaEstore Hosting',
  custom_domain_apnaestore: 'Custom Domain + AapnaEstore Hosting',
  custom_domain_own_hosting: 'Custom Domain + Own Hosting',
};
const CYCLE_LABELS = { '30days': '30 Days', '90days': '90 Days', '365days': '365 Days' };

const SortIcon = ({ col, sortCol, sortDir }) => {
  if (sortCol !== col) return <span style={{color:'#ccc', marginLeft:4}}>⇅</span>;
  return <span style={{marginLeft:4}}>{sortDir === 'asc' ? '↑' : '↓'}</span>;
};

const Revenue = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);
  const [bulkDownloading, setBulkDownloading] = useState(false);
  const [sortCol, setSortCol] = useState('paid_at');
  const [sortDir, setSortDir] = useState('desc');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) { navigate('/login'); return; }
    fetch(`${API_BASE_URL}/api/admin/revenue`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(res => { if (res.success) setData(res.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  // Filter out draft stores + sort
  const subscriptions = useMemo(() => {
    if (!data?.subscriptions) return [];
    const filtered = data.subscriptions.filter(s => s.store_status !== 'draft');
    return [...filtered].sort((a, b) => {
      let av = a[sortCol], bv = b[sortCol];
      if (sortCol === 'base_amount' || sortCol === 'tax_amount' || sortCol === 'total_amount') {
        av = parseFloat(av || 0); bv = parseFloat(bv || 0);
      } else if (sortCol === 'paid_at' || sortCol === 'valid_until') {
        av = new Date(av || 0); bv = new Date(bv || 0);
      } else {
        av = (av || '').toString().toLowerCase();
        bv = (bv || '').toString().toLowerCase();
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortCol, sortDir]);

  // Recalculate summary from filtered data
  const summary = useMemo(() => {
    const totalBase = subscriptions.reduce((s, r) => s + parseFloat(r.base_amount || 0), 0);
    const totalGst = subscriptions.reduce((s, r) => s + parseFloat(r.tax_amount || 0), 0);
    const totalRevenue = subscriptions.reduce((s, r) => s + parseFloat(r.total_amount || 0), 0);
    return { totalBase, totalGst, totalRevenue, count: subscriptions.length };
  }, [subscriptions]);

  const handleDownload = async (sub) => {
    setDownloading(sub.id);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/api/admin/invoices/${sub.id}/download`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) { alert('Failed to download invoice'); return; }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${sub.invoice_number || sub.id}.pdf`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch { alert('Failed to download invoice'); }
    finally { setDownloading(null); }
  };

  const handleBulkDownload = async () => {
    setBulkDownloading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/api/admin/invoices/bulk-download`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) { alert('Bulk download failed'); return; }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'AapnaEstore-Invoices.zip';
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch { alert('Bulk download failed'); }
    finally { setBulkDownloading(false); }
  };

  const fmt = (n) => parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

  if (loading) return (
    <div style={styles.container}><Sidebar />
      <div style={styles.main}><p>Loading revenue data...</p></div>
    </div>
  );

  return (
    <div style={styles.container}>
      <Sidebar />
      <div style={styles.main}>

        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={{ margin: 0 }}>💰 Revenue Overview</h1>
            <p style={{ color: '#8e9eab', margin: '4px 0 0' }}>Paid subscriptions only · Draft stores excluded · Seller copy for tax reference</p>
          </div>
          <div style={{display:'flex', gap:12}}>
            <button onClick={handleBulkDownload} disabled={bulkDownloading} style={styles.bulkBtn}>
              {bulkDownloading ? '⏳ Preparing...' : '⬇ Download All Invoices (ZIP)'}
            </button>
            <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>← Dashboard</button>
          </div>
        </div>

        {/* Summary Cards */}
        <div style={styles.summaryGrid}>
          <div style={{...styles.summaryCard, borderTop:'4px solid #006d2f'}}>
            <div style={styles.summaryLabel}>Total Revenue (incl. GST)</div>
            <div style={{...styles.summaryValue, color:'#006d2f'}}>₹{fmt(summary.totalRevenue)}</div>
            <div style={styles.summarySubLabel}>{summary.count} paid subscriptions</div>
          </div>
          <div style={{...styles.summaryCard, borderTop:'4px solid #1a73e8'}}>
            <div style={styles.summaryLabel}>Base Amount (excl. GST)</div>
            <div style={{...styles.summaryValue, color:'#1a73e8'}}>₹{fmt(summary.totalBase)}</div>
            <div style={styles.summarySubLabel}>Net platform revenue</div>
          </div>
          <div style={{...styles.summaryCard, borderTop:'4px solid #f59e0b'}}>
            <div style={styles.summaryLabel}>GST Collected</div>
            <div style={{...styles.summaryValue, color:'#f59e0b'}}>₹{fmt(summary.totalGst)}</div>
            <div style={styles.summarySubLabel}>To be remitted to govt</div>
          </div>
        </div>

        {/* Table */}
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                {[
                  {col:'store_name', label:'Store'},
                  {col:'tenant_name', label:'Tenant'},
                  {col:'plan_key', label:'Plan'},
                  {col:'billing_cycle', label:'Duration'},
                  {col:'paid_at', label:'Paid On'},
                  {col:'valid_until', label:'Valid Until'},
                  {col:'base_amount', label:'Base (₹)'},
                  {col:'tax_amount', label:'GST (₹)'},
                  {col:'total_amount', label:'Total (₹)'},
                ].map(({col, label}) => (
                  <th key={col} style={{...styles.th, cursor:'pointer', userSelect:'none'}} onClick={() => handleSort(col)}>
                    {label}<SortIcon col={col} sortCol={sortCol} sortDir={sortDir} />
                  </th>
                ))}
                <th style={styles.th}>Invoice</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((sub, idx) => {
                const storeUrl = sub.subdomain ? `${sub.subdomain}.aapnaestore.com` : (sub.custom_domain || sub.store_name);
                const base = parseFloat(sub.base_amount || 0);
                const gst = parseFloat(sub.tax_amount || (parseFloat(sub.total_amount || 0) - base));
                const total = parseFloat(sub.total_amount || 0);
                return (
                  <tr key={sub.id} style={{...styles.tr, background: idx % 2 === 0 ? '#fff' : '#fafafa'}}>
                    <td style={styles.td}>
                      <div style={{fontWeight:600, fontSize:13}}>{sub.store_name}</div>
                      <div style={{fontSize:11, color:'#8e9eab'}}>{storeUrl}</div>
                      <span style={{...styles.badge, background: sub.store_status === 'published' ? '#e6f4ea' : '#fef3c7', color: sub.store_status === 'published' ? '#1e8e3e' : '#92400e'}}>
                        {sub.store_status}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={{fontWeight:600, fontSize:13}}>{sub.tenant_name}</div>
                      <div style={{fontSize:11, color:'#8e9eab'}}>{sub.tenant_phone}</div>
                    </td>
                    <td style={{...styles.td, fontSize:11, maxWidth:160}}>{PLAN_LABELS[sub.plan_key] || sub.plan_key}</td>
                    <td style={{...styles.td, textAlign:'center'}}>
                      <span style={styles.cycleBadge}>{CYCLE_LABELS[sub.billing_cycle] || sub.billing_cycle}</span>
                    </td>
                    <td style={{...styles.td, fontSize:12}}>
                      {sub.paid_at ? new Date(sub.paid_at).toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'}) : 'N/A'}
                    </td>
                    <td style={{...styles.td, fontSize:12}}>
                      {sub.valid_until ? new Date(sub.valid_until).toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'}) : 'N/A'}
                    </td>
                    <td style={{...styles.td, textAlign:'right', fontWeight:500}}>₹{fmt(base)}</td>
                    <td style={{...styles.td, textAlign:'right', color:'#f59e0b', fontWeight:500}}>₹{fmt(gst)}</td>
                    <td style={{...styles.td, textAlign:'right', fontWeight:700, color:'#006d2f'}}>₹{fmt(total)}</td>
                    <td style={styles.td}>
                      <button
                        onClick={() => handleDownload(sub)}
                        disabled={downloading === sub.id}
                        style={styles.dlBtn}
                      >
                        {downloading === sub.id ? '...' : '⬇ PDF'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{background:'#1a1a2e', color:'#fff'}}>
                <td colSpan={6} style={{...styles.td, fontWeight:700, color:'#fff'}}>
                  GRAND TOTAL ({summary.count} subscriptions)
                </td>
                <td style={{...styles.td, textAlign:'right', fontWeight:700, color:'#fff'}}>₹{fmt(summary.totalBase)}</td>
                <td style={{...styles.td, textAlign:'right', fontWeight:700, color:'#f59e0b'}}>₹{fmt(summary.totalGst)}</td>
                <td style={{...styles.td, textAlign:'right', fontWeight:700, color:'#25D366', fontSize:16}}>₹{fmt(summary.totalRevenue)}</td>
                <td style={styles.td}></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div style={styles.taxNote}>
          <strong>📋 Tax Note:</strong> GST collected ₹{fmt(summary.totalGst)} needs to be remitted to the government.
          Net platform revenue (base) is ₹{fmt(summary.totalBase)}.
          Draft stores are excluded from this report.
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { display:'flex', minHeight:'100vh', background:'#f5f6fa' },
  main: { flex:1, marginLeft:'260px', padding:'32px' },
  header: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'24px' },
  backBtn: { padding:'8px 16px', background:'#f0f2f5', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:600, fontSize:13 },
  bulkBtn: { padding:'8px 18px', background:'#006d2f', color:'#fff', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:700, fontSize:13 },
  summaryGrid: { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'20px', marginBottom:'28px' },
  summaryCard: { background:'#fff', padding:'20px 24px', borderRadius:'14px', boxShadow:'0 2px 10px rgba(0,0,0,0.06)' },
  summaryLabel: { fontSize:12, color:'#8e9eab', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 },
  summaryValue: { fontSize:28, fontWeight:800, marginBottom:4 },
  summarySubLabel: { fontSize:11, color:'#8e9eab' },
  tableWrap: { background:'#fff', borderRadius:'14px', overflow:'auto', boxShadow:'0 2px 10px rgba(0,0,0,0.06)', marginBottom:'20px' },
  table: { width:'100%', borderCollapse:'collapse', minWidth:1000 },
  thead: { background:'#f8f9fb' },
  th: { padding:'12px 14px', textAlign:'left', fontSize:11, fontWeight:700, color:'#556067', textTransform:'uppercase', letterSpacing:'0.5px', borderBottom:'2px solid #e0e3e6', whiteSpace:'nowrap' },
  tr: { borderBottom:'1px solid #f2f4f7' },
  td: { padding:'12px 14px', fontSize:13, color:'#191c1e', verticalAlign:'middle' },
  badge: { fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:'999px', display:'inline-block', marginTop:3 },
  cycleBadge: { background:'#e0f2fe', color:'#0369a1', fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:'999px' },
  dlBtn: { padding:'5px 12px', background:'#006d2f', color:'#fff', border:'none', borderRadius:'7px', cursor:'pointer', fontSize:12, fontWeight:700 },
  taxNote: { background:'#fff3cd', border:'1px solid #ffc107', borderRadius:'10px', padding:'14px 18px', fontSize:13, color:'#856404' },
};

export default Revenue;
