import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Apartments from './pages/Apartments';
import Payments from './pages/Payments';
import Expenses from './pages/Expenses';
import UserManagement from './pages/UserManagement';
import Settings from './pages/Settings';
import Login from './pages/Login';
import InitAdmin from './pages/InitAdmin';
import ProtectedRoute from './components/ProtectedRoute';

import { UIProvider } from './context/UIContext';
import { DataProvider } from './context/DataContext';

function App() {
  return (
    <AuthProvider>
      <UIProvider>
        <DataProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/init-admin" element={<InitAdmin />} />
              <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="apartments" element={<Apartments />} />
                <Route path="payments" element={<Payments />} />
                <Route path="expenses" element={<Expenses />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="settings" element={<Settings />} />
              </Route>
              {/* Redirect any other path to Dashboard */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </DataProvider>
      </UIProvider>
    </AuthProvider>
  );
}

export default App;
