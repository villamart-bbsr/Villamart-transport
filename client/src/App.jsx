import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import UserLogin from './components/UserLogin';
import AdminLogin from './components/AdminLogin';
import UserForm from './components/UserForm';
import AdminDashboard from './components/AdminDashboard';

const ProtectedRoute = ({ children, requiredType }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/" />;
  }
  
  if (requiredType && user.type !== requiredType) {
    return <Navigate to="/" />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-100">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route 
              path="/user-form" 
              element={
                <ProtectedRoute requiredType="user">
                  <UserForm />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin-dashboard" 
              element={
                <ProtectedRoute requiredType="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

const HomePage = () => {
  const { user } = useAuth();
  
  if (user?.type === 'user') {
    return <Navigate to="/user-form" />;
  }
  
  if (user?.type === 'admin') {
    return <Navigate to="/admin-dashboard" />;
  }
  
  return <UserLogin />;
};

export default App;
