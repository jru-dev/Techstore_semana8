const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { checkRole } = require('../middlewares/rbac.middleware');

// Registro
router.post('/register', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('nombre_completo').notEmpty()
], authController.register);

// Login
router.post('/login', authController.login);

// Verificar MFA
router.post('/verify-mfa', authController.verifyMFA);

// Enviar código MFA por email
router.post('/send-mfa-code', authController.sendMFACode);

// Configurar MFA (requiere autenticación)
router.post('/setup-mfa', verifyToken, authController.setupMFA);
router.post('/confirm-mfa', verifyToken, authController.confirmMFA);

// Estado de MFA Global
router.get('/mfa-status', authController.getMfaStatus);
router.post('/toggle-mfa', verifyToken, checkRole('Admin'), authController.toggleMfa);

module.exports = router;