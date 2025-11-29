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
  uid: number;
  cn: string;           // Common Name (nombre de usuario)
  homeDir: string;
  gid: number;          // Group ID
  group: UserGroup;
  status: 'active' | 'inactive';
}

/**
 * Modos de operación del laboratorio
 */
export type LabMode = 'normal' | 'exam';
