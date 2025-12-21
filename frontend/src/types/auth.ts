// ==========================================
// TIPOS TYPESCRIPT - Autenticación UniNet
// ==========================================

/**
 * Roles de usuario en el sistema
 */
export type UserRole = 'admin' | 'docente';

/**
 * Usuario autenticado
 */
export interface AuthUser {
  username: string;
  role: UserRole;
  carrera_id: string | null; // Solo para docentes
}

/**
 * Respuesta del endpoint /api/auth/login
 */
export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

/**
 * Credenciales para login
 */
export interface LoginCredentials {
  username: string;
  password: string;
  carrera_id?: string; // Solo requerido para docentes
}

/**
 * Estado del contexto de autenticación
 */
export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

/**
 * Acciones del contexto de autenticación
 */
export interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}
