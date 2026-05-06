const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const verifyToken = async (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    
    if (!token) {
        return res.status(403).json({ message: 'No se proporcionó token' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        req.userEmail = decoded.email;
        req.userRoles = decoded.roles || [];
        req.tiendaId = decoded.tiendaId;
        
        // Si no vienen roles en el token, consultar BD
        if (!decoded.roles || decoded.roles.length === 0) {
            const result = await pool.query(
                `SELECT array_agg(r.nombre) as roles 
                 FROM usuario_roles ur
                 JOIN roles r ON ur.rol_id = r.id
                 WHERE ur.usuario_id = $1`,
                [req.userId]
            );
            req.userRoles = result.rows[0]?.roles || [];
        }
        
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token inválido o expirado' });
    }
};

module.exports = { verifyToken };