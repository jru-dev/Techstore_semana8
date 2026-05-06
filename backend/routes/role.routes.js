const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth.middleware');
const { checkRole } = require('../middlewares/rbac.middleware');
const roleController = require('../controllers/role.controller');

// Todas las rutas requieren autenticación
router.use(verifyToken);

// GET - Todos pueden ver roles (según requerimientos)
router.get('/', roleController.getRoles);
router.get('/:id', roleController.getRoleById);

// POST - Solo Admin puede crear roles
router.post('/', checkRole('Admin'), roleController.createRole);

// PUT - Solo Admin puede actualizar
router.put('/:id', checkRole('Admin'), roleController.updateRole);

// DELETE - Solo Admin puede eliminar
router.delete('/:id', checkRole('Admin'), roleController.deleteRole);

// Asignación de roles (solo Admin)
router.post('/assign', checkRole('Admin'), roleController.assignRoleToUser);
router.post('/remove', checkRole('Admin'), roleController.removeRoleFromUser);

module.exports = router;