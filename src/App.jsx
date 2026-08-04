import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tenants from './pages/Tenants';
import TenantDetail from './pages/TenantDetail';
import Stores from './pages/Stores';
import StoreDetail from './pages/StoreDetail';
import PricingPlans from './pages/PricingPlans';
import TermsAcceptances from './pages/TermsAcceptances';

const App = () => {
    const isAuthenticated = !!localStorage.getItem('adminToken');

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route 
                    path="/dashboard" 
                    element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} 
                />
                <Route 
                    path="/tenants" 
                    element={isAuthenticated ? <Tenants /> : <Navigate to="/login" />} 
                />
                <Route 
                    path="/tenants/:id" 
                    element={isAuthenticated ? <TenantDetail /> : <Navigate to="/login" />} 
                />
                <Route 
                    path="/stores" 
                    element={isAuthenticated ? <Stores /> : <Navigate to="/login" />} 
                />
                <Route 
                    path="/stores/:id" 
                    element={isAuthenticated ? <StoreDetail /> : <Navigate to="/login" />} 
                />
                <Route 
                    path="/pricing-plans" 
                    element={isAuthenticated ? <PricingPlans /> : <Navigate to="/login" />} 
                />
                <Route 
                    path="/terms-acceptances" 
                    element={isAuthenticated ? <TermsAcceptances /> : <Navigate to="/login" />} 
                />
                <Route path="*" element={<Navigate to="/dashboard" />} />
            </Routes>
        </BrowserRouter>
    );
};

export default App;
