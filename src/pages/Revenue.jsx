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
  const [invoicePopup, setInvoicePopup] = useState(null);
  const [invoiceFields, setInvoiceFields] = useState({ tenant_business_name: '', tenant_gstin: '', tenant_state: '', tenant_address: '' });
  const [waOrders, setWaOrders] = useState([]);
  const [sortCol, setSortCol] = useState('paid_at');
  const [sortDir, setSortDir] = useState('desc');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) { navigate('/login'); return; }
    fetch(`${API_BASE_URL}/api/admin/market/all-invoices`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json()).then(d => setWaOrders(Array.isArray(d) ? d : [])).catch(() => {});

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

    // Add WA revenue
    const waRevenue = waOrders.reduce((s, o) => s + parseFloat(o.amount || 0), 0);
    const waGstRate = 18;
    const waBase = waOrders.reduce((s, o) => {
      const amt = parseFloat(o.amount || 0);
      return s + parseFloat((amt / (1 + waGstRate/100)).toFixed(2));
    }, 0);
    const waGst = waRevenue - waBase;

    return {
      totalBase: totalBase + waBase,
      totalGst: totalGst + waGst,
      totalRevenue: totalRevenue + waRevenue,
      count: subscriptions.length,
      waCount: waOrders.length,
      waRevenue,
    };
  }, [subscriptions, waOrders]);

  const doDownload = async (sub, fields) => {
    setDownloading(sub.id);
    const token = localStorage.getItem('adminToken');
    const url = `${API_BASE_URL}/api/admin/invoices/${sub.id}/download`;
    try {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { 
        const txt = await res.text();
        alert('Failed: ' + res.status + ' ' + txt.substring(0, 100)); 
        return; 
      }
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = blobUrl;
      a.download = (sub.invoice_number || sub.id) + '.pdf';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { document.body.removeChild(a); window.URL.revokeObjectURL(blobUrl); }, 100);
    } catch (err) { 
      console.error('Download error:', err); 
      alert('Download error: ' + err.message); 
    } finally { 
      setDownloading(null); 
    }
  };
  const handlePopupDownload = () => { const s = invoicePopup; setInvoicePopup(null); doDownload(s, invoiceFields); };
  const handleDownload = (sub) => {
    // Merge subscription fields with tenant profile fields as fallback
    const merged = {
      tenant_business_name: sub.tenant_business_name || sub.tenant_business_name_profile || '',
      tenant_gstin: sub.tenant_gstin || sub.tenant_gst_number_profile || '',
      tenant_state: sub.tenant_state || sub.tenant_state_profile || '',
      tenant_address: sub.tenant_address || sub.tenant_address_profile || '',
    };
    if (!merged.tenant_business_name || !merged.tenant_state) {
      setInvoiceFields(merged);
      setInvoicePopup(sub);
    } else { doDownload(sub, merged); }
  };


  const handleBulkDownload = async () => {
    setBulkDownloading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/api/admin/invoices/bulk-download`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) { alert('Bulk download failed'); return; }
      const html = await res.text();
      const w = window.open('', '_blank');
      w.document.write(html);
      w.document.close();
      w.print();
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
            <div style={styles.summarySubLabel}>{summary.count} store + {summary.waCount} WA subscriptions</div>
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

        {/* WhatsApp Market Revenue */}
        {waOrders.length > 0 && (
          <div style={{marginTop:32}}>
            <h2 style={{fontSize:20,fontWeight:700,marginBottom:4}}>📱 WhatsApp Market Revenue</h2>
            <p style={{color:'#8e9eab',fontSize:13,marginBottom:16}}>{waOrders.length} paid subscriptions</p>
            <div style={styles.tableWrap}>
              <table style={{...styles.table,minWidth:700}}>
                <thead>
                  <tr style={styles.thead}>
                    {['Tenant','Plan','Paid On','Base (₹)','GST %','GST (₹)','Total (₹)','Invoice'].map(h=>(
                      <th key={h} style={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {waOrders.map((order,idx) => {
                    const amt = parseFloat(order.amount || 0);
                    const gstRate = parseFloat(order.gst_rate || 18);
                    const base = parseFloat(order.base_amount || (amt/(1+gstRate/100)).toFixed(2));
                    const gst = parseFloat((amt - base).toFixed(2));
                    const total = amt;
                    const date = order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : 'N/A';
                    const yr = new Date(order.created_at||Date.now()).getFullYear();
                    const invoiceNo = `WA-INV-${yr}-${String(order.id).padStart(4,'0')}`;
                    const downloadWA = () => {
                      const html = `<!DOCTYPE html><html><head><title>${invoiceNo}</title><style>body{font-family:Arial;max-width:600px;margin:40px auto}table{width:100%;border-collapse:collapse;margin:20px 0}th{background:#f8fafc;padding:10px;text-align:left;border-bottom:2px solid #e8ecf0}td{padding:10px;border-bottom:1px solid #f0f4f8}.b{font-weight:700}</style></head><body><div style="display:flex;justify-content:space-between;margin-bottom:30px"><div><div style="font-size:24px;font-weight:700;color:#006d2f">AapnaEstore</div><div style="font-size:12px;color:#8e9eab">WhatsApp Market — Seller Copy</div></div><div style="text-align:right"><div class="b">${invoiceNo}</div><div style="font-size:12px;color:#8e9eab">${date}</div></div></div><p><b>Tenant:</b> ${order.tenant_name||'—'} (${order.tenant_email||''})</p><table><tr><th>Description</th><th>Amount</th></tr><tr><td>WhatsApp Market — ${order.plan_name||'Subscription'}</td><td>₹${base.toFixed(2)}</td></tr><tr><td>GST @ ${gstRate}%</td><td>₹${gst.toFixed(2)}</td></tr><tr class="b"><td>Total</td><td>₹${total.toFixed(2)}</td></tr></table><div style="margin-top:20px;font-size:12px;color:#8e9eab"><p>Order: ${order.order_id}</p><p>AapnaEstore · support@aapnaestore.com</p></div></body></html>`;
                      const w=window.open('','_blank');w.document.write(html);w.document.close();w.print();
                    };
                    return (
                      <tr key={order.id} style={{...styles.tr,background:idx%2===0?'#fff':'#fafafa'}}>
                        <td style={styles.td}><div style={{fontWeight:600}}>{order.tenant_name||'—'}</div><div style={{fontSize:11,color:'#8e9eab'}}>{order.tenant_email}</div></td>
                        <td style={styles.td}>{order.plan_name||'—'}</td>
                        <td style={{...styles.td,fontSize:12}}>{date}</td>
                        <td style={{...styles.td,textAlign:'right'}}>₹{base.toFixed(2)}</td>
                        <td style={{...styles.td,textAlign:'center'}}>{gstRate}%</td>
                        <td style={{...styles.td,textAlign:'right',color:'#f59e0b',fontWeight:500}}>₹{gst.toFixed(2)}</td>
                        <td style={{...styles.td,textAlign:'right',fontWeight:700,color:'#006d2f'}}>₹{total.toFixed(2)}</td>
                        <td style={styles.td}><button onClick={downloadWA} style={styles.dlBtn}>⬇ PDF</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      {invoicePopup && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, width: 480, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Tenant Invoice Details</h2>
            <p style={{ fontSize: 13, color: '#556067', marginBottom: 24 }}>Required for GST compliance</p>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#556067', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Business Name *</label>
              <input value={invoiceFields.tenant_business_name} onChange={e => setInvoiceFields(p => ({...p, tenant_business_name: e.target.value}))} placeholder="Registered business name" style={{ width: '100%', padding: '10px 14px', border: '1px solid #e0e3e6', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#556067', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>GSTIN (optional)</label>
              <input value={invoiceFields.tenant_gstin} onChange={e => setInvoiceFields(p => ({...p, tenant_gstin: e.target.value.toUpperCase()}))} placeholder="e.g. 22AAAAA0000A1Z5" maxLength={15} style={{ width: '100%', padding: '10px 14px', border: '1px solid #e0e3e6', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#556067', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>State *</label>
              <select value={invoiceFields.tenant_state} onChange={e => setInvoiceFields(p => ({...p, tenant_state: e.target.value}))} style={{ width: '100%', padding: '10px 14px', border: '1px solid #e0e3e6', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}>
                <option value="">Select State</option>
                <option value="Delhi">Delhi</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
                <option value="Gujarat">Gujarat</option>
                <option value="Rajasthan">Rajasthan</option>
                <option value="Uttar Pradesh">Uttar Pradesh</option>
                <option value="West Bengal">West Bengal</option>
                <option value="Andhra Pradesh">Andhra Pradesh</option>
                <option value="Telangana">Telangana</option>
                <option value="Kerala">Kerala</option>
                <option value="Punjab">Punjab</option>
                <option value="Haryana">Haryana</option>
                <option value="Madhya Pradesh">Madhya Pradesh</option>
                <option value="Bihar">Bihar</option>
                <option value="Odisha">Odisha</option>
                <option value="Assam">Assam</option>
                <option value="Jharkhand">Jharkhand</option>
                <option value="Chhattisgarh">Chhattisgarh</option>
                <option value="Goa">Goa</option>
                <option value="Himachal Pradesh">Himachal Pradesh</option>
                <option value="Uttarakhand">Uttarakhand</option>
                <option value="Puducherry">Puducherry</option>
                <option value="Chandigarh">Chandigarh</option>
              </select>
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#556067', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Billing Address</label>
              <textarea value={invoiceFields.tenant_address} onChange={e => setInvoiceFields(p => ({...p, tenant_address: e.target.value}))} placeholder="Full billing address" style={{ width: '100%', padding: '10px 14px', border: '1px solid #e0e3e6', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', height: 80, resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setInvoicePopup(null)} style={{ flex: 1, padding: 10, border: '1px solid #e0e3e6', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 14 }}>Cancel</button>
              <button onClick={handlePopupDownload} disabled={!invoiceFields.tenant_business_name || !invoiceFields.tenant_state} style={{ flex: 2, padding: 10, border: 'none', borderRadius: 8, background: '#006d2f', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>Save & Download</button>
            </div>
          </div>
        </div>
      )}
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
