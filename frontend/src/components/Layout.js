import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';

function Layout({ children }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');
  const [mfaEnabled, setMfaEnabled] = useState(true);
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
  const isAdmin = user.roles?.includes('Admin');

  useEffect(() => {
    const checkMfaStatus = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/auth/mfa-status`);
        setMfaEnabled(response.data.globalMfaEnabled);
      } catch (error) {
        console.error('Error fetching MFA status', error);
      }
    };
    checkMfaStatus();
  }, [API_URL]);

  const handleToggleMfa = async () => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/toggle-mfa`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMfaEnabled(response.data.globalMfaEnabled);
      toast.success(response.data.message);
    } catch (error) {
      toast.error('Error al cambiar el estado del MFA');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    toast.success('Sesión cerrada');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-800 selection:bg-indigo-100 selection:text-indigo-900">
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex space-x-8 items-center">
              <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tighter">
                TechStore
              </span>
              <div className="flex space-x-2">
                <button onClick={() => navigate('/')} className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-lg hover:bg-indigo-50 transition-colors font-medium text-sm">Dashboard</button>
                <button onClick={() => navigate('/products')} className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-lg hover:bg-indigo-50 transition-colors font-medium text-sm">Productos</button>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              {isAdmin && (
                <div className="flex items-center space-x-3 bg-gray-50 px-4 py-1.5 rounded-full border border-gray-100">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">MFA Global:</span>
                  <button 
                    onClick={handleToggleMfa}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${mfaEnabled ? 'bg-indigo-500' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${mfaEnabled ? 'translate-x-6' : 'translate-x-1'} shadow-sm`} />
                  </button>
                </div>
              )}
              <button onClick={handleLogout} className="bg-red-50 hover:bg-red-100 text-red-600 font-medium px-4 py-2 rounded-xl transition-colors text-sm border border-red-100">
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}

export default Layout;