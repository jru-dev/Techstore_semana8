import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Layout from './Layout';

function Roles() {
  const [roles, setRoles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ nombre: '', descripcion: '' });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/roles`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Rol creado');
      setShowModal(false);
      fetchRoles();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error creando rol');
    }
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between mb-6">
          <h1 className="text-2xl font-bold">Roles</h1>
          <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg">
            + Nuevo Rol
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((role) => (
            <div key={role.id} className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold">{role.nombre}</h2>
              <p className="text-gray-600">{role.descripcion}</p>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}

export default Roles;