-- Crear tabla de logs
CREATE TABLE IF NOT EXISTS logs (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id),
    accion VARCHAR(50) NOT NULL,
    recurso VARCHAR(100) NOT NULL,
    detalles TEXT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índice para búsquedas
CREATE INDEX IF NOT EXISTS idx_logs_usuario ON logs(usuario_id);
CREATE INDEX IF NOT EXISTS idx_logs_fecha ON logs(fecha);