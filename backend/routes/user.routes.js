const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth.middleware');
const { checkRole } = require('../middlewares/rbac.middleware');
const userController = require('../controllers/user.controller');

// Todas las rutas requieren autenticación
router.use(verifyToken);

// GET - Todos pueden ver usuarios? (según requerimientos: Admin + Gerente)
router.get('/', checkRole('Admin', 'Gerente'), userController.getUsers);
router.get('/:id', checkRole('Admin', 'Gerente'), userController.getUserById);

// POST - Solo Admin puede crear usuarios
router.post('/', checkRole('Admin'), userController.createUser);

// PUT - Solo Admin puede actualizar
router.put('/:id', checkRole('Admin'), userController.updateUser);

// DELETE - Solo Admin puede eliminar
router.delete('/:id', checkRole('Admin'), userController.deleteUser);

module.exports = router;