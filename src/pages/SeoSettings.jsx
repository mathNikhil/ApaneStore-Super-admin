import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import API_BASE_URL from '../config/api';

const SeoSettings = () => {
    const navigate = useNavigate();
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [ogDescription, setOgDescription] = useState('');
    const [keywords, setKeywords] = useState('');
    const [ogImage, setOgImage] = useState('');
    const [siteName, setSiteName] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) { navigate('/login'); return; }
        
        fetch(`${API_BASE_URL}/api/admin/seo-settings`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(r => r.json())
        .then(data => {
            console.log('SEO data:', data);
            if (data.success && data.data) {
                setTitle(data.data.title || '');
                setDescription(data.data.description || '');
                setOgDescription(data.data.ogDescription || '');
                setKeywords(data.data.keywords || '');
                setOgImage(data.data.ogImage || '');
                setSiteName(data.data.siteName || '');
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
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ title, description, ogDescription, keywords, ogImage, siteName, siteUrl: 'https://aapnaestore.com' })
        })
        .then(r => r.json())
        .then(data => {
            console.log('Save result:', data);
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

                {/* Google Preview */}
                <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <h2 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '12px', color: '#1e293b' }}>Google Search Preview</h2>
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
                        <div style={{ fontSize: '18px', color: '#1a0dab', marginBottom: '4px' }}>{title || 'Page Title'}</div>
                        <div style={{ fontSize: '13px', color: '#006621', marginBottom: '4px' }}>https://aapnaestore.com</div>
                        <div style={{ fontSize: '13px', color: '#4d5156' }}>{description || 'Meta description will appear here'}</div>
                    </div>
                </div>

                {/* SEO */}
                <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <h2 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px', color: '#1e293b', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>Search Engine Optimization (SEO)</h2>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Page Title *</label>
                        <input value={title} onChange={e => setTitle(e.target.value.slice(0,60))}
                            style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                        <div style={{ fontSize: '11px', textAlign: 'right', color: title.length > 55 ? '#ef4444' : '#94a3b8', marginTop: '4px' }}>{title.length}/60</div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Meta Description *</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value.slice(0,160))}
                            style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', resize: 'vertical', minHeight: '80px', boxSizing: 'border-box' }} />
                        <div style={{ fontSize: '11px', textAlign: 'right', color: description.length > 150 ? '#ef4444' : '#94a3b8', marginTop: '4px' }}>{description.length}/160</div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Keywords</label>
                        <input value={keywords} onChange={e => setKeywords(e.target.value)}
                            style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Comma separated — e.g. online store builder india, create estore</div>
                    </div>
                </div>

                {/* SMO */}
                <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <h2 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px', color: '#1e293b', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>Social Media Optimization (SMO)</h2>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Social Media Description</label>
                        <textarea value={ogDescription} onChange={e => setOgDescription(e.target.value.slice(0,200))}
                            style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', resize: 'vertical', minHeight: '80px', boxSizing: 'border-box' }} />
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Shown when link shared on WhatsApp, Facebook, Twitter</div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>OG Image URL</label>
                        <input value={ogImage} onChange={e => setOgImage(e.target.value)}
                            style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Image shown in WhatsApp/Facebook preview (1200x630px)</div>
                        {ogImage && <img src={ogImage} alt="Preview" style={{ marginTop: '8px', maxWidth: '300px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />}
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Site Name</label>
                        <input value={siteName} onChange={e => setSiteName(e.target.value)}
                            style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
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
