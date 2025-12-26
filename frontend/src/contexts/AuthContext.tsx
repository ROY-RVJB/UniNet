import * as React from "react"
import type {
  AuthContextValue,
  AuthUser,
  LoginCredentials,
  MeResponse,
  CarreraAsignada
} from "@/types/auth"

// ==========================================
// AuthContext - Autenticación UniNet
// Backend determina rol y carreras
// ==========================================

// Respuesta del endpoint /api/auth/login
// Soporta dos formatos:
// - Básico: solo token (requiere segunda petición a /me)
// - Extendido: token + datos de usuario (más rápido)
interface BackendLoginResponse {
  access_token: string
  token_type: string
  // Opcional: datos del usuario incluidos en login (evita segunda petición)
  user?: {
    username: string
    role?: "admin" | "docente"
    carreras?: Array<{ id: string; nombre: string }>
  }
}

const API_BASE = import.meta.env.VITE_API_URL || "http://10.12.195.223:4000"
const TOKEN_KEY = "uninet_token"
const USER_KEY = "uninet_user"

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null)
  const [token, setToken] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [needsCarreraSelection, setNeedsCarreraSelection] = React.useState(false)

  // Cargar sesión desde localStorage al iniciar
  React.useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY)
    const savedUser = localStorage.getItem(USER_KEY)

    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser) as AuthUser
        setToken(savedToken)
        setUser(parsedUser)

        // Si es docente sin carrera activa, necesita seleccionar
        if (parsedUser.role === 'docente' && !parsedUser.carrera_activa && parsedUser.carreras.length > 0) {
          setNeedsCarreraSelection(true)
        }
      } catch {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
      }
    }
    setIsLoading(false)
  }, [])

  const login = React.useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true)

    try {
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
        throw new Error(error.detail || "Credenciales inválidas")
      }

      const loginData: BackendLoginResponse = await loginResponse.json()

      let authUser: AuthUser

      // Si el backend incluye datos del usuario en la respuesta del login, usarlos directamente
      // Esto evita una segunda petición y acelera el login
      if (loginData.user) {
        authUser = {
          username: loginData.user.username,
          role: loginData.user.role || "admin",
          carreras: loginData.user.carreras || [],
          carrera_activa: loginData.user.carreras?.length === 1 ? loginData.user.carreras[0] : null
        }
      } else {
        // Fallback: obtener datos del usuario con petición separada
        const meResponse = await fetch(`${API_BASE}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${loginData.access_token}`,
          },
        })

        if (!meResponse.ok) {
          throw new Error("Error al obtener datos del usuario")
        }

        const userData: MeResponse = await meResponse.json()

        authUser = {
          username: userData.username,
          role: userData.role || "admin",
          carreras: userData.carreras || [],
          carrera_activa: userData.carreras?.length === 1 ? userData.carreras[0] : null
        }
      }

      localStorage.setItem(TOKEN_KEY, loginData.access_token)
      localStorage.setItem(USER_KEY, JSON.stringify(authUser))

      setToken(loginData.access_token)
      setUser(authUser)

      // Si es docente con múltiples carreras, necesita seleccionar
      if (authUser.role === 'docente' && authUser.carreras.length > 1) {
        setNeedsCarreraSelection(true)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = React.useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
    setNeedsCarreraSelection(false)
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
        throw new Error("Token inválido")
      }

      const userData: MeResponse = await response.json()

      const authUser: AuthUser = {
        username: userData.username,
        role: userData.role || "admin",
        carreras: userData.carreras || [],
        carrera_activa: user?.carrera_activa || (userData.carreras?.length === 1 ? userData.carreras[0] : null)
      }

      setUser(authUser)
      setToken(savedToken)
      localStorage.setItem(USER_KEY, JSON.stringify(authUser))
    } catch {
      logout()
    }
  }, [logout, user?.carrera_activa])

  const selectCarrera = React.useCallback((carrera: CarreraAsignada) => {
    if (!user) return

    const updatedUser: AuthUser = {
      ...user,
      carrera_activa: carrera
    }

    setUser(updatedUser)
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser))
    setNeedsCarreraSelection(false)
  }, [user])

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: !!user && !!token,
      isLoading,
      needsCarreraSelection,
      login,
      logout,
      checkAuth,
      selectCarrera,
    }),
    [user, token, isLoading, needsCarreraSelection, login, logout, checkAuth, selectCarrera]
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
