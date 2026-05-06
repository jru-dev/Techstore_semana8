// Obtener producto por ID (sin verificación manual de tienda, el middleware ABAC ya lo hace)
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
        res.status(500).json({ message: 'Error obteniendo producto' });
    }
};