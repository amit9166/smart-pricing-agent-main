import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../04-layout/MainLayout';
import Dashboard from '../05-pages/Dashboard';
import Products from '../05-pages/Products';
import Competitors from '../05-pages/Competitors';
import AgentStatus from '../05-pages/AgentStatus';
import Logs from '../05-pages/Logs';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="competitors" element={<Competitors />} />
        <Route path="pipeline" element={<AgentStatus />} />
        <Route path="logs" element={<Logs />} />
        {/* Wildcard redirects back to dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
