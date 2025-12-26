// ==========================================
// TIPOS TYPESCRIPT - Autenticación UniNet
// ==========================================

/**
 * Roles de usuario en el sistema
 */
export type UserRole = 'admin' | 'docente';

/**
 * Carrera asignada a un docente
 */
export interface CarreraAsignada {
  id: string;
  nombre: string;
}

/**
 * Usuario autenticado
 */
export interface AuthUser {
  username: string;
  role: UserRole;
  carreras: CarreraAsignada[]; // Carreras asignadas (vacío para admin)
  carrera_activa: CarreraAsignada | null; // Carrera seleccionada actualmente
}

/**
 * Respuesta del endpoint /api/auth/login
 */
export interface LoginResponse {
  access_token: string;
  token_type: string;
}

/**
 * Respuesta del endpoint /api/auth/me
 */
export interface MeResponse {
  username: string;
  email: string | null;
  full_name: string | null;
  role: UserRole;
  carreras: CarreraAsignada[];
}

/**
 * Credenciales para login
 */
export interface LoginCredentials {
  username: string;
  password: string;
}

/**
 * Estado del contexto de autenticación
 */
export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  needsCarreraSelection: boolean; // True si docente debe elegir carrera
}

/**
 * Acciones del contexto de autenticación
 */
export interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  selectCarrera: (carrera: CarreraAsignada) => void;
}
