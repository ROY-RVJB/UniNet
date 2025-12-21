import { Outlet } from 'react-router-dom'
import { Navbar } from '@/components/Navbar'

export function MainLayout() {
  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Navbar */}
      <Navbar />

      {/* Main Content - Outlet renderiza la pagina actual */}
      <main className="px-6 py-8 flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-tech-darkBorder py-6 px-6">
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-6 text-sm text-tech-textDim">
            <a href="#" className="hover:text-white transition-colors">Documentacion</a>
            <a href="#" className="hover:text-white transition-colors">Soporte</a>
            <a href="#" className="hover:text-white transition-colors">Terminos</a>
          </div>
          <p className="text-xs text-tech-textDim">
            UniNet v3.0.1 - UNAMAD
          </p>
        </div>
      </footer>
    </div>
  )
}
