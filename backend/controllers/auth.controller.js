const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { 
    generateMFASecret, 
    generateQRCode, 
    verifyTOTP,
    generateEmailCode,
    sendMFACodeByEmail,
    storeMFACode,
    verifyMFACode
} = require('../utils/mfa.utils');

// Registro de usuarios
const register = async (req, res) => {
    try {
        const { email, password, nombre_completo, tienda_id } = req.body;
        
        // Validar contraseña segura
        const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ 
                message: 'Contraseña debe tener mínimo 8 caracteres, una mayúscula, un número y un carácter especial' 
            });
        }
        
        // Verificar si email existe
        const existingUser = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ message: 'El email ya está registrado' });
        }
        
        // Hash contraseña
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Crear usuario
        const result = await pool.query(
            `INSERT INTO usuarios (email, password_hash, nombre_completo, tienda_id) 
             VALUES ($1, $2, $3, $4) RETURNING id, email, nombre_completo`,
            [email, hashedPassword, nombre_completo, tienda_id]
        );
        
        // Asignar rol por defecto (Empleado)
        const roleResult = await pool.query('SELECT id FROM roles WHERE nombre = $1', ['Empleado']);
        await pool.query(
            'INSERT INTO usuario_roles (usuario_id, rol_id, asignado_por) VALUES ($1, $2, $1)',
            [result.rows[0].id, roleResult.rows[0].id]
        );
        
        res.status(201).json({ 
            message: 'Usuario registrado exitosamente',
            user: result.rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Buscar usuario
        const userResult = await pool.query(
            `SELECT u.*, array_agg(r.nombre) as roles 
             FROM usuarios u
             LEFT JOIN usuario_roles ur ON u.id = ur.usuario_id
             LEFT JOIN roles r ON ur.rol_id = r.id
             WHERE u.email = $1
             GROUP BY u.id`,
            [email]
        );
        
        if (userResult.rows.length === 0) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }
        
        const user = userResult.rows[0];
        
        // Verificar si está bloqueado
        if (user.bloqueado) {
            return res.status(401).json({ message: 'Usuario bloqueado. Contacte al administrador' });
        }
        
        // Verificar si está activo
        if (!user.activo) {
            return res.status(401).json({ message: 'Usuario inactivo' });
        }
        
        // Verificar contraseña
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            const newAttempts = (user.intentos_fallidos || 0) + 1;
            if (newAttempts >= 5) {
                await pool.query('UPDATE usuarios SET bloqueado = true WHERE id = $1', [user.id]);
                return res.status(401).json({ message: 'Usuario bloqueado por múltiples intentos fallidos' });
            }
            await pool.query('UPDATE usuarios SET intentos_fallidos = $1 WHERE id = $2', [newAttempts, user.id]);
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }
        
        // Resetear intentos fallidos
        await pool.query('UPDATE usuarios SET intentos_fallidos = 0 WHERE id = $1', [user.id]);
        
        // Generar token temporal (requiere MFA)
        const tempToken = jwt.sign(
            { 
                userId: user.id, 
                email: user.email, 
                requiresMFA: true 
            },
            process.env.JWT_SECRET,
            { expiresIn: '5m' }
        );
        
        // Si tiene MFA habilitado, solo devolver tempToken
        if (user.mfa_habilitado) {
            return res.json({
                message: 'Credenciales correctas. Se requiere MFA',
                requiresMFA: true,
                tempToken: tempToken,
                mfaMethod: 'TOTP'
            });
        }
        
        // Si no tiene MFA habilitado, enviar código por email
        const code = generateEmailCode();
        storeMFACode(user.id, code);
        await sendMFACodeByEmail(user.email, code);
        
        res.json({
            message: 'Credenciales correctas. Se ha enviado un código MFA a tu correo',
            requiresMFA: true,
            tempToken: tempToken,
            mfaMethod: 'EMAIL'
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};

// Verificar MFA
const verifyMFA = async (req, res) => {
    try {
        const { tempToken, mfaCode } = req.body;
        
        // Verificar token temporal
        let decoded;
        try {
            decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
        } catch (error) {
            return res.status(401).json({ message: 'Token expirado. Debe iniciar sesión nuevamente' });
        }
        
        // Obtener usuario
        const userResult = await pool.query(
            `SELECT u.*, array_agg(r.nombre) as roles 
             FROM usuarios u
             LEFT JOIN usuario_roles ur ON u.id = ur.usuario_id
             LEFT JOIN roles r ON ur.rol_id = r.id
             WHERE u.id = $1
             GROUP BY u.id`,
            [decoded.userId]
        );
        
        const user = userResult.rows[0];
        let isValid = false;
        
        if (user.mfa_habilitado && user.mfa_secret) {
            // Verificar TOTP
            isValid = verifyTOTP(user.mfa_secret, mfaCode);
        } else {
            // Verificar código por email
            isValid = verifyMFACode(user.id, mfaCode);
        }
        
        if (!isValid) {
            return res.status(401).json({ message: 'Código MFA inválido' });
        }
        
        // Generar token JWT completo
        const fullToken = jwt.sign(
            { 
                userId: user.id, 
                email: user.email, 
                roles: user.roles,
                tiendaId: user.tienda_id,
                requiresMFA: false 
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );
        
        res.json({
            message: 'Acceso concedido',
            token: fullToken,
            user: {
                id: user.id,
                email: user.email,
                nombre_completo: user.nombre_completo,
                roles: user.roles,
                tienda_id: user.tienda_id
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};

// Configurar MFA (TOTP)
const setupMFA = async (req, res) => {
    try {
        const userId = req.userId;
        const secret = generateMFASecret(req.userEmail);
        const qrCode = await generateQRCode(secret);
        
        // Guardar secreto temporalmente
        await pool.query('UPDATE usuarios SET mfa_secret = $1 WHERE id = $2', [secret.base32, userId]);
        
        res.json({
            secret: secret.base32,
            qrCode: qrCode,
            message: 'Escanea el código QR con Google Authenticator'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error configurando MFA' });
    }
};

// Confirmar MFA (después de escanear QR)
const confirmMFA = async (req, res) => {
    try {
        const { token } = req.body;
        const userId = req.userId;
        
        const userResult = await pool.query('SELECT mfa_secret FROM usuarios WHERE id = $1', [userId]);
        const isValid = verifyTOTP(userResult.rows[0].mfa_secret, token);
        
        if (!isValid) {
            return res.status(400).json({ message: 'Código inválido' });
        }
        
        await pool.query('UPDATE usuarios SET mfa_habilitado = true WHERE id = $1', [userId]);
        
        res.json({ message: 'MFA configurado exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error confirmando MFA' });
    }
};

// Enviar código MFA por email
const sendMFACode = async (req, res) => {
    try {
        const { tempToken } = req.body;
        const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
        
        const userResult = await pool.query('SELECT email FROM usuarios WHERE id = $1', [decoded.userId]);
        const code = generateEmailCode();
        
        storeMFACode(decoded.userId, code);
        await sendMFACodeByEmail(userResult.rows[0].email, code);
        
        res.json({ message: 'Código MFA enviado a tu correo' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error enviando código MFA' });
    }
};

module.exports = {
    register,
    login,
    verifyMFA,
    setupMFA,
    confirmMFA,
    sendMFACode
};