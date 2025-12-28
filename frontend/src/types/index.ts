// ==========================================
// TIPOS TYPESCRIPT - UniNet Admin
// ==========================================

/**
 * Estados posibles de una PC del laboratorio
 * - online: PC encendida y conectada, sin usuario activo
 * - offline: PC apagada o sin conexión (>60s sin heartbeat)
 * - inUse: PC encendida con usuario activo
 */
export type PCStatus = 'online' | 'offline' | 'inUse';

/**
 * Interfaz de PC del Laboratorio
 */
export interface PC {
  id: string;           // "pc-01"
  name: string;         // "PC-LAB-01"
  ip: string;           // "192.168.1.101"
  status: PCStatus;
  user: string | null;  // Usuario LDAP actual o null
  lastSeen: Date;
  laboratoryId: string; // ID del laboratorio al que pertenece
  carrera?: string;     // Código de carrera/laboratorio (5001-5012)
}

/**
 * Niveles de log
 */
export type LogLevel = 'info' | 'warn' | 'error';

/**
 * Entrada de log del sistema
 */
export interface LogEntry {
  id: string;
  timestamp: Date;
  source: string;       // PC que generó el log
  message: string;
  level: LogLevel;
}

/**
 * Grupos de usuarios LDAP
 */
export type UserGroup = 'alumnos' | 'docentes';

/**
 * Usuario en OpenLDAP (actualizado con nuevos campos)
 */
export interface LDAPUser {
  username: string;           // Username (uid en LDAP)
  codigo: string;             // Código de estudiante (employeeNumber)
  nombres: string;            // Nombre(s) (givenName)
  apellido_paterno: string;   // Apellido paterno (sn)
  apellido_materno: string;   // Apellido materno
  dni: string;                // DNI (desde description)
  carrera: string;            // Código de carrera (departmentNumber): 5001-5012
  email: string | null;       // Email del usuario (generado automáticamente)
  dn: string;                 // Distinguished Name
  // Campos opcionales para compatibilidad con UI anterior
  full_name?: string;         // Nombre completo (construido desde nombres + apellidos)
  group?: UserGroup;          // Grupo (alumnos/docentes) - derivado
  laboratoryId?: string;      // ID del laboratorio - derivado de carrera
  status?: 'active' | 'inactive'; // Estado - por defecto active
}

// ==========================================
// TIPOS - Selector de Carreras
// ==========================================

/**
 * Facultades disponibles
 */
export type Faculty = 'ingenieria' | 'educacion' | 'ciencias' | 'salud' | 'artes';

/**
 * Estado de una carrera/nodo
 */
export type CarreraStatus = 'online' | 'offline' | 'partial';

/**
 * Interfaz de Carrera (Nodo de infraestructura)
 */
export interface Carrera {
  id: string;              // "carrera-sistemas"
  name: string;            // "Ingeniería de Sistemas"
  faculty: Faculty;        // Facultad a la que pertenece
  icon: string;            // Nombre del icono Lucide
  pcsCount: number;        // Total de PCs asignadas
  usersCount: number;      // Usuarios registrados
  status: CarreraStatus;   // Estado del nodo
  nodeId?: string;         // ID del nodo (ej: "NODE-ISI-01")
  lastSync?: Date;         // Última sincronización
}
