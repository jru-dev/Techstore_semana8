import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';

function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const cards = [
    { title: 'Usuarios', description: 'Gestionar usuarios del sistema', path: '/users', roles: ['Admin'] },
    { title: 'Roles', description: 'Administrar roles y permisos', path: '/roles', roles: ['Admin'] },
    { title: 'Productos', description: 'Gestionar inventario', path: '/products', roles: ['Admin', 'Gerente', 'Empleado', 'Auditor'] },
  ];

  const allowedCards = cards.filter(card => card.roles.some(role => user.roles?.includes(role)));

  return (
    <Layout>
      <div className="p-8">
        <h1 className="text-3xl font-bold text-gray-800 tracking-tight mb-8">Bienvenido, {user.nombre_completo}</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {allowedCards.map((card) => (
            <div
              key={card.title}
              onClick={() => navigate(card.path)}
              className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden group"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">{card.title}</h2>
              <p className="text-gray-500">{card.description}</p>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}

export default Dashboard;