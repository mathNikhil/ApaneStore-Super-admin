import API_BASE_URL from '../config/api';

const getToken = () => localStorage.getItem('adminToken');

const apiRequest = async (endpoint, method = 'GET', data = null) => {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const token = getToken();
    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || 'Something went wrong');
        }
        return result;
    } catch (error) {
        console.error('Admin API Error:', error);
        throw error;
    }
};

// Admin Auth
export const adminAuthAPI = {
    login: (data) => apiRequest('/api/admin/login', 'POST', data),
    logout: () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        return apiRequest('/api/admin/logout', 'POST');
    },
};

// Admin Tenants
export const adminTenantAPI = {
    getAll: () => apiRequest('/api/admin/tenants'),
    getById: (id) => apiRequest(`/api/admin/tenants/${id}`),
    toggleStatus: (id, action) => apiRequest(`/api/admin/tenants/${id}/toggle`, 'PUT', { action }),
    delete: (id) => apiRequest(`/api/admin/tenants/${id}`, 'DELETE'),
};

// Admin Stores
export const adminStoreAPI = {
    getAll: () => apiRequest('/api/admin/stores'),
    getById: (id) => apiRequest(`/api/admin/stores/${id}`),
    delete: (id) => apiRequest(`/api/admin/stores/${id}`, 'DELETE'),
};

// Admin Panels
export const adminPanelAPI = {
    getStorePanels: (storeId) => apiRequest(`/api/admin/stores/${storeId}/panels`),
    updateStorePanels: (storeId, panels) => apiRequest(`/api/admin/stores/${storeId}/panels`, 'PUT', { panels }),
    togglePanel: (storeId, panelType, is_enabled) => 
        apiRequest(`/api/admin/stores/${storeId}/panels/${panelType}/toggle`, 'PUT', { is_enabled }),
};

// Admin Pricing Plans (publish flow — domain + hosting + payment)
export const adminPricingAPI = {
    getAll: () => apiRequest('/api/admin/pricing-plans'),
    update: (id, data) => apiRequest(`/api/admin/pricing-plans/${id}`, 'PUT', data),
};

export const adminTermsAPI = {
    getAcceptances: () => apiRequest('/api/admin/terms-acceptances'),
};
