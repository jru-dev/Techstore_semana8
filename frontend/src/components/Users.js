import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Layout from './Layout';

function Users() {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nombre_completo: '',
    tienda_id: 1,
    roles: []
  });

  const token = localStorage.getItem('token');
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      toast.error('Error cargando usuarios');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/users`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Usuario creado');
      setShowModal(false);
      fetchUsers();
      setFormData({ email: '', password: '', nombre_completo: '', tienda_id: 1, roles: [] });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error creando usuario');
    }
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between mb-6">
          <h1 className="text-2xl font-bold">Usuarios</h1>
          <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg">
            + Nuevo Usuario
          </button>
        </div>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">Nombre</th>
                <th className="px-6 py-3 text-left">Email</th>
                <th className="px-6 py-3 text-left">Estado</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t">
                  <td className="px-6 py-4">{user.nombre_completo}</td>
                  <td className="px-6 py-4">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-sm ${user.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {user.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}

export default Users;