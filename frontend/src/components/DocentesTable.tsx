import { useState, useMemo, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Plus, Pencil, Trash2, RefreshCw, Search, GraduationCap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CreateDocenteModal } from '@/components/CreateDocenteModal'
import { ConfirmModal } from '@/components/ConfirmModal'
import { useToast } from '@/contexts/ToastContext'

// ==========================================
// DocentesTable - Gestión de Docentes del Sistema
// Solo visible para Admin
// ==========================================

export interface DocenteSistema {
  id: string
  username: string
  full_name: string | null
  email: string | null
  carreras: { id: string; nombre: string }[]
  created_at: string
  active: boolean
}

export interface DocenteFormData {
  username: string
  full_name: string
  email: string
  password: string
  carreras: string[] // IDs de carreras
}

// Generar iniciales del nombre
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Generar color consistente basado en string
function getAvatarColor(name: string): string {
  const colors = [
    'bg-amber-900/50',
    'bg-teal-900/50',
    'bg-blue-900/50',
    'bg-purple-900/50',
  ]
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[index % colors.length]
}

// Componente Badge "+N más" con tooltip
function CarrerasBadgeWithTooltip({
  count,
  carreras
}: {
  count: number
  carreras: { id: string; nombre: string }[]
}) {
  const [isHovered, setIsHovered] = useState(false)
  const triggerRef = useRef<HTMLSpanElement>(null)

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="px-2 py-0.5 text-xs rounded-full bg-white/5 text-white/50 border border-white/10 cursor-default hover:bg-white/10 hover:text-white/70 transition-colors"
      >
        +{count} más
      </span>
      <CarrerasTooltip
        carreras={carreras}
        triggerRef={triggerRef}
        isVisible={isHovered}
      />
    </>
  )
}

