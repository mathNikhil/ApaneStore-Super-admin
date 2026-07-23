const API_BASE_URL = 'http://localhost:5002';

export const API_URLS = {
    // Admin Auth
    adminLogin: `${API_BASE_URL}/api/admin/login`,
    adminLogout: `${API_BASE_URL}/api/admin/logout`,
    
    // Admin Tenants
    adminTenants: `${API_BASE_URL}/api/admin/tenants`,
    adminTenant: (id) => `${API_BASE_URL}/api/admin/tenants/${id}`,
    adminTenantToggle: (id) => `${API_BASE_URL}/api/admin/tenants/${id}/toggle`,
    
    // Admin Stores
    adminStores: `${API_BASE_URL}/api/admin/stores`,
    adminStore: (id) => `${API_BASE_URL}/api/admin/stores/${id}`,
    
    // Admin Panels
    adminStorePanels: (storeId) => `${API_BASE_URL}/api/admin/stores/${storeId}/panels`,
    adminStorePanelToggle: (storeId, panelType) => `${API_BASE_URL}/api/admin/stores/${storeId}/panels/${panelType}/toggle`,
};

export default API_BASE_URL;
