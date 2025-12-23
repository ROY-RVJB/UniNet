// ==========================================
// TIPOS TYPESCRIPT - UniNet Admin
// ==========================================

/**
 * Estados posibles de una PC del laboratorio
 */
export type PCStatus = 'online' | 'offline' | 'inUse' | 'examMode';

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
 * Usuario en OpenLDAP
 */
export interface LDAPUser {
  username: string;     // Username (uid en LDAP)
  full_name: string;    // Common Name (nombre completo)
  email: string;        // Email del usuario
  codigo?: string;      // Código de estudiante
  dn: string;           // Distinguished Name
  laboratoryId: string; // ID del laboratorio al que pertenece
  group: UserGroup;     // Grupo (alumnos/docentes)
  carrera?: string;     // Carrera profesional
  status: 'active' | 'inactive'; // Estado del usuario
}

// ==========================================
// TIPOS - Selector de Carreras
// ==========================================

/**
 * Facultades disponibles
 */
export type Faculty = 'ingenieria' | 'artes' | 'ciencias' | 'salud';

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
