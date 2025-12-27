import type { PC, LogEntry, Carrera } from '@/types';

// ==========================================
// DATOS MOCK - PCs
// ==========================================

/**
 * PCs del laboratorio de sistemas (24 PCs)
 * Las primeras 4 son las reales que hacen ping
 */
export const mockPCs: PC[] = [
  // PCs reales (ping activo)
  {
    id: 'pc-01',
    name: 'SYS-01',
    ip: '172.29.2.37',
    status: 'offline',
    user: null,
    lastSeen: new Date(0),
    laboratoryId: 'lab-sistemas',
  },
  {
    id: 'pc-02',
    name: 'SYS-02',
    ip: '172.29.157.94',
    status: 'offline',
    user: null,
    lastSeen: new Date(0),
    laboratoryId: 'lab-sistemas',
  },
  {
    id: 'pc-03',
    name: 'SYS-03',
    ip: '172.29.177.20',
    status: 'offline',
    user: null,
    lastSeen: new Date(0),
    laboratoryId: 'lab-sistemas',
  },
  {
    id: 'pc-04',
    name: 'SYS-04',
    ip: '172.29.104.181',
    status: 'offline',
    user: null,
    lastSeen: new Date(0),
    laboratoryId: 'lab-sistemas',
  },
  // PCs mock adicionales para el lab de sistemas
  {
    id: 'pc-05',
    name: 'SYS-05',
    ip: '192.168.1.105',
    status: 'online',
    user: 'user5',
    lastSeen: new Date(),
    laboratoryId: 'lab-sistemas',
  },
  {
    id: 'pc-06',
    name: 'SYS-06',
    ip: '192.168.1.106',
    status: 'online',
    user: 'user6',
    lastSeen: new Date(),
    laboratoryId: 'lab-sistemas',
  },
  {
    id: 'pc-07',
    name: 'SYS-07',
    ip: '192.168.1.107',
    status: 'online',
    user: 'user7',
    lastSeen: new Date(),
    laboratoryId: 'lab-sistemas',
  },
  {
    id: 'pc-08',
    name: 'SYS-08',
    ip: '192.168.1.108',
    status: 'online',
    user: null,
    lastSeen: new Date(),
    laboratoryId: 'lab-sistemas',
  },
  {
    id: 'pc-09',
    name: 'SYS-09',
    ip: '192.168.1.109',
    status: 'online',
    user: null,
    lastSeen: new Date(),
    laboratoryId: 'lab-sistemas',
  },
  {
    id: 'pc-10',
    name: 'SYS-10',
    ip: '192.168.1.110',
    status: 'inUse',
    user: 'user9',
    lastSeen: new Date(),
    laboratoryId: 'lab-sistemas',
  },
  {
    id: 'pc-11',
    name: 'SYS-11',
    ip: '192.168.1.111',
    status: 'online',
    user: null,
    lastSeen: new Date(),
    laboratoryId: 'lab-sistemas',
  },
  {
    id: 'pc-12',
    name: 'SYS-12',
    ip: '192.168.1.112',
    status: 'online',
    user: 'user11',
    lastSeen: new Date(),
    laboratoryId: 'lab-sistemas',
  },

  // ========== LAB REDES ==========
  {
    id: 'pc-redes-01',
    name: 'RED-01',
    ip: '192.168.2.101',
    status: 'online',
    user: 'luis.net',
    lastSeen: new Date(),
    laboratoryId: 'lab-redes',
  },
  {
    id: 'pc-redes-02',
    name: 'RED-02',
    ip: '192.168.2.102',
    status: 'online',
    user: null,
    lastSeen: new Date(),
    laboratoryId: 'lab-redes',
  },
  {
    id: 'pc-redes-03',
    name: 'RED-03',
    ip: '192.168.2.103',
    status: 'offline',
    user: null,
    lastSeen: new Date(Date.now() - 3600000),
    laboratoryId: 'lab-redes',
  },
  {
    id: 'pc-redes-04',
    name: 'RED-04',
    ip: '192.168.2.104',
    status: 'inUse',
    user: 'cisco.admin',
    lastSeen: new Date(),
    laboratoryId: 'lab-redes',
  },

  // ========== LAB DISEÑO ==========
  {
    id: 'pc-diseno-01',
    name: 'DIS-01',
    ip: '192.168.3.101',
    status: 'online',
    user: 'artista1',
    lastSeen: new Date(),
    laboratoryId: 'lab-diseno',
  },
  {
    id: 'pc-diseno-02',
    name: 'DIS-02',
    ip: '192.168.3.102',
    status: 'online',
    user: null,
    lastSeen: new Date(),
    laboratoryId: 'lab-diseno',
  },
  {
    id: 'pc-diseno-03',
    name: 'DIS-03',
    ip: '192.168.3.103',
    status: 'inUse',
    user: 'designer.pro',
    lastSeen: new Date(),
    laboratoryId: 'lab-diseno',
  },

  // ========== LAB FINANZAS ==========
  {
    id: 'pc-finanzas-01',
    name: 'FIN-01',
    ip: '192.168.4.101',
    status: 'online',
    user: 'trader1',
    lastSeen: new Date(),
    laboratoryId: 'lab-finanzas',
  },
  {
    id: 'pc-finanzas-02',
    name: 'FIN-02',
    ip: '192.168.4.102',
    status: 'offline',
    user: null,
    lastSeen: new Date(Date.now() - 7200000),
    laboratoryId: 'lab-finanzas',
  },
  {
    id: 'pc-finanzas-03',
    name: 'FIN-03',
    ip: '192.168.4.103',
    status: 'online',
    user: null,
    lastSeen: new Date(),
    laboratoryId: 'lab-finanzas',
  },

  // ========== LAB DESARROLLO ==========
  {
    id: 'pc-dev-01',
    name: 'DEV-01',
    ip: '192.168.5.101',
    status: 'offline',
    user: null,
    lastSeen: new Date(Date.now() - 86400000),
    laboratoryId: 'lab-desarrollo',
  },
  {
    id: 'pc-dev-02',
    name: 'DEV-02',
    ip: '192.168.5.102',
    status: 'offline',
    user: null,
    lastSeen: new Date(Date.now() - 86400000),
    laboratoryId: 'lab-desarrollo',
  },
  {
    id: 'pc-dev-03',
    name: 'DEV-03',
    ip: '192.168.5.103',
    status: 'offline',
    user: null,
    lastSeen: new Date(Date.now() - 86400000),
    laboratoryId: 'lab-desarrollo',
  },

  // ========== LAB CIENCIAS ==========
  {
    id: 'pc-ciencias-01',
    name: 'SCI-01',
    ip: '192.168.6.101',
    status: 'online',
    user: 'physicist1',
    lastSeen: new Date(),
    laboratoryId: 'lab-ciencias',
  },
  {
    id: 'pc-ciencias-02',
    name: 'SCI-02',
    ip: '192.168.6.102',
    status: 'online',
    user: null,
    lastSeen: new Date(),
    laboratoryId: 'lab-ciencias',
  },
  {
    id: 'pc-ciencias-03',
    name: 'SCI-03',
    ip: '192.168.6.103',
    status: 'inUse',
    user: 'lab.assistant',
    lastSeen: new Date(),
    laboratoryId: 'lab-ciencias',
  },
];

