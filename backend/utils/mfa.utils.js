const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const nodemailer = require('nodemailer');

// Configurar email para MFA
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Generar secreto MFA (para TOTP)
const generateMFASecret = (email) => {
    const secret = speakeasy.generateSecret({
        name: `TechStore:${email}`
    });
    return secret;
};

// Generar QR code para Google Authenticator
const generateQRCode = async (secret) => {
    try {
        const qrCode = await QRCode.toDataURL(secret.otpauth_url);
        return qrCode;
    } catch (error) {
        throw error;
    }
};

// Verificar código TOTP
const verifyTOTP = (secret, token) => {
    return speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: token,
        window: 1
    });
};

// Generar código de 6 dígitos (para MFA por email)
const generateEmailCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Enviar código por email
const sendMFACodeByEmail = async (email, code) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Código MFA - TechStore',
        html: `
            <h2>TechStore - Código de Autenticación</h2>
            <p>Tu código de verificación es:</p>
            <h1 style="font-size: 32px; letter-spacing: 5px;">${code}</h1>
            <p>Este código es válido por 5 minutos.</p>
            <p>Si no solicitaste este código, ignora este mensaje.</p>
        `
    };
    
    await transporter.sendMail(mailOptions);
    return true;
};

// Almacenar códigos MFA temporalmente
const mfaCodes = new Map();

const storeMFACode = (userId, code) => {
    mfaCodes.set(userId, {
        code: code,
        expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutos
    });
};

const verifyMFACode = (userId, code) => {
    const stored = mfaCodes.get(userId);
    if (!stored) return false;
    if (stored.expiresAt < Date.now()) {
        mfaCodes.delete(userId);
        return false;
    }
    if (stored.code !== code) return false;
    mfaCodes.delete(userId);
    return true;
};

module.exports = {
    generateMFASecret,
    generateQRCode,
    verifyTOTP,
    generateEmailCode,
    sendMFACodeByEmail,
    storeMFACode,
    verifyMFACode
};