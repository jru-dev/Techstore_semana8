const pool = require('../config/database');

// Políticas ABAC
const policies = {
    canSelect: async (user, product) => {
        if (user.roles.includes('Admin')) return true;
        if (user.roles.includes('Auditor')) return true;
        // Si no hay producto específico (listado general), dejar pasar — el controller filtra
        if (!product) return true;
        if (user.roles.includes('Gerente') || user.roles.includes('Empleado')) {
            return product.tienda_id === user.tiendaId;
        }
        return false;
    },

    canInsert: async (user, productData) => {
        if (user.roles.includes('Admin')) return true;
        // Auditor no puede insertar
        if (user.roles.includes('Auditor')) return false;
        if (user.roles.includes('Gerente')) {
            return parseInt(productData.tienda_id) === parseInt(user.tiendaId);
        }
        if (user.roles.includes('Empleado')) {
            const enSuTienda = parseInt(productData.tienda_id) === parseInt(user.tiendaId);
            const noEsPremium = !productData.es_premium;
            return enSuTienda && noEsPremium;
        }
        return false;
    },

    canUpdate: async (user, product, updates) => {
        if (user.roles.includes('Admin')) return true;
        // Auditor no puede actualizar
        if (user.roles.includes('Auditor')) return false;
        if (user.roles.includes('Gerente')) {
            if (parseInt(product.tienda_id) !== parseInt(user.tiendaId)) return false;
            // Gerente no puede cambiar la categoría
            if (updates.categoria !== undefined && updates.categoria !== product.categoria) {
                return false;
            }
            return true;
        }
        if (user.roles.includes('Empleado')) {
            if (parseInt(product.tienda_id) !== parseInt(user.tiendaId)) return false;
            // Empleado solo puede actualizar stock
            const soloStock = Object.keys(updates).every(k => k === 'stock');
            return soloStock && updates.stock !== undefined;
        }
        return false;
    },

    canDelete: async (user, product) => {
        if (user.roles.includes('Admin')) return true;
        // Auditor y Empleado no pueden eliminar
        if (user.roles.includes('Auditor') || user.roles.includes('Empleado')) return false;
        if (user.roles.includes('Gerente')) {
            return parseInt(product.tienda_id) === parseInt(user.tiendaId) && !product.es_premium;
        }
        return false;
    }
};

// Función para verificar permisos
const checkPermission = async (action, user, resource, resourceData = null, additionalData = null) => {
    try {
        let hasPermission = false;

        switch (action) {
            case 'SELECT':
                hasPermission = await policies.canSelect(user, resourceData);
                break;
            case 'INSERT':
                hasPermission = await policies.canInsert(user, additionalData || resourceData);
                break;
            case 'UPDATE':
                hasPermission = await policies.canUpdate(user, resourceData, additionalData);
                break;
            case 'DELETE':
                hasPermission = await policies.canDelete(user, resourceData);
                break;
            default:
                hasPermission = false;
        }

        return {
            allowed: hasPermission,
            message: hasPermission ? 'Permiso concedido' : 'No tienes permisos para esta acción'
        };
    } catch (error) {
        console.error('Error en policy engine:', error);
        return { allowed: false, message: 'Error verificando permisos' };
    }
};

// Middleware ABAC para productos
const abacMiddleware = (action) => {
    return async (req, res, next) => {
        try {
            const user = {
                userId: req.userId,
                roles: req.userRoles || [],
                tiendaId: req.tiendaId
            };

            let resourceData = null;
            let additionalData = null;

            // Cargar el producto existente para UPDATE, DELETE y SELECT por ID
            if (['SELECT', 'UPDATE', 'DELETE'].includes(action)) {
                const productId = req.params.id;
                if (productId) {
                    const result = await pool.query(
                        'SELECT * FROM productos WHERE id = $1',
                        [productId]
                    );
                    if (result.rows.length > 0) {
                        resourceData = result.rows[0];
                    } else {
                        return res.status(404).json({ message: 'Producto no encontrado' });
                    }
                }
                // Si no hay id (listado GET /), resourceData queda null — canSelect lo permite
            }

            if (action === 'INSERT') {
                additionalData = req.body;
            }

            if (action === 'UPDATE') {
                additionalData = req.body;
            }

            const permission = await checkPermission(action, user, 'producto', resourceData, additionalData);

            if (!permission.allowed) {
                return res.status(403).json({
                    message: permission.message,
                    action: action,
                    user: { roles: user.roles, tiendaId: user.tiendaId }
                });
            }

            // Pasar el producto cargado al controller para no volver a consultarlo
            req.resourceData = resourceData;
            next();
        } catch (error) {
            console.error('Error en ABAC middleware:', error);
            res.status(500).json({ message: 'Error verificando permisos ABAC' });
        }
    };
};

module.exports = { checkPermission, abacMiddleware };