const fs = require('fs');
const path = require('path');
const pool = require('../config/database');
const bcrypt = require('bcryptjs');

async function initDatabase() {
    try {
        const sql = fs.readFileSync(path.join(__dirname, '../config/init.sql'), 'utf8');
        
        // Hash de la contraseña admin: Admin123!
        const hashedPassword = await bcrypt.hash('Admin123!', 10);
        const sqlWithHash = sql.replace('$2a$10$rQZC5xZ5xZ5xZ5xZ5xZ5xOuZ5xZ5xZ5xZ5xZ5xZ5xZ5xZ5xZ5x', hashedPassword);
        
        await pool.query(sqlWithHash);
        console.log('✅ Base de datos inicializada correctamente');
    } catch (error) {
        console.error('❌ Error inicializando BD:', error.message);
    }
}

module.exports = initDatabase;