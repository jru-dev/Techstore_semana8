const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth.middleware');
const productController = require('../controllers/product.controller');

// Middleware de autenticación para todas las rutas
router.use(verifyToken);

// Rutas de productos
router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);
router.post('/', productController.createProduct);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

module.exports = router;
