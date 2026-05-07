import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Layout from './Layout';

function Roles() {
  const [roles, setRoles] = useState([]);

  const token = localStorage.getItem('token');
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/roles`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRoles(response.data);
    } catch (error) {
      toast.error('Error cargando roles');
    }
  };

  const roleCapabilities = {
    'Admin': ['Acceso total', 'Gestión de Usuarios', 'Control MFA', 'Gestión de Productos (Todas las tiendas)'],
    'Gerente': ['Ver productos (Su tienda)', 'Crear productos', 'Modificar productos', 'Eliminar (No premium)'],
    'Empleado': ['Ver productos (Su tienda)', 'Crear productos (No premium)', 'Actualizar stock'],
    'Auditor': ['Lectura global de productos', 'Acceso denegado a modificaciones']
  };

  const roleColors = {
    'Admin': 'from-rose-500 to-red-600 shadow-red-500/30',
    'Gerente': 'from-blue-500 to-indigo-600 shadow-indigo-500/30',
    'Empleado': 'from-emerald-400 to-green-600 shadow-green-500/30',
    'Auditor': 'from-slate-500 to-gray-600 shadow-gray-500/30'
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between mb-8 items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Roles del Sistema</h1>
            <p className="text-gray-500 mt-2 text-sm">Visualiza los niveles de acceso y permisos de cada rol (ABAC/RBAC).</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          {roles.map((role) => {
            const capabilities = roleCapabilities[role.nombre] || ['Permisos básicos'];
            const colorClass = roleColors[role.nombre] || 'from-gray-400 to-gray-500 shadow-gray-400/30';
            
            return (
              <div key={role.id} className="bg-white rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 p-6 transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden flex flex-col h-full">
                <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${colorClass}`}></div>
                <div className="flex-grow">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">{role.nombre}</h2>
                  <p className="text-gray-500 text-sm mb-6 pb-4 border-b border-gray-50">{role.descripcion}</p>
                  
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Capacidades permitidas</h3>
                    {capabilities.map((cap, idx) => (
                      <div key={idx} className="flex items-start">
                        <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        <span className="text-sm text-gray-600">{cap}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-8 pt-4 border-t border-gray-50">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r text-white shadow-sm ${colorClass}`}>
                    Rol del Sistema
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}

export default Roles;