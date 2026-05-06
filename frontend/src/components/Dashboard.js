import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';

function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const cards = [
    { title: 'Usuarios', description: 'Gestionar usuarios del sistema', path: '/users', roles: ['Admin', 'Gerente'] },
    { title: 'Roles', description: 'Administrar roles y permisos', path: '/roles', roles: ['Admin'] },
    { title: 'Productos', description: 'Gestionar inventario', path: '/products', roles: ['Admin', 'Gerente', 'Empleado', 'Auditor'] },
  ];

  const allowedCards = cards.filter(card => card.roles.some(role => user.roles?.includes(role)));

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Bienvenido, {user.nombre_completo}</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {allowedCards.map((card) => (
            <div
              key={card.title}
              onClick={() => navigate(card.path)}
              className="bg-white p-6 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition"
            >
              <h2 className="text-xl font-semibold mb-2">{card.title}</h2>
              <p className="text-gray-600">{card.description}</p>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}

export default Dashboard;