import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import API_BASE_URL from '../config/api';

const DEFAULT_URL = 'https://aapnaestore.com/profile/aboutus';
const box = { background: '#fff', borderRadius: '12px', padding: '24px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' };
const head = { fontSize: '15px', fontWeight: '600', marginBottom: '16px', color: '#1e293b', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' };
const labelStyle = { display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' };
const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', marginBottom: '4px' };
const hint = { fontSize: '11px', color: '#94a3b8', marginBottom: '16px' };
const blank = (path) => ({ path, title: '', description: '', h1: '', body: '', noindex: false });

const SeoSettings = () => {
    const navigate = useNavigate();
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');
    const [f, setF] = useState({ title: '', description: '', ogDescription: '', keywords: '', ogImage: '', siteName: '', marketingUrl: DEFAULT_URL });
    const [pages, setPages] = useState([blank('/profile/aboutus'), blank('/profile/pricing')]);
    const set = (k, v) => setF(p => ({ ...p, [k]: v }));
    const setPage = (i, k, v) => setPages(p => p.map((x, j) => (j === i ? { ...x, [k]: v } : x)));

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) { navigate('/login'); return; }
        fetch(`${API_BASE_URL}/api/admin/seo-settings`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(data => {
                if (data.success && data.data) {
                    const d = data.data;
                    setF({
                        title: d.title || '', description: d.description || '', ogDescription: d.ogDescription || '',
                        keywords: d.keywords || '', ogImage: d.ogImage || '', siteName: d.siteName || '',
                        marketingUrl: d.marketingUrl || DEFAULT_URL,
                    });
                    if (Array.isArray(d.pages) && d.pages.length) setPages(d.pages);
                }
            })
            .catch(e => console.error('Fetch error:', e));
    }, []);

    const handleSave = () => {
        setSaving(true);
        setError('');
        const token = localStorage.getItem('adminToken');
        fetch(`${API_BASE_URL}/api/admin/seo-settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ ...f, siteUrl: 'https://aapnaestore.com', pages }),
        })
            .then(r => r.json())
            .then(data => {
                if (data.success) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
                else setError(data.error || 'Save failed');
            })
            .catch(e => setError(e.message))
            .finally(() => setSaving(false));
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, sans-serif' }}>
            <Sidebar />
            <div style={{ flex: 1, padding: '32px', marginLeft: '220px', maxWidth: '800px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>SEO & SMO Settings</h1>
                <p style={{ color: '#64748b', marginBottom: '24px', fontSize: '14px' }}>Control how AapnaEstore appears on Google, WhatsApp and social media.</p>

                <div style={box}>
                    <h2 style={head}>Google Search Preview (homepage)</h2>
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
                        <div style={{ fontSize: '18px', color: '#1a0dab', marginBottom: '4px' }}>{f.title || 'Page Title'}</div>
                        <div style={{ fontSize: '13px', color: '#006621', marginBottom: '4px' }}>https://aapnaestore.com</div>
                        <div style={{ fontSize: '13px', color: '#4d5156' }}>{f.description || 'Meta description will appear here'}</div>
                    </div>
                </div>

                <div style={box}>
                    <h2 style={head}>Homepage SEO</h2>
                    <label style={labelStyle}>Page Title *</label>
                    <input style={inputStyle} value={f.title} onChange={e => set('title', e.target.value.slice(0, 60))} />
                    <div style={{ ...hint, textAlign: 'right', color: f.title.length > 55 ? '#ef4444' : '#94a3b8' }}>{f.title.length}/60</div>

                    <label style={labelStyle}>Meta Description *</label>
                    <textarea style={{ ...inputStyle, minHeight: '80px' }} value={f.description} onChange={e => set('description', e.target.value.slice(0, 160))} />
                    <div style={{ ...hint, textAlign: 'right', color: f.description.length > 150 ? '#ef4444' : '#94a3b8' }}>{f.description.length}/160</div>

                    <label style={labelStyle}>Keywords</label>
                    <input style={inputStyle} value={f.keywords} onChange={e => set('keywords', e.target.value)} />
                    <div style={hint}>Comma separated. Google ignores this field; it is kept for other tools.</div>
                </div>

                <div style={box}>
                    <h2 style={head}>Social Media (WhatsApp, Facebook, Twitter)</h2>
                    <label style={labelStyle}>Social Media Description</label>
                    <textarea style={{ ...inputStyle, minHeight: '80px' }} value={f.ogDescription} onChange={e => set('ogDescription', e.target.value.slice(0, 200))} />
                    <div style={hint}>Shown when the link is shared.</div>

                    <label style={labelStyle}>OG Image URL</label>
                    <input style={inputStyle} value={f.ogImage} onChange={e => set('ogImage', e.target.value)} />
                    <div style={hint}>Preview image, 1200x630px.</div>
                    {f.ogImage && <img src={f.ogImage} alt="Preview" style={{ marginBottom: '16px', maxWidth: '300px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />}

                    <label style={labelStyle}>Site Name</label>
                    <input style={inputStyle} value={f.siteName} onChange={e => set('siteName', e.target.value)} />
                    <div style={hint}></div>

                    <label style={labelStyle}>Marketing Page URL (used when the homepage link is shared)</label>
                    <input style={inputStyle} value={f.marketingUrl} onChange={e => set('marketingUrl', e.target.value)} placeholder={DEFAULT_URL} />
                    {f.marketingUrl && <a href={f.marketingUrl} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: '#2563eb' }}>{f.marketingUrl}</a>}
                </div>

                <div style={box}>
                    <h2 style={head}>Pages (what Google reads for each address)</h2>
                    <p style={{ ...hint, marginTop: '-8px' }}>Each page gets its own title, description, heading and text. The address is never changed by this screen.</p>
                    {pages.map((p, i) => (
                        <div key={i} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '16px', marginBottom: '16px' }}>
                            <label style={labelStyle}>Page address (path only)</label>
                            <input style={{ ...inputStyle, fontWeight: 600 }} value={p.path} onChange={e => setPage(i, 'path', e.target.value.trim())} placeholder="/profile/aboutus" />
                            <label style={labelStyle}>Title (max 60)</label>
                            <input style={inputStyle} value={p.title} onChange={e => setPage(i, 'title', e.target.value.slice(0, 60))} />
                            <label style={labelStyle}>Meta description (max 160)</label>
                            <textarea style={{ ...inputStyle, minHeight: '60px' }} value={p.description} onChange={e => setPage(i, 'description', e.target.value.slice(0, 160))} />
                            <label style={labelStyle}>Page heading (H1)</label>
                            <input style={inputStyle} value={p.h1} onChange={e => setPage(i, 'h1', e.target.value)} />
                            <label style={labelStyle}>Page text for search engines (blank line between paragraphs)</label>
                            <textarea style={{ ...inputStyle, minHeight: '140px' }} value={p.body} onChange={e => setPage(i, 'body', e.target.value)} />
                            <label style={{ fontSize: '13px' }}>
                                <input type="checkbox" checked={!!p.noindex} onChange={e => setPage(i, 'noindex', e.target.checked)} /> Hide this page from Google
                            </label>
                            <button onClick={() => setPages(list => list.filter((_, j) => j !== i))} style={{ marginLeft: '16px', fontSize: '12px', cursor: 'pointer' }}>Remove</button>
                        </div>
                    ))}
                    <button onClick={() => setPages(list => [...list, blank('/profile/')])} style={{ padding: '8px 14px', cursor: 'pointer' }}>+ Add page</button>
                </div>

                {error && <div style={{ color: '#ef4444', marginBottom: '12px', fontSize: '14px' }}>{error}</div>}
                <button onClick={handleSave} disabled={saving}
                    style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                    {saving ? 'Saving...' : 'Save Settings'}
                </button>
                {saved && <span style={{ color: '#16a34a', fontSize: '14px', marginLeft: '12px', fontWeight: '500' }}>✓ Saved successfully</span>}
            </div>
        </div>
    );
};

export default SeoSettings;
