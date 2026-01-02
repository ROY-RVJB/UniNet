// ==========================================
// TIPOS TYPESCRIPT - UniNet Admin
// ==========================================

/**
 * Estados posibles de una PC del laboratorio
 * - online: PC encendida y conectada, sin usuario activo
 * - offline: PC apagada o sin conexión (>60s sin heartbeat)
 * - inUse: PC encendida con usuario activo
 * - examMode: PC en modo examen (restricciones activas)
 */
export type PCStatus = 'online' | 'offline' | 'inUse' | 'examMode';

/**
 * Métricas de CPU
 */
export interface CPUMetrics {
  percent: number;
  cores: number;
  per_core: number[];
  load_average: number[];
}

/**
 * Métricas de RAM
 */
export interface RAMMetrics {
  total: number;
  used: number;
  percent: number;
  available: number;
  swap_total: number;
  swap_used: number;
  swap_percent: number;
}

/**
 * Métricas de Disco
 */
export interface DiskMetrics {
  total: number;
  used: number;
  percent: number;
  free: number;
}

/**
 * Métricas de Red
 */
export interface NetworkMetrics {
  sent_total: number;
  recv_total: number;
}

/**
 * Información de proceso
 */
export interface ProcessInfo {
  pid: number;
  name: string;
  user: string;
  cpu_percent: number;
  mem_percent: number;
  mem_mb: number;
}

/**
 * Métricas completas del sistema
 */
export interface SystemMetrics {
  cpu: CPUMetrics;
  ram: RAMMetrics;
  disk: DiskMetrics;
  network: NetworkMetrics;
  top_processes: ProcessInfo[];
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
  carrera?: string;     // Código de carrera/laboratorio (5001-5012)
  metrics?: SystemMetrics;  // Métricas del sistema
  metricsTimestamp?: string; // Timestamp de las métricas
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

// ==========================================
// TIPOS - Alertas de Seguridad (Suricata)
// ==========================================

/**
 * Severidad de la alerta
 */
export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

/**
 * Categorías de alertas de Suricata
 */
export type AlertCategory =
  | 'port-scan'           // Escaneo de puertos
  | 'brute-force'         // Intentos de fuerza bruta
  | 'malware'             // Malware detectado
  | 'exploit'             // Intento de explotación
  | 'policy-violation'    // Violación de políticas
  | 'suspicious-traffic'  // Tráfico sospechoso
  | 'ddos'                // Ataque DDoS
  | 'unauthorized-access' // Acceso no autorizado
  | 'data-exfiltration'   // Exfiltración de datos
  | 'other';              // Otros

/**
 * Alerta de seguridad de Suricata
 */
export interface SecurityAlert {
  id: string;                 // ID único de la alerta
  timestamp: Date;            // Timestamp de la alerta
  pcId: string;               // PC que generó la alerta ("pc-01")
  pcName: string;             // Nombre de la PC
  carreraId: string;          // ID de la carrera (ej: "5001")
  carreraName: string;        // Nombre de la carrera (ej: "Ingeniería de Sistemas")
  userName: string | null;    // Usuario LDAP que estaba usando la PC (null si no hay usuario)
  severity: AlertSeverity;    // Severidad
  category: AlertCategory;    // Categoría
  title: string;              // Título técnico original de Suricata
  friendlyTitle?: string;     // Título traducido y comprensible
  description: string;        // Descripción detallada
  friendlyDescription?: string; // Explicación clara de qué significa la alerta
  sourceIp: string;           // IP origen
  destIp: string;             // IP destino
  protocol: string;           // Protocolo (TCP/UDP/ICMP)
  sourcePort?: number;        // Puerto origen (opcional)
  destPort?: number;          // Puerto destino (opcional)
  signatureId?: number;       // ID de firma de Suricata
  acknowledged?: boolean;     // Si fue reconocida por el admin
}
