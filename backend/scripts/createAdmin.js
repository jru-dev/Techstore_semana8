const pool = require('../config/database');
const bcrypt = require('bcryptjs');

async function createAdmin() {
    try {
        const email = 'admin@techstore.com';
        const password = 'Admin123!';
        const hashedPassword = await bcrypt.hash(password, 10);
        
        console.log('Hash generado:', hashedPassword);
        
        // Verificar si existe
        const existing = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
        
        if (existing.rows.length > 0) {
            // Actualizar contraseña
            await pool.query('UPDATE usuarios SET password_hash = $1 WHERE email = $2', [hashedPassword, email]);
            console.log('✅ Contraseña de admin actualizada');
        } else {
            // Crear admin
            const result = await pool.query(
                'INSERT INTO usuarios (email, password_hash, nombre_completo, activo) VALUES ($1, $2, $3, $4) RETURNING id',
                [email, hashedPassword, 'Administrador', true]
            );
            
            // Asignar rol Admin
            const roleResult = await pool.query('SELECT id FROM roles WHERE nombre = $1', ['Admin']);
            await pool.query(
                'INSERT INTO usuario_roles (usuario_id, rol_id, asignado_por) VALUES ($1, $2, $1)',
                [result.rows[0].id, roleResult.rows[0].id]
            );
            console.log('✅ Admin creado correctamente');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

createAdmin();