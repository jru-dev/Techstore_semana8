const pool = require('../config/database');

// Función de logging de acciones
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

// Obtener todos los productos (filtrado por tienda según rol en ABAC middleware)
const getProducts = async (req, res) => {
    try {
        const userRoles = req.userRoles || [];
        const tiendaId = req.tiendaId;

        let query;
        let params = [];

        if (userRoles.includes('Admin') || userRoles.includes('Auditor')) {
            // Admin y Auditor ven todos los productos
            query = `
                SELECT p.*, t.nombre as tienda_nombre, u.nombre_completo as creador_nombre
                FROM productos p
                LEFT JOIN tiendas t ON p.tienda_id = t.id
                LEFT JOIN usuarios u ON p.creado_por = u.id
                ORDER BY p.fecha_creacion DESC
            `;
        } else {
            // Gerente y Empleado solo ven productos de su tienda
            query = `
                SELECT p.*, t.nombre as tienda_nombre, u.nombre_completo as creador_nombre
                FROM productos p
                LEFT JOIN tiendas t ON p.tienda_id = t.id
                LEFT JOIN usuarios u ON p.creado_por = u.id
                WHERE p.tienda_id = $1
                ORDER BY p.fecha_creacion DESC
            `;
            params = [tiendaId];
        }

        const result = await pool.query(query, params);
        await logAction(req.userId, 'SELECT', 'productos', `Listado de productos (${result.rows.length} registros)`);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error obteniendo productos' });
    }
};

// Obtener producto por ID
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT p.*, t.nombre as tienda_nombre, u.nombre_completo as creador_nombre
             FROM productos p
             LEFT JOIN tiendas t ON p.tienda_id = t.id
             LEFT JOIN usuarios u ON p.creado_por = u.id
             WHERE p.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        await logAction(req.userId, 'SELECT', 'productos', `Producto ID: ${id}`);
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error obteniendo producto' });
    }
};

// Crear producto
const createProduct = async (req, res) => {
    try {
        const { nombre, descripcion, precio, stock, categoria, tienda_id, es_premium } = req.body;

        // Validaciones básicas
        if (!nombre || !precio) {
            return res.status(400).json({ message: 'Nombre y precio son requeridos' });
        }

        if (isNaN(precio) || precio <= 0) {
            return res.status(400).json({ message: 'El precio debe ser un número positivo' });
        }

        if (stock !== undefined && (isNaN(stock) || stock < 0)) {
            return res.status(400).json({ message: 'El stock debe ser un número no negativo' });
        }

        const result = await pool.query(
            `INSERT INTO productos (nombre, descripcion, precio, stock, categoria, tienda_id, es_premium, creado_por)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [nombre, descripcion, precio, stock || 0, categoria, tienda_id, es_premium || false, req.userId]
        );

        await logAction(req.userId, 'INSERT', 'productos', `Producto creado: ${nombre} (ID: ${result.rows[0].id})`);
        res.status(201).json({
            message: 'Producto creado exitosamente',
            producto: result.rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creando producto' });
    }
};

// Actualizar producto
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const userRoles = req.userRoles || [];
        const updates = req.body;

        // Obtener producto actual (ya validado por ABAC middleware)
        const product = req.resourceData;
        if (!product) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        // Si es Empleado, solo puede actualizar stock
        if (userRoles.includes('Empleado') && !userRoles.includes('Admin') && !userRoles.includes('Gerente')) {
            if (updates.stock === undefined) {
                return res.status(403).json({ message: 'El empleado solo puede actualizar el stock' });
            }
            const result = await pool.query(
                'UPDATE productos SET stock = $1, fecha_actualizacion = NOW() WHERE id = $2 RETURNING *',
                [updates.stock, id]
            );
            await logAction(req.userId, 'UPDATE', 'productos', `Stock actualizado. Producto ID: ${id}, nuevo stock: ${updates.stock}`);
            return res.json({ message: 'Stock actualizado exitosamente', producto: result.rows[0] });
        }

        // Para Admin y Gerente: actualizar campos permitidos
        const nombre = updates.nombre || product.nombre;
        const descripcion = updates.descripcion !== undefined ? updates.descripcion : product.descripcion;
        const precio = updates.precio || product.precio;
        const stock = updates.stock !== undefined ? updates.stock : product.stock;
        const categoria = updates.categoria || product.categoria;
        const es_premium = updates.es_premium !== undefined ? updates.es_premium : product.es_premium;

        const result = await pool.query(
            `UPDATE productos 
             SET nombre = $1, descripcion = $2, precio = $3, stock = $4, 
                 categoria = $5, es_premium = $6, fecha_actualizacion = NOW()
             WHERE id = $7
             RETURNING *`,
            [nombre, descripcion, precio, stock, categoria, es_premium, id]
        );

        await logAction(req.userId, 'UPDATE', 'productos', `Producto actualizado. ID: ${id}`);
        res.json({
            message: 'Producto actualizado exitosamente',
            producto: result.rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error actualizando producto' });
    }
};

// Eliminar producto
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        // El producto ya fue validado por ABAC middleware
        const result = await pool.query(
            'DELETE FROM productos WHERE id = $1 RETURNING nombre',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        await logAction(req.userId, 'DELETE', 'productos', `Producto eliminado: ${result.rows[0].nombre} (ID: ${id})`);
        res.json({ message: 'Producto eliminado exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error eliminando producto' });
    }
};

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    logAction
};