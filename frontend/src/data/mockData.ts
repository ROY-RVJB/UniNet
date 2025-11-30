import type { PC, LogEntry, LDAPUser } from '@/types';

// ==========================================
// DATOS MOCK - Solo las 3 PCs + Servidor
// ==========================================

/**
 * Solo las 3 PCs del laboratorio
 * El estado real vendrá del backend Python que hace ping
 */
export const mockPCs: PC[] = [
  {
    id: 'pc-01',
    name: 'PC-LAB-01',
    ip: '172.29.2.37',
    status: 'offline',
    user: null,
    lastSeen: new Date(0),
  },
  {
    id: 'pc-02',
    name: 'PC-LAB-02',
    ip: '172.29.157.94',
    status: 'offline',
    user: null,
    lastSeen: new Date(0),
  },
  {
    id: 'pc-03',
    name: 'PC-LAB-03',
    ip: '172.29.177.20',
    status: 'offline',
    user: null,
    lastSeen: new Date(0),
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

/**
 * Usuarios LDAP (simulados)
 */
export const mockUsers: LDAPUser[] = [
  {
    uid: 1001,
    cn: 'juan.perez',
    homeDir: '/home/juan.perez',
    gid: 5000,
    group: 'alumnos',
    status: 'active',
  },
  {
    uid: 1002,
    cn: 'maria.gomez',
    homeDir: '/home/maria.gomez',
    gid: 5000,
    group: 'alumnos',
    status: 'active',
  },
  {
    uid: 1003,
    cn: 'prof.sistemas',
    homeDir: '/home/prof.sistemas',
    gid: 6000,
    group: 'docentes',
    status: 'active',
  },
  {
    uid: 1004,
    cn: 'carlos.ruiz',
    homeDir: '/home/carlos.ruiz',
    gid: 5000,
    group: 'alumnos',
    status: 'active',
  },
  {
    uid: 1005,
    cn: 'ana.lopez',
    homeDir: '/home/ana.lopez',
    gid: 5000,
    group: 'alumnos',
    status: 'inactive',
  },
];
