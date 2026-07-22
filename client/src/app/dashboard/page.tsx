'use client';

import { useAuth } from '../../hooks/useAuth';

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return <div style={{ color: 'white', padding: '2rem' }}>Loading...</div>;
  }

  if (!user) {
    return <div style={{ color: 'white', padding: '2rem' }}>Please log in to view this page.</div>;
  }

  return (
    <div style={{ padding: '3rem', fontFamily: 'Inter, sans-serif', color: 'white', background: '#1e1e2f', minHeight: '100vh' }}>
      <h1>Welcome, {user.name}</h1>
      <p>Role: {user.role}</p>
      <p>Email: {user.email}</p>
      
      <button 
        onClick={logout}
        style={{ 
          marginTop: '2rem', 
          padding: '0.8rem 1.5rem', 
          background: '#ef4444', 
          color: 'white', 
          border: 'none', 
          borderRadius: '8px', 
          cursor: 'pointer' 
        }}
      >
        Logout
      </button>
    </div>
  );
}
