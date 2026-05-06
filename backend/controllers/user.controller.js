const pool = require('../config/database');
const bcrypt = require('bcryptjs');

// Listar todos los usuarios
const getUsers = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT u.id, u.email, u.nombre_completo, u.tienda_id, 
                   u.activo, u.fecha_creacion,
                   t.nombre as tienda_nombre,
                   array_agg(DISTINCT r.nombre) as roles
            FROM usuarios u
            LEFT JOIN tiendas t ON u.tienda_id = t.id
            LEFT JOIN usuario_roles ur ON u.id = ur.usuario_id
            LEFT JOIN roles r ON ur.rol_id = r.id
            GROUP BY u.id, t.nombre
            ORDER BY u.id
        `);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error obteniendo usuarios' });
    }
};

// Obtener usuario por ID
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
            SELECT u.id, u.email, u.nombre_completo, u.tienda_id, u.activo,
                   array_agg(DISTINCT r.nombre) as roles
            FROM usuarios u
            LEFT JOIN usuario_roles ur ON u.id = ur.usuario_id
            LEFT JOIN roles r ON ur.rol_id = r.id
            WHERE u.id = $1
            GROUP BY u.id
        `, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error obteniendo usuario' });
    }
};

// Crear usuario
const createUser = async (req, res) => {
    try {
        const { email, password, nombre_completo, tienda_id, roles } = req.body;
        
        // Validar contraseña segura
        const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ 
                message: 'Contraseña debe tener mínimo 8 caracteres, una mayúscula, un número y un carácter especial' 
            });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const result = await pool.query(
            `INSERT INTO usuarios (email, password_hash, nombre_completo, tienda_id) 
             VALUES ($1, $2, $3, $4) RETURNING id, email, nombre_completo`,
            [email, hashedPassword, nombre_completo, tienda_id]
        );
        
        // Asignar roles
        if (roles && roles.length > 0) {
            for (const rolNombre of roles) {
                const roleResult = await pool.query('SELECT id FROM roles WHERE nombre = $1', [rolNombre]);
                if (roleResult.rows[0]) {
                    await pool.query(
                        'INSERT INTO usuario_roles (usuario_id, rol_id, asignado_por) VALUES ($1, $2, $3)',
                        [result.rows[0].id, roleResult.rows[0].id, req.userId]
                    );
                }
            }
        }
        
        res.status(201).json({ 
            message: 'Usuario creado exitosamente',
            user: result.rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creando usuario' });
    }
};

// Actualizar usuario
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre_completo, tienda_id, activo, roles } = req.body;
        
        await pool.query(
            'UPDATE usuarios SET nombre_completo = $1, tienda_id = $2, activo = $3 WHERE id = $4',
            [nombre_completo, tienda_id, activo, id]
        );
        
        // Actualizar roles
        if (roles) {
            await pool.query('DELETE FROM usuario_roles WHERE usuario_id = $1', [id]);
            for (const rolNombre of roles) {
                const roleResult = await pool.query('SELECT id FROM roles WHERE nombre = $1', [rolNombre]);
                if (roleResult.rows[0]) {
                    await pool.query(
                        'INSERT INTO usuario_roles (usuario_id, rol_id, asignado_por) VALUES ($1, $2, $3)',
                        [id, roleResult.rows[0].id, req.userId]
                    );
                }
            }
        }
        
        res.json({ message: 'Usuario actualizado exitosamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error actualizando usuario' });
    }
};

// Eliminar usuario
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar si tiene relaciones
        const checkResult = await pool.query(
            'SELECT COUNT(*) FROM usuario_roles WHERE usuario_id = $1',
            [id]
        );
        
        if (parseInt(checkResult.rows[0].count) > 0) {
            await pool.query('DELETE FROM usuario_roles WHERE usuario_id = $1', [id]);
        }
        
        await pool.query('DELETE FROM usuarios WHERE id = $1', [id]);
        res.json({ message: 'Usuario eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error eliminando usuario' });
    }
};

module.exports = {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
};