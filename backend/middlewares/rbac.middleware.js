const pool = require('../config/database');

const checkRole = (...allowedRoles) => {
    return async (req, res, next) => {
        try {
            const result = await pool.query(
                `SELECT r.nombre FROM usuario_roles ur 
                 JOIN roles r ON ur.rol_id = r.id 
                 WHERE ur.usuario_id = $1`,
                [req.userId]
            );
            
            const userRoles = result.rows.map(row => row.nombre);
            const hasRole = userRoles.some(role => allowedRoles.includes(role));
            
            if (!hasRole) {
                return res.status(403).json({ 
                    message: 'No tienes permisos suficientes',
                    required: allowedRoles,
                    yourRoles: userRoles
                });
            }
            
            req.userRoles = userRoles;
            next();
        } catch (error) {
            res.status(500).json({ message: 'Error verificando roles' });
        }
    };
};

module.exports = { checkRole };