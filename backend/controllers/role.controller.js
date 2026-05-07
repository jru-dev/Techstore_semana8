const pool = require('../config/database');

// Función de logging compartida
const logAction = async (usuarioId, accion, recurso, detalles) => {
    try {
        await pool.query(
            'INSERT INTO logs (usuario_id, accion, recurso, detalles) VALUES ($1, $2, $3, $4)',
            [usuarioId, accion, recurso, detalles]
        );
    } catch (error) {
        console.error('Error registrando log:', error);
    }
};

// Listar todos los roles
const getRoles = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT r.*, COUNT(ur.usuario_id) as usuarios_asignados
            FROM roles r
            LEFT JOIN usuario_roles ur ON r.id = ur.rol_id
            GROUP BY r.id
            ORDER BY r.id
        `);
        await logAction(req.userId, 'SELECT', 'roles', `Listado de roles (${result.rows.length} registros)`);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Error obteniendo roles' });
    }
};

// Obtener rol por ID
const getRoleById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM roles WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Rol no encontrado' });
        }

        await logAction(req.userId, 'SELECT', 'roles', `Consulta rol ID: ${id}`);
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error obteniendo rol' });
    }
};

// Crear rol (solo Admin)
const createRole = async (req, res) => {
    try {
        const { nombre, descripcion } = req.body;

        const existing = await pool.query('SELECT id FROM roles WHERE nombre = $1', [nombre]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ message: 'El rol ya existe' });
        }

        const result = await pool.query(
            'INSERT INTO roles (nombre, descripcion) VALUES ($1, $2) RETURNING *',
            [nombre, descripcion]
        );

        await logAction(req.userId, 'INSERT', 'roles', `Rol creado: ${nombre} (ID: ${result.rows[0].id})`);

        res.status(201).json({
            message: 'Rol creado exitosamente',
            role: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({ message: 'Error creando rol' });
    }
};

// Actualizar rol (solo Admin)
const updateRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion } = req.body;

        const result = await pool.query(
            'UPDATE roles SET nombre = $1, descripcion = $2 WHERE id = $3 RETURNING *',
            [nombre, descripcion, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Rol no encontrado' });
        }

        await logAction(req.userId, 'UPDATE', 'roles', `Rol actualizado ID: ${id} → nombre: ${nombre}`);

        res.json({
            message: 'Rol actualizado exitosamente',
            role: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({ message: 'Error actualizando rol' });
    }
};

// Eliminar rol (solo Admin)
const deleteRole = async (req, res) => {
    try {
        const { id } = req.params;

        const checkResult = await pool.query(
            'SELECT COUNT(*) FROM usuario_roles WHERE rol_id = $1',
            [id]
        );

        if (parseInt(checkResult.rows[0].count) > 0) {
            return res.status(400).json({
                message: 'No se puede eliminar el rol porque tiene usuarios asignados'
            });
        }

        // Obtener nombre antes de eliminar para el log
        const rolResult = await pool.query('SELECT nombre FROM roles WHERE id = $1', [id]);
        const nombre = rolResult.rows[0]?.nombre || `ID: ${id}`;

        const result = await pool.query('DELETE FROM roles WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Rol no encontrado' });
        }

        await logAction(req.userId, 'DELETE', 'roles', `Rol eliminado: ${nombre} (ID: ${id})`);
        res.json({ message: 'Rol eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error eliminando rol' });
    }
};

// Asignar rol a usuario
const assignRoleToUser = async (req, res) => {
    try {
        const { usuario_id, rol_id } = req.body;

        const existing = await pool.query(
            'SELECT id FROM usuario_roles WHERE usuario_id = $1 AND rol_id = $2',
            [usuario_id, rol_id]
        );

        if (existing.rows.length > 0) {
            return res.status(400).json({ message: 'El usuario ya tiene este rol' });
        }

        await pool.query(
            'INSERT INTO usuario_roles (usuario_id, rol_id, asignado_por) VALUES ($1, $2, $3)',
            [usuario_id, rol_id, req.userId]
        );

        await logAction(req.userId, 'INSERT', 'usuario_roles', `Rol ID ${rol_id} asignado a usuario ID ${usuario_id}`);
        res.json({ message: 'Rol asignado exitosamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error asignando rol' });
    }
};

// Remover rol de usuario
const removeRoleFromUser = async (req, res) => {
    try {
        const { usuario_id, rol_id } = req.body;

        await pool.query(
            'DELETE FROM usuario_roles WHERE usuario_id = $1 AND rol_id = $2',
            [usuario_id, rol_id]
        );

        await logAction(req.userId, 'DELETE', 'usuario_roles', `Rol ID ${rol_id} removido de usuario ID ${usuario_id}`);
        res.json({ message: 'Rol removido exitosamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error removiendo rol' });
    }
};

module.exports = {
    getRoles,
    getRoleById,
    createRole,
    updateRole,
    deleteRole,
    assignRoleToUser,
    removeRoleFromUser
};