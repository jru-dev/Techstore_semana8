const pool = require('../config/database');

// Políticas ABAC
const policies = {
    canSelect: async (user, product) => {
        if (user.roles.includes('Admin')) return true;
        if (user.roles.includes('Auditor')) return true;
        if (user.roles.includes('Gerente') || user.roles.includes('Empleado')) {
            return product && product.tienda_id === user.tiendaId;
        }
        return false;
    },
    
    canInsert: async (user, productData) => {
        if (user.roles.includes('Admin')) return true;
        if (user.roles.includes('Gerente')) {
            return productData.tienda_id === user.tiendaId;
        }
        if (user.roles.includes('Empleado')) {
            return productData.tienda_id === user.tiendaId && !productData.es_premium;
        }
        return false;
    },
    
    canUpdate: async (user, product, updates) => {
        if (user.roles.includes('Admin')) return true;
        if (user.roles.includes('Gerente')) {
            if (product.tienda_id !== user.tiendaId) return false;
            if (updates.categoria && updates.categoria !== product.categoria) {
                return false;
            }
            return true;
        }
        if (user.roles.includes('Empleado')) {
            if (product.tienda_id !== user.tiendaId) return false;
            const allowedUpdates = Object.keys(updates).length === 1 && updates.stock !== undefined;
            return allowedUpdates;
        }
        return false;
    },
    
    canDelete: async (user, product) => {
        if (user.roles.includes('Admin')) return true;
        if (user.roles.includes('Gerente')) {
            return product.tienda_id === user.tiendaId && !product.es_premium;
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
            
            if (action === 'SELECT' || action === 'UPDATE' || action === 'DELETE') {
                const productId = req.params.id;
                if (productId) {
                    const result = await pool.query(
                        'SELECT * FROM productos WHERE id = $1',
                        [productId]
                    );
                    if (result.rows.length > 0) {
                        resourceData = result.rows[0];
                    } else if (action !== 'SELECT') {
                        return res.status(404).json({ message: 'Producto no encontrado' });
                    }
                }
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
            
            req.resourceData = resourceData;
            next();
        } catch (error) {
            console.error('Error en ABAC middleware:', error);
            res.status(500).json({ message: 'Error verificando permisos ABAC' });
        }
    };
};

module.exports = { checkPermission, abacMiddleware };