/**
 * Logs del sistema (simulados)
 */
export const mockLogs: LogEntry[] = [
  {
    id: 'log-1',
    timestamp: new Date('2025-11-29T10:00:01'),
    source: 'server-main',
    message: 'systemd[1]: Started Session 42 of user root.',
    level: 'info',
  },
  {
    id: 'log-2',
    timestamp: new Date('2025-11-29T10:01:23'),
    source: 'pc-lab-05',
    message: 'sshd[1230]: Accepted password for juan.perez from 192.168.1.50 port 4420',
    level: 'info',
  },
  {
    id: 'log-3',
    timestamp: new Date('2025-11-29T10:01:23'),
    source: 'pc-lab-05',
    message: 'systemd[1]: pam_unix(sshd:session): session opened for user juan.perez',
    level: 'info',
  },
  {
    id: 'log-4',
    timestamp: new Date('2025-11-29T10:02:00'),
    source: 'pc-lab-02',
    message: 'sudo[332]: pam_unix(sudo:auth): authentication failure; logname= uid=0 euid=0 tty=/dev/pts/1 user=root',
    level: 'error',
  },
  {
    id: 'log-5',
    timestamp: new Date('2025-11-29T10:03:15'),
    source: 'server-main',
    message: 'systemd-networkd[231]: enp0s3: Link UP',
    level: 'info',
  },
  {
    id: 'log-6',
    timestamp: new Date('2025-11-29T10:04:30'),
    source: 'pc-lab-08',
    message: 'UFW BLOCK: IN=enp0s3 OUT= MAC=... SRC=192.168.1.102 PROTO=TCP DPT=80',
    level: 'warn',
  },
  {
    id: 'log-7',
    timestamp: new Date('2025-11-29T10:05:00'),
    source: 'server-main',
    message: 'slapd[892]: conn=1002 op=1 SRCH base="ou=users,dc=uninet,dc=com"',
    level: 'info',
  },
];

// ==========================================
// DATOS MOCK - Carreras (Nodos de Infraestructura)
// ==========================================

/**
 * Carreras universitarias para el selector
 * Basado en las 12 carreras del documento TASK_LDAP-USUARIOS.md
 */
