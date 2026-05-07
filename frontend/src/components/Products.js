import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Layout from './Layout';

function Products() {
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentProductId, setCurrentProductId] = useState(null);
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

  const isAdmin = user.roles?.includes('Admin');
  const isGerente = user.roles?.includes('Gerente');
  const isEmpleado = user.roles?.includes('Empleado');
  const isAuditor = user.roles?.includes('Auditor');

  const canCreate = isAdmin || isGerente || isEmpleado;
  const canEdit = isAdmin || isGerente || isEmpleado;
  const canDelete = isAdmin || isGerente;

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    stock: '',
    categoria: '',
    tienda_id: user.tienda_id || 1,
    es_premium: false
  });

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
      if (editMode) {
        let dataToUpdate = formData;
        // Empleado solo puede modificar el stock
        if (isEmpleado && !isAdmin && !isGerente) {
          dataToUpdate = { stock: parseInt(formData.stock) };
        } else {
          // Asegurar tipos correctos
          dataToUpdate.stock = parseInt(formData.stock);
          dataToUpdate.precio = parseFloat(formData.precio);
          dataToUpdate.tienda_id = parseInt(formData.tienda_id);
        }

        await axios.put(`${API_URL}/api/products/${currentProductId}`, dataToUpdate, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Producto actualizado exitosamente');
      } else {
        await axios.post(`${API_URL}/api/products`, {
          ...formData,
          stock: parseInt(formData.stock),
          precio: parseFloat(formData.precio),
          tienda_id: parseInt(formData.tienda_id)
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Producto creado exitosamente');
      }
      setShowModal(false);
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || `Error ${editMode ? 'actualizando' : 'creando'} producto`);
    }
  };

  const openCreateModal = () => {
    setEditMode(false);
    setCurrentProductId(null);
    setFormData({
      nombre: '',
      descripcion: '',
      precio: '',
      stock: '',
      categoria: '',
      tienda_id: user.tienda_id || 1,
      es_premium: false
    });
    setShowModal(true);
  };

  const handleEdit = (product) => {
    setEditMode(true);
    setCurrentProductId(product.id);
    setFormData({
      nombre: product.nombre,
      descripcion: product.descripcion,
      precio: product.precio,
      stock: product.stock,
      categoria: product.categoria,
      tienda_id: product.tienda_id,
      es_premium: product.es_premium
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      try {
        await axios.delete(`${API_URL}/api/products/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Producto eliminado exitosamente');
        fetchProducts();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Error eliminando producto');
      }
    }
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between mb-8 items-center">
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Productos</h1>
          {canCreate && (
            <button onClick={openCreateModal} className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2.5 rounded-xl shadow-lg hover:shadow-indigo-500/30 transition-all">
              + Nuevo Producto
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 p-6 transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden">
              {product.es_premium && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg shadow-sm">
                  PREMIUM
                </div>
              )}
              <h2 className="text-xl font-bold text-gray-800 mb-2">{product.nombre}</h2>
              <p className="text-gray-500 text-sm mb-4 line-clamp-2">{product.descripcion}</p>
              <div className="flex justify-between items-end mt-4 pt-4 border-t border-gray-50">
                <div>
                  <p className="text-xs text-gray-400 uppercase font-semibold">Precio</p>
                  <p className="text-2xl font-black text-indigo-600">${product.precio}</p>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                  <span className={`px-2 py-1 rounded-md text-sm font-medium ${product.stock > 10 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {product.stock} unds
                  </span>
                  <div className="flex gap-3">
                    {canEdit && (
                      <button 
                        onClick={() => handleEdit(product)}
                        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium transition-colors"
                      >
                        Editar
                      </button>
                    )}
                    {canDelete && (
                      <button 
                        onClick={() => handleDelete(product.id)}
                        className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">{editMode ? 'Editar Producto' : 'Nuevo Producto'}</h2>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nombre</label>
                    <input type="text" required value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} disabled={isEmpleado && !isAdmin && !isGerente} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 disabled:bg-gray-100 disabled:text-gray-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Descripción</label>
                    <textarea value={formData.descripcion} onChange={(e) => setFormData({...formData, descripcion: e.target.value})} disabled={isEmpleado && !isAdmin && !isGerente} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 disabled:bg-gray-100 disabled:text-gray-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Precio</label>
                      <input type="number" step="0.01" required value={formData.precio} onChange={(e) => setFormData({...formData, precio: e.target.value})} disabled={isEmpleado && !isAdmin && !isGerente} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 disabled:bg-gray-100 disabled:text-gray-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Stock</label>
                      <input type="number" value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Categoría</label>
                    <input type="text" value={formData.categoria} onChange={(e) => setFormData({...formData, categoria: e.target.value})} disabled={isEmpleado && !isAdmin && !isGerente} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 disabled:bg-gray-100 disabled:text-gray-500" />
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" id="es_premium" checked={formData.es_premium} onChange={(e) => setFormData({...formData, es_premium: e.target.checked})} disabled={isEmpleado && !isAdmin && !isGerente} className="h-4 w-4 text-indigo-600 border-gray-300 rounded disabled:opacity-50" />
                    <label htmlFor="es_premium" className="ml-2 block text-sm text-gray-900">Producto Premium</label>
                  </div>
                </div>
                <div className="mt-8 flex justify-end space-x-3">
                  <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium">Cancelar</button>
                  <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-500/20 transition-all">Guardar</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Products;