const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth.middleware');
const { abacMiddleware } = require('../utils/policy-engine');
const productController = require('../controllers/product.controller');

// Middleware de autenticación para todas las rutas
router.use(verifyToken);

// Rutas de productos con ABAC aplicado por operación
router.get('/', abacMiddleware('SELECT'), productController.getProducts);
router.get('/:id', abacMiddleware('SELECT'), productController.getProductById);
router.post('/', abacMiddleware('INSERT'), productController.createProduct);
router.put('/:id', abacMiddleware('UPDATE'), productController.updateProduct);
router.delete('/:id', abacMiddleware('DELETE'), productController.deleteProduct);

module.exports = router;