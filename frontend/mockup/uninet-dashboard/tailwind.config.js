/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Colores principales del diseño Gemini
        background: '#000000',    // Fondo absoluto negro
        surface: '#111111',       // Tarjetas/Paneles
        border: '#333333',        // Bordes sutiles
        subtle: '#888888',        // Texto secundario

        // Sistema de colores tech (compatible con skill)
        tech: {
          blue: '#0070f3',        // Azul Vercel (accent principal)
          blueDim: '#0051cc',     // Hover del azul
          dark: '#000000',        // Background
          darkCard: '#111111',    // Cards (igual que surface)
          darkBorder: '#333333',  // Borders
          text: '#ffffff',        // Texto principal
          textDim: '#888888',     // Texto secundario
          hoverState: '#1a1a1a',  // Estado hover
        },

        // Status indicators (mantener tus colores)
        status: {
          online: '#10b981',      // Verde success
          offline: '#ef4444',     // Rojo error
          inUse: '#f5a623',       // Naranja warning (actualizado)
          examMode: '#0070f3',    // Azul Vercel
        },

        // Colores shadcn/ui (mantener compatibilidad)
        primary: {
          DEFAULT: '#ffffff',     // Blanco (texto principal)
          foreground: '#000000',  // Negro (texto sobre blanco)
        },
        secondary: {
          DEFAULT: '#111111',
          foreground: '#ffffff',
        },
        muted: {
          DEFAULT: '#1a1a1a',
          foreground: '#888888',
        },
        accent: {
          DEFAULT: '#0070f3',
          foreground: '#ffffff',
        },
        destructive: {
          DEFAULT: '#ef4444',
          foreground: '#ffffff',
        },

        // Variables CSS de shadcn
        card: {
          DEFAULT: '#111111',
          foreground: '#ffffff',
        },
        popover: {
          DEFAULT: '#111111',
          foreground: '#ffffff',
        },
        input: '#1a1a1a',
        ring: '#0070f3',

        // Charts (para gráficos futuros)
        chart: {
          '1': '#0070f3',
          '2': '#10b981',
          '3': '#f5a623',
          '4': '#ef4444',
          '5': '#3b82f6',
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
}
