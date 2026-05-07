# TechStore Inventory Management System

Sistema integral para la gestión de inventario, roles, usuarios y control de acceso basado en atributos (ABAC) y roles (RBAC). Desarrollado para la administración de productos en múltiples sedes de tiendas tecnológicas.

## Características principales

- **Autenticación Multi-Factor (MFA):** Sistema de seguridad con verificación de 2 pasos. Incluye un interruptor global desde el panel de navegación para encender/apagar dinámicamente el requerimiento del MFA.
- **Role-Based Access Control (RBAC):** Roles predefinidos (`Admin`, `Gerente`, `Empleado`, `Auditor`) con accesos protegidos.
- **Attribute-Based Access Control (ABAC):** Control granular basado en atributos para el inventario. Las políticas controlan el acceso revisando la tienda de pertenencia y condiciones sobre el producto (como `es_premium`).
- **Interfaz Moderna:** UI rediseñada aplicando estilos en *Glassmorphism*, paleta de colores vibrante mediante utilidades de Tailwind CSS, fuentes modernas (Google Outfit) y microinteracciones de sombras.

## Permisos del Sistema (ABAC/RBAC)

1. **Auditor:** Permisos de sólo lectura (`SELECT`). No cuenta con visibilidad de botones de creación, modificación o eliminación.
2. **Empleado:** Puede ver los productos de su tienda e insertar nuevos (sólo si no son premium). Tiene acceso a actualizar productos, pero **sólo el atributo de stock**. Los demás campos están bloqueados. No puede eliminar productos.
3. **Gerente:** Puede visualizar, crear, editar y eliminar productos de su tienda respectiva. Sin embargo, no tiene permisos para ver o administrar el panel de usuarios.
4. **Admin:** Posee acceso total. Administra productos en todas las tiendas, gestiona la creación de nuevos usuarios, roles, el control del MFA, entre otras configuraciones globales.

## Despliegue con Docker

El proyecto está diseñado para desplegarse fácilmente usando contenedores.

### Iniciar el entorno:
```bash
docker-compose up -d
```

### Reiniciar servicios (Frontend y Backend):
En caso de hacer modificaciones, puedes reiniciar ambos servicios:
```bash
docker restart techstore_backend techstore_frontend
```

## Credenciales de Prueba
- **Usuario:** `admin@techstore.com`
- **Contraseña:** `Admin123!`
- *(Acceso directo sin código de correo si el Toggle de MFA Global está apagado, de lo contrario verifica los buzones configurados en Mailtrap).*
