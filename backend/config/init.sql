-- Crear tablas
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tiendas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    ubicacion VARCHAR(255),
    activo BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre_completo VARCHAR(255) NOT NULL,
    tienda_id INTEGER REFERENCES tiendas(id),
    mfa_habilitado BOOLEAN DEFAULT false,
    mfa_secret VARCHAR(255),
    activo BOOLEAN DEFAULT true,
    intentos_fallidos INTEGER DEFAULT 0,
    bloqueado BOOLEAN DEFAULT false,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS usuario_roles (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id),
    rol_id INTEGER REFERENCES roles(id),
    asignado_por INTEGER REFERENCES usuarios(id),
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10, 2) NOT NULL,
    stock INTEGER DEFAULT 0,
    categoria VARCHAR(100),
    tienda_id INTEGER REFERENCES tiendas(id),
    es_premium BOOLEAN DEFAULT false,
    creado_por INTEGER REFERENCES usuarios(id),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar roles iniciales
INSERT INTO roles (nombre, descripcion) VALUES
('Admin', 'Acceso total al sistema'),
('Gerente', 'Gestiona productos de su tienda'),
('Empleado', 'Consulta y actualiza stock'),
('Auditor', 'Solo lectura de todos los datos')
ON CONFLICT (nombre) DO NOTHING;

-- Insertar tiendas de ejemplo
INSERT INTO tiendas (nombre, ubicacion) VALUES
('TechStore Lima', 'Lima, Perú'),
('TechStore Arequipa', 'Arequipa, Perú'),
('TechStore Cusco', 'Cusco, Perú')
ON CONFLICT DO NOTHING;

-- Crear usuario admin
INSERT INTO usuarios (email, password_hash, nombre_completo, tienda_id)
VALUES ('admin@techstore.com', '$2a$10$rQZC5xZ5xZ5xZ5xZ5xZ5xOuZ5xZ5xZ5xZ5xZ5xZ5xZ5xZ5xZ5x', 'Administrador Sistema', 1)
ON CONFLICT DO NOTHING;

-- Asignar rol Admin al usuario admin
INSERT INTO usuario_roles (usuario_id, rol_id, asignado_por)
SELECT u.id, r.id, u.id
FROM usuarios u, roles r
WHERE u.email = 'admin@techstore.com' AND r.nombre = 'Admin'
ON CONFLICT DO NOTHING;

-- Crear tabla de logs
CREATE TABLE IF NOT EXISTS logs (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id),
    accion VARCHAR(50) NOT NULL,
    recurso VARCHAR(100) NOT NULL,
    detalles TEXT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_logs_usuario ON logs(usuario_id);
CREATE INDEX IF NOT EXISTS idx_logs_fecha ON logs(fecha);