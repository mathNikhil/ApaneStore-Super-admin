import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import API_BASE_URL from '../config/api';

const SeoSettings = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [settings, setSettings] = useState({
        title: '',
        description: '',
        ogDescription: '',
        keywords: '',
        ogImage: '',
        siteUrl: 'https://aapnaestore.com',
        siteName: 'AapnaEstore'
    });

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) { navigate('/login'); return; }
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/seo-settings`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
            });
            const data = await res.json();
            if (data.success && data.data) {
                setSettings({
                    title: data.data.title || '',
                    description: data.data.description || '',
                    ogDescription: data.data.ogDescription || '',
                    keywords: data.data.keywords || '',
                    ogImage: data.data.ogImage || '',
                    siteUrl: data.data.siteUrl || 'https://aapnaestore.com',
                    siteName: data.data.siteName || 'AapnaEstore'
                });
            }
        } catch(e) { console.error(e); }
        setLoading(false);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/seo-settings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify(settings)
            });
            const data = await res.json();
            if (data.success) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
        } catch(e) { console.error(e); }
        setSaving(false);
    };

    const styles = {
        container: { display: 'flex', minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, sans-serif' },
        main: { flex: 1, padding: '32px', maxWidth: '800px', marginLeft: '220px' },
        title: { fontSize: '24px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' },
        subtitle: { color: '#64748b', marginBottom: '32px', fontSize: '14px' },
        card: { background: '#fff', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
        sectionTitle: { fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' },
        field: { marginBottom: '16px' },
        label: { display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' },
        hint: { fontSize: '11px', color: '#94a3b8', marginTop: '4px' },
        input: { width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif' },
        textarea: { width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', resize: 'vertical', minHeight: '80px', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif' },
        charCount: { fontSize: '11px', textAlign: 'right', marginTop: '4px' },
        saveBtn: { background: '#2563eb', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
        savedMsg: { color: '#16a34a', fontSize: '14px', marginLeft: '12px', fontWeight: '500' },
        preview: { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', marginTop: '16px' },
        previewTitle: { fontSize: '18px', color: '#1a0dab', fontWeight: '400', marginBottom: '4px' },
        previewUrl: { fontSize: '13px', color: '#006621', marginBottom: '4px' },
        previewDesc: { fontSize: '13px', color: '#4d5156' },
    };

    if (loading) return <div style={styles.container}><Sidebar /><div style={styles.main}>Loading...</div></div>;

    return (
        <div style={styles.container}>
            <Sidebar />
            <div style={styles.main}>
                <h1 style={styles.title}>SEO & SMO Settings</h1>
                <p style={styles.subtitle}>Manage how AapnaEstore appears on Google, WhatsApp and social media.</p>

                {/* Google Preview */}
                <div style={styles.card}>
                    <div style={styles.sectionTitle}>Google Search Preview</div>
                    <div style={styles.preview}>
                        <div style={styles.previewTitle}>{settings.title || 'Page Title'}</div>
                        <div style={styles.previewUrl}>{settings.siteUrl}</div>
                        <div style={styles.previewDesc}>{settings.description || 'Meta description will appear here'}</div>
                    </div>
                </div>

                {/* SEO Fields */}
                <div style={styles.card}>
                    <div style={styles.sectionTitle}>Search Engine Optimization (SEO)</div>

                    <div style={styles.field}>
                        <label style={styles.label}>Page Title <span style={{color:'#ef4444'}}>*</span></label>
                        <input style={styles.input} value={settings.title}
                            onChange={e => setSettings({...settings, title: e.target.value.slice(0,60)})}
                            placeholder="AapnaEstore - Create Your Online Store in Minutes" />
                        <div style={{...styles.charCount, color: settings.title.length > 55 ? '#ef4444' : '#94a3b8'}}>
                            {settings.title.length}/60 characters
                        </div>
                        <div style={styles.hint}>Shown as the title in Google search results</div>
                    </div>

                    <div style={styles.field}>
                        <label style={styles.label}>Meta Description <span style={{color:'#ef4444'}}>*</span></label>
                        <textarea style={styles.textarea} value={settings.description}
                            onChange={e => setSettings({...settings, description: e.target.value.slice(0,160)})}
                            placeholder="AapnaEstore helps Indian businesses launch their own online store..." />
                        <div style={{...styles.charCount, color: settings.description.length > 150 ? '#ef4444' : '#94a3b8'}}>
                            {settings.description.length}/160 characters
                        </div>
                        <div style={styles.hint}>Shown as description in Google search results</div>
                    </div>

                    <div style={styles.field}>
                        <label style={styles.label}>Keywords</label>
                        <input style={styles.input} value={settings.keywords}
                            onChange={e => setSettings({...settings, keywords: e.target.value})}
                            placeholder="online store builder india, create estore, whatsapp ordering" />
                        <div style={styles.hint}>Comma separated keywords for Google</div>
                    </div>
                </div>

                {/* SMO Fields */}
                <div style={styles.card}>
                    <div style={styles.sectionTitle}>Social Media Optimization (SMO)</div>

                    <div style={styles.field}>
                        <label style={styles.label}>Social Media Description</label>
                        <textarea style={styles.textarea} value={settings.ogDescription}
                            onChange={e => setSettings({...settings, ogDescription: e.target.value.slice(0,200)})}
                            placeholder="Launch your own branded online store with WhatsApp ordering..." />
                        <div style={styles.hint}>Shown when link is shared on WhatsApp, Facebook, Twitter</div>
                    </div>

                    <div style={styles.field}>
                        <label style={styles.label}>OG Image URL</label>
                        <input style={styles.input} value={settings.ogImage}
                            onChange={e => setSettings({...settings, ogImage: e.target.value})}
                            placeholder="https://aapnaestore.com/og-banner.png" />
                        <div style={styles.hint}>Image shown in WhatsApp/Facebook preview (1200x630px recommended)</div>
                        {settings.ogImage && <img src={settings.ogImage} alt="OG Preview" style={{marginTop:'8px', maxWidth:'300px', borderRadius:'8px', border:'1px solid #e2e8f0'}} />}
                    </div>

                    <div style={styles.field}>
                        <label style={styles.label}>Site Name</label>
                        <input style={styles.input} value={settings.siteName}
                            onChange={e => setSettings({...settings, siteName: e.target.value})}
                            placeholder="AapnaEstore" />
                    </div>
                </div>

                <div style={{display:'flex', alignItems:'center'}}>
                    <button style={styles.saveBtn} onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                    {saved && <span style={styles.savedMsg}>✓ Settings saved successfully</span>}
                </div>
            </div>
        </div>
    );
};

export default SeoSettings;
