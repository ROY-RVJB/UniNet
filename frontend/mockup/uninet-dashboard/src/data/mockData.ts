import type { PC, LogEntry, LDAPUser, PCStatus } from '@/types';

// ==========================================
// DATOS MOCK - UniNet Admin
// ==========================================

/**
 * Genera estado aleatorio para las PCs (80% online)
 */
const getRandomStatus = (): PCStatus => {
  const rand = Math.random();
  if (rand > 0.8) return 'offline';
  if (rand > 0.5) return 'online';
  if (rand > 0.3) return 'inUse';
  return 'examMode';
};

/**
 * Usuarios disponibles para asignar a PCs
 */
const availableUsers = [
  'juan.perez',
  'maria.gomez',
  'carlos.ruiz',
  'ana.lopez',
  'pedro.martinez',
  null, // Sin usuario
];

/**
 * 12 PCs del laboratorio (simuladas)
 */
export const mockPCs: PC[] = Array.from({ length: 12 }, (_, i) => {
  const num = (i + 1).toString().padStart(2, '0');
  const status = getRandomStatus();
  const user = status === 'offline' ? null : availableUsers[Math.floor(Math.random() * availableUsers.length)];

  return {
    id: `pc-${num}`,
    name: `PC-LAB-${num}`,
    ip: `192.168.1.${100 + i + 1}`,
    status,
    user,
    lastSeen: new Date(Date.now() - Math.random() * 3600000), // Última vez visto en la última hora
  };
});

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
