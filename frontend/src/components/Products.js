import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Layout from './Layout';

function Products() {
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    stock: '',
    categoria: '',
    tienda_id: 1,
    es_premium: false
  });

  const token = localStorage.getItem('token');
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(response.data);
    } catch (error) {
      toast.error('Error cargando productos');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/products`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Producto creado');
      setShowModal(false);
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error creando producto');
    }
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between mb-6">
          <h1 className="text-2xl font-bold">Productos</h1>
          <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg">
            + Nuevo Producto
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold">{product.nombre}</h2>
              <p className="text-gray-600 text-sm">{product.descripcion}</p>
              <p className="text-2xl font-bold text-green-600">${product.precio}</p>
              <p className="text-gray-600">Stock: {product.stock}</p>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}

export default Products;