import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Users from './components/Users';
import Roles from './components/Roles';
import Products from './components/Products';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/users" element={<PrivateRoute><Users /></PrivateRoute>} />
        <Route path="/roles" element={<PrivateRoute><Roles /></PrivateRoute>} />
        <Route path="/products" element={<PrivateRoute><Products /></PrivateRoute>} />
      </Routes>
    </Router>
  );
}

export default App;