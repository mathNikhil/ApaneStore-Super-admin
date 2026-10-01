import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
            navigate('/login');
        }
    };

    const isActive = (path) => location.pathname === path;

    const navItems = [
        { path: '/dashboard', icon: '⊞', label: 'Dashboard' },
        { path: '/tenants', icon: '👤', label: 'Tenants' },
        { path: '/stores', icon: '🏪', label: 'Stores' },
        { path: '/whatsapp-market', icon: '💬', label: 'WhatsApp Market' },
        { path: '/pricing-plans', icon: '📋', label: 'Pricing Plans' },
        { path: '/payment-gateway', icon: '🔐', label: 'Payment Gateway' },
        { path: '/terms-acceptances', icon: '📄', label: 'Terms Acceptances' },
        { path: '/revenue', icon: '📈', label: 'Revenue' },
        { path: '/billing-settings', icon: '🧾', label: 'Billing Settings' },
    ];

    return (
        <div style={styles.sidebar}>
            {/* Logo */}
            <div style={styles.logoArea}>
                <div style={styles.logoBox}>
                    <div style={styles.logoIcon}>A</div>
                    <div>
                        <div style={styles.logoText}>Apna<span style={{color:'#4ade80'}}>eStore</span></div>
                        <div style={styles.logoSub}>SUPER ADMIN</div>
                    </div>
                </div>
            </div>

            {/* Nav */}
            <nav style={styles.nav}>
                {navItems.map(item => (
                    <Link
                        key={item.path}
                        to={item.path}
                        style={{
                            ...styles.navLink,
                            ...(isActive(item.path) ? styles.navLinkActive : {}),
                        }}
                    >
                        <span style={styles.navIcon}>{item.icon}</span>
                        <span>{item.label}</span>
                        {item.badge && (
                            <span style={styles.badge}>{item.badge}</span>
                        )}
                    </Link>
                ))}
            </nav>

            {/* Bottom */}
            <div style={styles.bottom}>
                <div style={styles.clusterStatus}>
                    <span style={styles.greenDot} />
                    <span style={styles.clusterLabel}>Cloud Cluster</span>
                    <span style={styles.stableTag}>Stable</span>
                </div>
                <button onClick={handleLogout} style={styles.logoutBtn}>
                    <span>↪</span>
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
};

const styles = {
    sidebar: {
        width: '240px',
        background: '#0f1117',
        color: '#fff',
        padding: '0',
        position: 'fixed',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid rgba(255,255,255,0.06)',
    },
    logoArea: {
        padding: '20px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
    },
    logoBox: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
    },
    logoIcon: {
        width: '36px',
        height: '36px',
        background: '#006d2f',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px',
        fontWeight: '800',
        color: '#fff',
    },
    logoText: {
        fontSize: '16px',
        fontWeight: '700',
        color: '#fff',
        lineHeight: 1.2,
    },
    logoSub: {
        fontSize: '9px',
        color: '#6b7280',
        letterSpacing: '1.5px',
        marginTop: '2px',
    },
    nav: {
        flex: 1,
        padding: '12px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        overflowY: 'auto',
    },
    navLink: {
        color: '#9ca3af',
        textDecoration: 'none',
        padding: '10px 12px',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '13.5px',
        fontWeight: '500',
        transition: 'all 0.2s',
    },
    navLinkActive: {
        background: '#006d2f',
        color: '#fff',
    },
    navIcon: {
        fontSize: '16px',
        width: '20px',
        textAlign: 'center',
        flexShrink: 0,
    },
    badge: {
        marginLeft: 'auto',
        background: '#006d2f',
        color: '#fff',
        fontSize: '10px',
        fontWeight: '700',
        padding: '2px 6px',
        borderRadius: '10px',
    },
    bottom: {
        padding: '12px 8px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
    },
    clusterStatus: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        borderRadius: '8px',
        background: 'rgba(255,255,255,0.03)',
    },
    greenDot: {
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: '#4ade80',
        flexShrink: 0,
    },
    clusterLabel: {
        fontSize: '12px',
        color: '#9ca3af',
        flex: 1,
    },
    stableTag: {
        fontSize: '11px',
        color: '#4ade80',
        fontWeight: '600',
    },
    logoutBtn: {
        padding: '10px 12px',
        background: 'rgba(239,68,68,0.1)',
        color: '#ef4444',
        border: '1px solid rgba(239,68,68,0.15)',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '13.5px',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        width: '100%',
        transition: 'all 0.2s',
    },
};

export default Sidebar;