export const mockCarreras: Carrera[] = [
  // ========== CIENCIAS ECONÓMICAS ==========
  {
    id: '5001',  // Código LDAP: departmentNumber
    name: 'Administración y Negocios Internacionales',
    faculty: 'ciencias',
    icon: 'Briefcase',
    pcsCount: 35,
    usersCount: 410,
    status: 'online',
    nodeId: 'NODE-ADM-01',
    lastSync: new Date(Date.now() - 150000),
  },
  {
    id: '5002',
    name: 'Contabilidad y Finanzas',
    faculty: 'ciencias',
    icon: 'Receipt',
    pcsCount: 30,
    usersCount: 280,
    status: 'online',
    nodeId: 'NODE-CON-01',
    lastSync: new Date(Date.now() - 60000),
  },
  {
    id: '5003',
    name: 'Derecho y Ciencias Políticas',
    faculty: 'ciencias',
    icon: 'Scale',
    pcsCount: 22,
    usersCount: 195,
    status: 'online',
    nodeId: 'NODE-DER-01',
    lastSync: new Date(Date.now() - 240000),
  },
  {
    id: '5004',
    name: 'Ecoturismo',
    faculty: 'artes',
    icon: 'Mountain',
    pcsCount: 8,
    usersCount: 67,
    status: 'offline',
    nodeId: 'NODE-ECO-01',
    lastSync: new Date(Date.now() - 3600000),
  },

  // ========== EDUCACIÓN (3 carreras) ==========
  {
    id: '5005',
    name: 'Educación Inicial y Especial',
    faculty: 'educacion',
    icon: 'Baby',
    pcsCount: 18,
    usersCount: 156,
    status: 'online',
    nodeId: 'NODE-EDU-01',
    lastSync: new Date(Date.now() - 120000),
  },
  {
    id: '5006',
    name: 'Educación Matemáticas y Computación',
    faculty: 'educacion',
    icon: 'Calculator',
    pcsCount: 22,
    usersCount: 134,
    status: 'online',
    nodeId: 'NODE-EDU-02',
    lastSync: new Date(Date.now() - 150000),
  },
  {
    id: '5007',
    name: 'Educación Primaria e Informática',
    faculty: 'educacion',
    icon: 'GraduationCap',
    pcsCount: 20,
    usersCount: 178,
    status: 'online',
    nodeId: 'NODE-EDU-03',
    lastSync: new Date(Date.now() - 180000),
  },

  // ========== SALUD ==========
  {
    id: '5008',
    name: 'Enfermería',
    faculty: 'salud',
    icon: 'Heart',
    pcsCount: 15,
    usersCount: 178,
    status: 'online',
    nodeId: 'NODE-ENF-01',
    lastSync: new Date(Date.now() - 200000),
  },

  // ========== INGENIERÍA ==========
  {
    id: '5009',
    name: 'Ingeniería Agroindustrial',
    faculty: 'ingenieria',
    icon: 'Factory',
    pcsCount: 20,
    usersCount: 145,
    status: 'online',
    nodeId: 'NODE-AGR-01',
    lastSync: new Date(Date.now() - 180000),
  },
  {
    id: '5010',
    name: 'Ingeniería de Sistemas e Informática',
    faculty: 'ingenieria',
    icon: 'Monitor',
    pcsCount: 45,
    usersCount: 320,
    status: 'online',
    nodeId: 'NODE-ISI-01',
    lastSync: new Date(Date.now() - 120000),
  },
  {
    id: '5011',
    name: 'Ingeniería Forestal y Medio Ambiente',
    faculty: 'ingenieria',
    icon: 'TreePine',
    pcsCount: 18,
    usersCount: 98,
    status: 'partial',
    nodeId: 'NODE-FOR-01',
    lastSync: new Date(Date.now() - 300000),
  },

  // ========== SALUD ==========
  {
    id: '5012',
    name: 'Medicina Veterinaria y Zootecnia',
    faculty: 'salud',
    icon: 'Stethoscope',
    pcsCount: 12,
    usersCount: 89,
    status: 'partial',
    nodeId: 'NODE-VET-01',
    lastSync: new Date(Date.now() - 600000),
  },
];

/**
 * Colores por facultad para el selector de carreras
 */
export const FACULTY_COLORS: Record<string, string> = {
  ingenieria: '#0070f3',  // Azul Vercel
  educacion: '#f59e0b',   // Amber/Naranja
  ciencias: '#06b6d4',    // Cyan
  salud: '#10b981',       // Verde
  artes: '#ec4899',       // Rosa/Magenta
};

/**
 * Labels de facultades para mostrar en UI
 */
export const FACULTY_LABELS: Record<string, string> = {
  ingenieria: 'Ingeniería',
  educacion: 'Educación',
  ciencias: 'Ciencias',
  salud: 'Salud',
  artes: 'Artes',
};
