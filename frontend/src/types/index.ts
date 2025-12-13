// ==========================================
// TIPOS TYPESCRIPT - UniNet Admin
// ==========================================

/**
 * Estados posibles de una PC del laboratorio
 */
export type PCStatus = 'online' | 'offline' | 'inUse' | 'examMode';

/**
 * Estado del laboratorio
 */
export type LabStatus = 'online' | 'offline' | 'partial';

/**
 * Colores disponibles para laboratorios
 */
export type LabColor = 'sistemas' | 'redes' | 'diseno' | 'finanzas' | 'desarrollo' | 'ciencias' | 'medicina' | 'derecho';

/**
 * Interfaz de Laboratorio
 */
export interface Laboratory {
  id: string;           // "lab-sistemas"
  name: string;         // "Laboratorio de Sistemas"
  faculty: string;      // "Ingeniería"
  color: LabColor;      // Color del borde
  icon: string;         // Nombre del icono Lucide
  pcsCount: number;     // Total de PCs
  usersCount: number;   // Usuarios activos
  status: LabStatus;    // Estado general
}

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
  dn: string;           // Distinguished Name
  laboratoryId: string; // ID del laboratorio al que pertenece
  group: UserGroup;     // Grupo (alumnos/docentes)
  carrera?: string;     // Carrera profesional
  status: 'active' | 'inactive'; // Estado del usuario
}

/**
 * Modos de operación del laboratorio
 */
export type LabMode = 'normal' | 'exam';
