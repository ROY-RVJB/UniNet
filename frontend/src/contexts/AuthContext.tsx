import * as React from "react"
import type {
  AuthContextValue,
  AuthUser,
  LoginCredentials
} from "@/types/auth"

// Respuesta real del backend (sin user)
interface BackendLoginResponse {
  access_token: string
  token_type: string
}

// Respuesta de /api/auth/me
interface BackendUserResponse {
  username: string
  email: string | null
  full_name: string | null
  disabled: boolean | null
}

const API_BASE = "http://172.29.137.160:4000"
const TOKEN_KEY = "uninet_token"
const USER_KEY = "uninet_user"

// MODO MOCK: Simular login sin backend
const USE_MOCK = true
const MOCK_USERS = [
  { username: "administrador", password: "admin123", role: "admin" as const, carrera_id: null },
  { username: "docente", password: "docente123", role: "docente" as const, carrera_id: "sistemas" },
]

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null)
  const [token, setToken] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  // Cargar sesión desde localStorage al iniciar
  React.useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY)
    const savedUser = localStorage.getItem(USER_KEY)

    if (savedToken && savedUser) {
      try {
        setToken(savedToken)
        setUser(JSON.parse(savedUser))
      } catch {
        // Token inválido, limpiar
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
      }
    }
    setIsLoading(false)
  }, [])

  const login = React.useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true)

    try {
      // MODO MOCK
      if (USE_MOCK) {
        await new Promise(resolve => setTimeout(resolve, 500)) // Simular delay

        const mockUser = MOCK_USERS.find(
          u => u.username === credentials.username && u.password === credentials.password
        )

        if (!mockUser) {
          throw new Error("Usuario o contraseña incorrectos")
        }

        // Para docentes, usar la carrera seleccionada en el login
        const carreraId = mockUser.role === 'docente'
          ? credentials.carrera_id || null
          : null

        const authUser: AuthUser = {
          username: mockUser.username,
          role: mockUser.role,
          carrera_id: carreraId,
        }

        const mockToken = `mock_token_${Date.now()}`
        localStorage.setItem(TOKEN_KEY, mockToken)
        localStorage.setItem(USER_KEY, JSON.stringify(authUser))

        setToken(mockToken)
        setUser(authUser)
        return
      }

      // MODO REAL (cuando backend esté listo)
      const formData = new URLSearchParams()
      formData.append("username", credentials.username)
      formData.append("password", credentials.password)

      const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      })

      if (!loginResponse.ok) {
        const error = await loginResponse.json().catch(() => ({}))
        throw new Error(error.detail || "Credenciales invalidas")
      }

      const loginData: BackendLoginResponse = await loginResponse.json()

      const meResponse = await fetch(`${API_BASE}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${loginData.access_token}`,
        },
      })

      if (!meResponse.ok) {
        throw new Error("Error al obtener datos del usuario")
      }

      const userData: BackendUserResponse = await meResponse.json()

      const authUser: AuthUser = {
        username: userData.username,
        role: "admin",
        carrera_id: null,
      }

      localStorage.setItem(TOKEN_KEY, loginData.access_token)
      localStorage.setItem(USER_KEY, JSON.stringify(authUser))

      setToken(loginData.access_token)
      setUser(authUser)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = React.useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }, [])

  const checkAuth = React.useCallback(async () => {
    const savedToken = localStorage.getItem(TOKEN_KEY)

    if (!savedToken) {
      setUser(null)
      setToken(null)
      return
    }

    try {
      const response = await fetch(`${API_BASE}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${savedToken}`,
        },
      })

      if (!response.ok) {
        throw new Error("Token invalido")
      }

      const userData: BackendUserResponse = await response.json()

      // Construir AuthUser
      const authUser: AuthUser = {
        username: userData.username,
        role: "admin", // TODO: Obtener del backend
        carrera_id: null,
      }

      setUser(authUser)
      setToken(savedToken)
      localStorage.setItem(USER_KEY, JSON.stringify(authUser))
    } catch {
      // Token inválido, limpiar sesión
      logout()
    }
  }, [logout])

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: !!user && !!token,
      isLoading,
      login,
      logout,
      checkAuth,
    }),
    [user, token, isLoading, login, logout, checkAuth]
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
