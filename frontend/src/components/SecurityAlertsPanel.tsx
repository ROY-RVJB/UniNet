import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Info, AlertCircle, Skull, ChevronDown, ChevronUp, Check, Monitor, Ban, UserX, AlertOctagon, X as XIcon, ExternalLink, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SecurityAlert, AlertSeverity } from '@/types';

// Configuración visual por severidad
const severityConfig: Record<AlertSeverity, {
  icon: React.ElementType;
  color: string;
  bgColor: string;
  label: string;
  borderColor: string;
}> = {
  critical: {
    icon: Skull,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    label: 'CRÍTICA',
  },
  high: {
    icon: AlertTriangle,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    label: 'ALTA',
  },
  medium: {
    icon: AlertCircle,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    label: 'MEDIA',
  },
  low: {
    icon: Info,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    label: 'BAJA',
  },
  info: {
    icon: Info,
    color: 'text-gray-500',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/30',
    label: 'INFO',
  },
};

interface SecurityAlertsPanelProps {
  className?: string;
  onPCClick?: (pcId: string) => void; // Callback para abrir el detalle de la PC
}

export function SecurityAlertsPanel({ className, onPCClick }: SecurityAlertsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    action: 'quarantine' | 'kick' | 'block' | null;
    alert: SecurityAlert | null;
  }>({ show: false, action: null, alert: null });
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  
  // Obtener alertas reales del backend
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL;
    if (!apiUrl) {
      console.warn('⚠️  VITE_API_URL no configurado');
      return;
    }

    const fetchAlerts = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/monitoring/security/alerts?limit=50`);
        if (!res.ok) {
          console.error(`Error fetching alerts: ${res.status} ${res.statusText}`);
          setAlerts([]);
          return;
        }
        
        const data: SecurityAlert[] = await res.json();
        
        // Convertir timestamps a Date objects
        const alertsWithDates = data.map(alert => ({
          ...alert,
          timestamp: new Date(alert.timestamp)
        }));
        
        setAlerts(alertsWithDates);
        
        if (alertsWithDates.length > 0) {
          console.log(`✅ ${alertsWithDates.length} alertas de seguridad cargadas`);
        }
      } catch (err) {
        console.error('Error fetching security alerts:', err);
        setAlerts([]);
      }
    };

    fetchAlerts();
    // Actualizar alertas cada 10 segundos
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  // Filtrar por estado
  const activeAlerts = alerts.filter(a => !a.acknowledged);
  const resolvedAlerts = alerts.filter(a => a.acknowledged);
  const criticalCount = activeAlerts.filter(a => a.severity === 'critical').length;
  const highCount = activeAlerts.filter(a => a.severity === 'high').length;

  // Marcar alerta como revisada (desde la web)
  const handleAcknowledge = async (alertId: string) => {
    const apiUrl = import.meta.env.VITE_API_URL;
    
    // Actualizar UI inmediatamente
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
    
    // Enviar al backend
    if (apiUrl) {
      try {
        await fetch(`${apiUrl}/api/monitoring/security/alerts/${alertId}/acknowledge`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (err) {
        console.error('Error acknowledging alert:', err);
      }
    }
  };

  // Acciones de remediación
  const handleRemediationAction = (action: 'quarantine' | 'kick' | 'block', alert: SecurityAlert) => {
    setConfirmModal({ show: true, action, alert });
  };

  const executeRemediationAction = async () => {
    if (!confirmModal.alert || !confirmModal.action) return;

    const { alert, action } = confirmModal;
    setProcessingAction(alert.id);

    const apiUrl = import.meta.env.VITE_API_URL;
    
    if (apiUrl) {
      try {
        // Enviar acción de remediación al backend
        await fetch(`${apiUrl}/api/monitoring/security/remediation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action,
            hostname: alert.pcId,
            alert_id: alert.id
          })
        });
        
        console.log(`✅ Acción ${action} enviada para ${alert.pcName}`);
      } catch (err) {
        console.error('Error executing remediation:', err);
      }
    }

    // Simular tiempo de ejecución
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Marcar como revisada después de tomar acción
    handleAcknowledge(alert.id);
    setProcessingAction(null);
    setConfirmModal({ show: false, action: null, alert: null });
  };

  return (
    <div className={cn("bg-black border border-border rounded-lg overflow-hidden", className)}>
      {/* Header */}
      <div 
        className="flex items-center justify-between p-3 border-b border-border/50 cursor-pointer hover:bg-white/5 transition-colors group"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-red-500/10 rounded-lg border border-red-500/20">
            <Shield className="w-4 h-4 text-red-400" />
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white">
              Alertas de Seguridad
            </h2>
            <div className="flex items-center gap-1.5">
              {activeAlerts.length > 0 && (
                <span className="text-[10px] px-2 py-0.5 bg-red-500/20 text-red-400 rounded-md font-bold">
                  {activeAlerts.length}
                </span>
              )}
              {criticalCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 bg-red-600/20 text-red-400 rounded-md font-medium">
                  {criticalCount} crítica{criticalCount !== 1 ? 's' : ''}
                </span>
              )}
              {highCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 bg-orange-600/20 text-orange-400 rounded-md font-medium">
                  {highCount} alta{highCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </div>
        <button className="text-gray-500 group-hover:text-gray-300 transition-colors">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="max-h-96 overflow-y-auto scrollbar-thin">
          {alerts.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No hay alertas de seguridad</p>
              <p className="text-xs mt-1">El sistema está monitoreando...</p>
            </div>
          ) : (
            <>
              {/* Sección: Alertas Activas */}
              {activeAlerts.length > 0 && (
                <div className="p-4 border-b border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                      Alertas Activas ({activeAlerts.length})
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {activeAlerts.map((alert) => (
                      <AlertCard 
                        key={alert.id} 
                        alert={alert} 
                        onAcknowledge={handleAcknowledge}
                        onRemediationAction={handleRemediationAction}
                        onPCClick={onPCClick}
                        isProcessing={processingAction === alert.id}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Sección: Alertas Revisadas */}
              {resolvedAlerts.length > 0 && (
                <div className="p-4 bg-white/5">
                  <div className="flex items-center gap-2 mb-3">
                    <Check className="w-4 h-4 text-green-500" />
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                      Revisadas ({resolvedAlerts.length})
                    </h3>
                    <span className="text-xs text-gray-500 ml-auto">
                      Ya fueron atendidas por el administrador
                    </span>
                  </div>
                  <div className="space-y-2 opacity-60">
                    {resolvedAlerts.slice(0, 3).map((alert) => (
                      <AlertCard 
                        key={alert.id} 
                        alert={alert} 
                        onAcknowledge={handleAcknowledge}
                        compact
                      />
                    ))}
                    {resolvedAlerts.length > 3 && (
                      <p className="text-xs text-center text-gray-500 pt-2">
                        +{resolvedAlerts.length - 3} alertas más revisadas
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Modal de Confirmación */}
      {confirmModal.show && confirmModal.alert && (
        <RemediationConfirmModal
          alert={confirmModal.alert}
          action={confirmModal.action!}
          onConfirm={executeRemediationAction}
          onCancel={() => setConfirmModal({ show: false, action: null, alert: null })}
        />
      )}
    </div>
  );
}

// Componente individual de alerta mejorado
interface AlertCardProps {
  alert: SecurityAlert;
  onAcknowledge: (id: string) => void;
  onRemediationAction?: (action: 'quarantine' | 'kick' | 'block', alert: SecurityAlert) => void;
  onPCClick?: (pcId: string) => void;
  isProcessing?: boolean;
  compact?: boolean;
}

function AlertCard({ alert, onAcknowledge, onRemediationAction, onPCClick, isProcessing = false, compact = false }: AlertCardProps) {
  const config = severityConfig[alert.severity];

  return (
    <div
      className={cn(
        "relative bg-black/40 backdrop-blur-sm rounded-xl overflow-hidden transition-all duration-300",
        "border shadow-lg",
        alert.acknowledged 
          ? 'opacity-50 grayscale border-gray-800/50' 
          : cn(
              "hover:shadow-xl",
              alert.severity === 'critical' && "border-red-900/50 hover:border-red-800/60",
              alert.severity === 'high' && "border-orange-900/50 hover:border-orange-800/60",
              alert.severity === 'medium' && "border-yellow-900/50 hover:border-yellow-800/60",
              alert.severity === 'low' && "border-blue-900/50 hover:border-blue-800/60",
              alert.severity === 'info' && "border-gray-800/50 hover:border-gray-700/60",
            ),
      )}
    >
      <div className="p-4 flex gap-4">
        {/* LADO IZQUIERDO - ICONO COMPACTO */}
        <div className="flex-shrink-0 flex flex-col items-center gap-2 w-28">
          {/* PC Name arriba del icono */}
          {onPCClick ? (
            <button
              onClick={() => onPCClick(alert.pcId)}
              className="group w-full text-center px-2 py-1 text-[10px] font-mono font-bold text-blue-400 hover:text-blue-300 transition-colors bg-blue-950/30 hover:bg-blue-950/50 rounded-md border border-blue-900/40 flex items-center justify-center gap-1"
              title="Ver detalles de la PC"
            >
              <Monitor className="w-2.5 h-2.5" />
              {alert.pcName}
              <ExternalLink className="w-2 h-2 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ) : (
            <div className="w-full text-center px-2 py-1 text-[10px] font-mono font-bold text-blue-400 bg-blue-950/30 rounded-md border border-blue-900/40">
              {alert.pcName}
            </div>
          )}

          {/* Icono de PC */}
          {onPCClick ? (
            <button
              onClick={() => onPCClick(alert.pcId)}
              className={cn(
                "w-32 h-32 rounded-xl flex items-center justify-center relative overflow-hidden",
                "bg-gradient-to-br shadow-xl transition-all duration-300",
                alert.severity === 'critical' && "from-red-950/60 to-red-900/80 shadow-red-900/50",
                alert.severity === 'high' && "from-orange-950/60 to-orange-900/80 shadow-orange-900/50",
                alert.severity === 'medium' && "from-yellow-950/60 to-yellow-900/80 shadow-yellow-900/50",
                alert.severity === 'low' && "from-blue-950/60 to-blue-900/80 shadow-blue-900/50",
                alert.severity === 'info' && "from-gray-950/60 to-gray-800/80 shadow-gray-900/50",
                !alert.acknowledged && "hover:scale-105 cursor-pointer"
              )}
              title="Ver detalles de la PC"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <Monitor className="w-20 h-20 text-white drop-shadow-2xl relative z-10" strokeWidth={1.5} />
            </button>
          ) : (
            <div className={cn(
              "w-32 h-32 rounded-xl flex items-center justify-center relative overflow-hidden",
              "bg-gradient-to-br shadow-xl transition-all duration-300",
              alert.severity === 'critical' && "from-red-950/60 to-red-900/80 shadow-red-900/50",
              alert.severity === 'high' && "from-orange-950/60 to-orange-900/80 shadow-orange-900/50",
              alert.severity === 'medium' && "from-yellow-950/60 to-yellow-900/80 shadow-yellow-900/50",
              alert.severity === 'low' && "from-blue-950/60 to-blue-900/80 shadow-blue-900/50",
              alert.severity === 'info' && "from-gray-950/60 to-gray-800/80 shadow-gray-900/50"
            )}>
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <Monitor className="w-20 h-20 text-white drop-shadow-2xl relative z-10" strokeWidth={1.5} />
            </div>
          )}

          {/* Badge de severidad */}
          <div className={cn(
            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-lg w-full text-center",
            "bg-gradient-to-r",
            alert.severity === 'critical' && "from-red-600 to-red-500 text-white",
            alert.severity === 'high' && "from-orange-600 to-orange-500 text-white",
            alert.severity === 'medium' && "from-yellow-600 to-yellow-500 text-gray-900",
            alert.severity === 'low' && "from-blue-600 to-blue-500 text-white",
            alert.severity === 'info' && "from-gray-600 to-gray-500 text-white",
          )}>
            {config.label}
          </div>
        </div>

        {/* LADO DERECHO - CONTENIDO */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          {/* TÍTULO DESTACADO CON BORDE */}
          <div className="flex items-center gap-3 pb-2 border-b border-gray-800/50">
            <div className={cn(
              "p-2 rounded-lg flex-shrink-0",
              alert.severity === 'critical' && "bg-red-500/20 text-red-400",
              alert.severity === 'high' && "bg-orange-500/20 text-orange-400",
              alert.severity === 'medium' && "bg-yellow-500/20 text-yellow-400",
              alert.severity === 'low' && "bg-blue-500/20 text-blue-400",
              alert.severity === 'info' && "bg-gray-500/20 text-gray-400",
            )}>
              <Shield className="w-5 h-5" strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={cn(
                "text-lg font-bold tracking-tight leading-tight",
                alert.acknowledged ? 'text-gray-500' : 'text-white'
              )}>
                {alert.friendlyTitle || alert.title}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                {alert.friendlyDescription || alert.description}
              </p>
              <span className="text-[9px] text-gray-500 font-mono">
                {formatTimestamp(alert.timestamp)}
              </span>
            </div>
          </div>

          {/* INFO CONTEXTUAL */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg px-2.5 py-1.5">
              <div className="text-[8px] text-yellow-500/70 uppercase tracking-wider font-bold mb-0.5">
                Estudiante
              </div>
              <div className="text-[11px] font-mono font-bold text-yellow-300">
                {alert.userName || <span className="text-gray-500 italic">Sin sesión</span>}
              </div>
            </div>

            <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg px-2.5 py-1.5">
              <div className="text-[8px] text-purple-500/70 uppercase tracking-wider font-bold mb-0.5">
                Carrera
              </div>
              <div className="text-[11px] font-bold text-purple-300 leading-tight">
                {alert.carreraName}
              </div>
            </div>
          </div>

          {/* ACCIONES */}
          {!alert.acknowledged ? (
            <div className="space-y-2">
              {onRemediationAction && !compact && (
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => onRemediationAction('quarantine', alert)}
                    disabled={isProcessing}
                    className={cn(
                      "py-2 px-2 rounded-lg font-bold text-xs uppercase tracking-wide transition-all duration-200",
                      "border flex flex-col items-center gap-1",
                      isProcessing 
                        ? "bg-gray-900/50 text-gray-600 cursor-not-allowed border-gray-800"
                        : "bg-red-600/20 hover:bg-red-600/30 text-red-400 border-red-600/40 hover:border-red-600/60 hover:scale-105"
                    )}
                  >
                    <Ban className="w-4 h-4" strokeWidth={2} />
                    <span className="text-[8px]">Cuarentena</span>
                  </button>

                  <button
                    onClick={() => onRemediationAction('kick', alert)}
                    disabled={isProcessing || !alert.userName}
                    className={cn(
                      "py-2 px-2 rounded-lg font-bold text-xs uppercase tracking-wide transition-all duration-200",
                      "border flex flex-col items-center gap-1",
                      isProcessing || !alert.userName
                        ? "bg-gray-900/50 text-gray-600 cursor-not-allowed border-gray-800"
                        : "bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 border-orange-600/40 hover:border-orange-600/60 hover:scale-105"
                    )}
                  >
                    <UserX className="w-4 h-4" strokeWidth={2} />
                    <span className="text-[8px]">Expulsar</span>
                  </button>

                  <button
                    onClick={() => onRemediationAction('block', alert)}
                    disabled={isProcessing}
                    className={cn(
                      "py-2 px-2 rounded-lg font-bold text-xs uppercase tracking-wide transition-all duration-200",
                      "border flex flex-col items-center gap-1",
                      isProcessing
                        ? "bg-gray-900/50 text-gray-600 cursor-not-allowed border-gray-800"
                        : "bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 border-yellow-600/40 hover:border-yellow-600/60 hover:scale-105"
                    )}
                  >
                    <AlertOctagon className="w-4 h-4" strokeWidth={2} />
                    <span className="text-[8px]">Bloquear IP</span>
                  </button>
                </div>
              )}

              <button
                onClick={() => onAcknowledge(alert.id)}
                disabled={isProcessing}
                className={cn(
                  "w-full py-2 px-3 rounded-lg font-bold text-xs uppercase tracking-wide transition-all duration-200",
                  "border flex items-center justify-center gap-1.5",
                  isProcessing
                    ? "bg-gray-900/50 text-gray-600 cursor-not-allowed border-gray-800"
                    : "bg-green-600/20 hover:bg-green-600/30 text-green-400 border-green-600/40 hover:border-green-600/60"
                )}
              >
                {isProcessing ? (
                  <>
                    <div className="w-3 h-3 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-[9px]">Procesando...</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3 h-3" />
                    <span className="text-[9px]">Revisar sin Acción</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 py-2.5 px-4 bg-green-950/30 text-green-400 rounded-xl text-xs font-bold uppercase border-2 border-green-900/50">
              <Check className="w-4 h-4" />
              <span className="text-[10px]">Revisada</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper function para formatear timestamp (fuera del componente)
function formatTimestamp(date: Date): string {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'hace menos de 1 min';
  if (minutes === 1) return 'hace 1 min';
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return 'hace 1 hora';
  return `hace ${hours} horas`;
}

// Modal de Confirmación de Remediación
interface RemediationConfirmModalProps {
  alert: SecurityAlert;
  action: 'quarantine' | 'kick' | 'block';
  onConfirm: () => void;
  onCancel: () => void;
}

function RemediationConfirmModal({ alert, action, onConfirm, onCancel }: RemediationConfirmModalProps) {
  const actionConfig = {
    quarantine: {
      icon: Ban,
      title: 'Poner PC en Cuarentena',
      description: 'Esta acción bloqueará TODA la conectividad de red de la PC inmediatamente.',
      details: [
        'Se ejecutará: sudo ufw deny all',
        'El usuario perderá conexión a internet',
        'La PC quedará aislada de la red',
        'Efecto en ~3 segundos (próximo heartbeat)',
      ],
      color: 'red',
      buttonText: 'Confirmar Cuarentena',
    },
    kick: {
      icon: UserX,
      title: 'Expulsar Usuario',
      description: 'Esta acción cerrará la sesión del usuario inmediatamente.',
      details: [
        `Se ejecutará: pkill -KILL -u ${alert.userName}`,
        'El usuario será desconectado',
        'Todos sus procesos se terminarán',
        'Efecto en ~3 segundos (próximo heartbeat)',
      ],
      color: 'orange',
      buttonText: 'Confirmar Expulsión',
    },
    block: {
      icon: AlertOctagon,
      title: 'Bloquear IP Origen',
      description: 'Esta acción bloqueará el tráfico desde la IP origen.',
      details: [
        `Se bloqueará: ${alert.sourceIp}`,
        'El tráfico desde esta IP será rechazado',
        'Bloqueo temporal (configurable)',
        'Efecto en ~3 segundos (próximo heartbeat)',
      ],
      color: 'yellow',
      buttonText: 'Confirmar Bloqueo',
    },
  };

  const config = actionConfig[action];
  const IconComponent = config.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-border rounded-xl max-w-lg w-full overflow-hidden shadow-2xl">
        {/* Header */}
        <div className={cn(
          "p-4 border-b border-border flex items-center gap-3",
          config.color === 'red' && 'bg-red-600/10',
          config.color === 'orange' && 'bg-orange-600/10',
          config.color === 'yellow' && 'bg-yellow-600/10'
        )}>
          <div className={cn(
            "p-2 rounded-lg",
            config.color === 'red' && 'bg-red-600/20',
            config.color === 'orange' && 'bg-orange-600/20',
            config.color === 'yellow' && 'bg-yellow-600/20'
          )}>
            <IconComponent className={cn(
              "w-6 h-6",
              config.color === 'red' && 'text-red-400',
              config.color === 'orange' && 'text-orange-400',
              config.color === 'yellow' && 'text-yellow-400'
            )} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white">{config.title}</h3>
            <p className="text-xs text-gray-400">Acción de Remediación Automática</p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Descripción */}
          <p className="text-sm text-gray-300">
            {config.description}
          </p>

          {/* Info de la alerta */}
          <div className="bg-black/50 p-3 rounded-lg space-y-2 border border-border">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">PC:</span>
              <span className="font-mono font-semibold text-white">{alert.pcName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">Carrera:</span>
              <span className="text-purple-300">{alert.carreraName}</span>
            </div>
            {alert.userName && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-400">Usuario:</span>
                <span className="font-mono text-yellow-300">{alert.userName}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">Amenaza:</span>
              <span className="text-red-400">{alert.friendlyTitle || alert.title}</span>
            </div>
          </div>

          {/* Detalles técnicos */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Acciones que se ejecutarán:
            </p>
            <ul className="space-y-1">
              {config.details.map((detail, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
                  <span className="text-green-500 mt-0.5">→</span>
                  <span className="font-mono">{detail}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Advertencia */}
          <div className="bg-yellow-600/10 border border-yellow-600/30 rounded p-3 flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-200">
              Esta acción se ejecutará <strong>automáticamente</strong> en el cliente en los próximos segundos.
              Asegúrate de que esta es la acción correcta.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-black/30 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              "flex-1 px-4 py-2 rounded transition-colors font-medium",
              config.color === 'red' && 'bg-red-600 hover:bg-red-500 text-white',
              config.color === 'orange' && 'bg-orange-600 hover:bg-orange-500 text-white',
              config.color === 'yellow' && 'bg-yellow-600 hover:bg-yellow-500 text-white'
            )}
          >
            {config.buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}
