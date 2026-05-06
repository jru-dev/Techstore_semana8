import React from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

function Layout({ children }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.clear();
    toast.success('Sesión cerrada');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16 items-center">
            <div className="flex space-x-4">
              <button onClick={() => navigate('/')} className="text-gray-700">Dashboard</button>
              <button onClick={() => navigate('/products')} className="text-gray-700">Productos</button>
            </div>
            <button onClick={handleLogout} className="bg-red-600 text-white px-4 py-2 rounded-lg">
              Cerrar Sesión
            </button>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}

export default Layout;