/**
 * API Configuration - UniNet Frontend
 * 
 * Configuración centralizada de URLs del backend.
 * La URL base se obtiene de la variable de entorno VITE_API_URL.
 * 
 * Para configurar:
 * 1. Crea un archivo .env en la raíz de frontend/
 * 2. Agrega: VITE_API_URL=http://100.123.97.120:4000
 * 3. Reinicia el servidor de desarrollo
 */

// Obtener URL base del backend desde variable de entorno
const API_URL = import.meta.env.VITE_API_URL;

// Validar que la variable de entorno esté definida
if (!API_URL) {
    throw new Error(
        '❌ ERROR: VITE_API_URL no está definida.\n\n' +
        'Por favor crea un archivo .env en frontend/ con:\n' +
        'VITE_API_URL=http://100.123.97.120:4000\n\n' +
        'Luego reinicia el servidor de desarrollo (npm run dev)'
    );
}

console.log('🔗 API Base URL:', API_URL);

/**
 * URL base del backend
 */
export const API_BASE_URL = API_URL;

/**
 * Endpoints del API organizados por módulo
 */
export const API_ENDPOINTS = {
    // Autenticación
    auth: {
        login: `${API_URL}/api/auth/login`,
        me: `${API_URL}/api/auth/me`,
    },

    // Usuarios LDAP
    users: {
        list: `${API_URL}/api/users/list`,
        create: `${API_URL}/api/users/create`,
        update: `${API_URL}/api/users/update`,
        delete: `${API_URL}/api/users/delete`,
    },

    // Docentes del sistema
    docentes: {
        list: `${API_URL}/api/docentes/list`,
        create: `${API_URL}/api/docentes/create`,
        update: (id: string) => `${API_URL}/api/docentes/${id}`,
        delete: (id: string) => `${API_URL}/api/docentes/${id}`,
    },

    // Monitoreo
    monitoring: {
        status: `${API_URL}/api/monitoring/status`,
        logs: `${API_URL}/api/monitoring/logs`,
        networkStatus: `${API_URL}/api/monitoring/network/status`,
        networkControl: `${API_URL}/api/monitoring/network/control_internet`,
        stats: `${API_URL}/api/monitoring/stats`,
    },

    // Logs
    logs: `${API_URL}/api/logs`,

    // Health check
    health: `${API_URL}/health`,
};