// Componente Tooltip con Portal para evitar overflow
function CarrerasTooltip({
  carreras,
  triggerRef,
  isVisible
}: {
  carreras: { id: string; nombre: string }[]
  triggerRef: React.RefObject<HTMLSpanElement | null>
  isVisible: boolean
}) {
  const [position, setPosition] = useState({ top: 0, left: 0 })

  useEffect(() => {
    if (isVisible && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const tooltipWidth = 220
      const viewportWidth = window.innerWidth

      // Calcular posición - preferir derecha, si no cabe ir a izquierda
      let left = rect.right + 8
      if (left + tooltipWidth > viewportWidth - 20) {
        left = rect.left - tooltipWidth - 8
      }

      setPosition({
        top: rect.top + rect.height / 2,
        left: left
      })
    }
  }, [isVisible, triggerRef])

  if (!isVisible) return null

  return createPortal(
    <div
      className="fixed z-[9999] -translate-y-1/2"
      style={{ top: position.top, left: position.left }}
    >
      <div className="bg-zinc-900 border border-white/10 rounded-lg p-3 shadow-2xl min-w-[200px] max-w-[280px]">
        <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2 pb-1.5 border-b border-white/5">
          Otras carreras
        </p>
        <ul className="flex flex-col gap-1.5">
          {carreras.map((carrera) => (
            <li
              key={carrera.id}
              className="flex items-start gap-2 text-xs text-white/70"
            >
              <span className="text-amber-400/60 mt-0.5">›</span>
              <span>{carrera.nombre}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>,
    document.body
  )
}

interface DocentesTableProps {
  docentes: DocenteSistema[]
  onRefresh: () => void
  onCreate: (data: DocenteFormData) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function DocentesTable({ docentes, onRefresh, onCreate, onDelete }: DocentesTableProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [docenteToDelete, setDocenteToDelete] = useState<DocenteSistema | null>(null)
  const { showToast, hideToast } = useToast()

  // Filtrar docentes por búsqueda
  const filteredDocentes = useMemo(() => {
    if (!searchQuery.trim()) return docentes

    const query = searchQuery.toLowerCase()
    return docentes.filter(docente =>
      docente.username.toLowerCase().includes(query) ||
      (docente.full_name?.toLowerCase().includes(query) ?? false) ||
      (docente.email?.toLowerCase().includes(query) ?? false) ||
      docente.carreras.some(c => c.nombre.toLowerCase().includes(query))
    )
  }, [docentes, searchQuery])

  const handleCreateDocente = async (data: DocenteFormData) => {
    const loadingId = showToast('loading', 'Creando docente...')

    try {
      await onCreate(data)
      hideToast(loadingId)
      showToast('success', `Docente ${data.username} creado exitosamente`)
      setIsCreateModalOpen(false)
      onRefresh()
    } catch (error) {
      hideToast(loadingId)
      showToast('error', error instanceof Error ? error.message : 'Error al crear docente')
      throw error
    }
  }

  const handleDeleteClick = (docente: DocenteSistema) => {
    setDocenteToDelete(docente)
  }

  const handleConfirmDelete = async () => {
    if (!docenteToDelete) return

    const loadingId = showToast('loading', 'Eliminando docente...')

    try {
      await onDelete(docenteToDelete.id)
      hideToast(loadingId)
      showToast('success', `Docente ${docenteToDelete.username} eliminado`)
      onRefresh()
    } catch (error) {
      hideToast(loadingId)
      showToast('error', error instanceof Error ? error.message : 'Error al eliminar docente')
      throw error
    }
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-white">Docentes del Sistema</h2>
            <span className="text-sm text-white/40">
              {docentes.length} {docentes.length === 1 ? 'docente' : 'docentes'}
            </span>
          </div>

          {/* Acciones header */}
          <div className="flex items-center gap-3">
            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar..."
                className={cn(
                  'w-48 pl-9 pr-3 py-1.5 text-sm',
                  'bg-transparent border border-white/10 rounded-lg',
                  'text-white placeholder:text-white/30',
                  'focus:outline-none focus:border-white/30',
                  'transition-colors'
                )}
              />
            </div>

            <button
              onClick={onRefresh}
              className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
              title="Actualizar lista"
            >
              <RefreshCw className="h-4 w-4" />
            </button>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-white/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Nuevo Docente
            </button>
          </div>
        </div>

        {/* Tabla */}
        <div className="border border-white/10 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                  Docente
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                  Carreras Asignadas
                </th>
                <th className="px-4 py-3 w-24" />
              </tr>
            </thead>

            <tbody>
              {filteredDocentes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <GraduationCap className="w-8 h-8 text-white/20" />
                      <p className="text-white/30 text-sm">
                        {searchQuery.trim()
                          ? `Sin resultados para "${searchQuery}"`
                          : 'No hay docentes registrados'
                        }
                      </p>
                      {!searchQuery.trim() && (
                        <button
                          onClick={() => setIsCreateModalOpen(true)}
                          className="text-sm text-white/50 hover:text-white transition-colors"
                        >
                          Crear primer docente
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDocentes.map((docente) => (
                  <tr
                    key={docente.id}
                    className="group border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Docente con avatar */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white/70',
                          getAvatarColor(docente.full_name || docente.username)
                        )}>
                          {getInitials(docente.full_name || docente.username)}
                        </div>
                        <div>
                          <span className="block text-sm text-white">
                            {docente.full_name}
                          </span>
                          <span className="block text-xs text-white/40 font-mono">
                            {docente.username}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-4 py-4">
                      <span className="text-sm text-white/70">
                        {docente.email || '—'}
                      </span>
                    </td>

                    {/* Carreras */}
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1.5 items-center">
                        {docente.carreras.length === 0 ? (
                          <span className="text-sm text-white/30">Sin carreras</span>
                        ) : (
                          <>
                            {/* Mostrar máximo 3 carreras */}
                            {docente.carreras.slice(0, 3).map((carrera) => (
                              <span
                                key={carrera.id}
                                className="px-2 py-0.5 text-xs rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              >
                                {carrera.nombre.length > 20
                                  ? carrera.nombre.slice(0, 20) + '...'
                                  : carrera.nombre
                                }
                              </span>
                            ))}
                            {/* Badge "+N más" con tooltip usando Portal */}
                            {docente.carreras.length > 3 && (
                              <CarrerasBadgeWithTooltip
                                count={docente.carreras.length - 3}
                                carreras={docente.carreras.slice(3)}
                              />
                            )}
                          </>
                        )}
                      </div>
                    </td>

                    {/* Acciones */}
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {/* TODO: Edit modal */}}
                          className="p-1.5 rounded text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                          title="Editar"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(docente)}
                          className="p-1.5 rounded text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear Docente */}
      <CreateDocenteModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateDocente}
      />

      {/* Modal Confirmar Eliminación */}
      <ConfirmModal
        isOpen={!!docenteToDelete}
        onClose={() => setDocenteToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Eliminar docente"
        message={`¿Eliminar a ${docenteToDelete?.full_name || docenteToDelete?.username}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </>
  )
}
