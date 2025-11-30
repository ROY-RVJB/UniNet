import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldX, Wifi, RefreshCw } from 'lucide-react';
import { useState } from 'react';

export function ControlPanel() {
  const [isApplying, setIsApplying] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  const handleExamMode = () => {
    setIsApplying(true);
    setLastAction('Aplicando Modo Examen: Netplan Static + UFW DENY...');

    setTimeout(() => {
      setLastAction('✓ Modo Examen activado en 12 equipos');
      setIsApplying(false);
    }, 2000);
  };

  const handleClassMode = () => {
    setIsApplying(true);
    setLastAction('Restaurando Modo Clase: Netplan DHCP + UFW ALLOW...');

    setTimeout(() => {
      setLastAction('✓ Modo Clase activado en 12 equipos');
      setIsApplying(false);
    }, 2000);
  };

  return (
    <div className="space-y-4">
      {/* Modo Examen */}
      <Card className="bg-tech-darkCard border-tech-darkBorder border-l-4 border-l-status-offline">
        <CardHeader>
          <CardTitle className="text-tech-text flex items-center gap-2">
            <ShieldX className="h-5 w-5 text-status-offline" />
            MODO EXAMEN
          </CardTitle>
          <CardDescription>
            Ejecuta script SSH: Netplan Static IP + UFW Deny Outgoing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleExamMode}
            disabled={isApplying}
            variant="destructive"
            className="w-full sm:w-auto"
          >
            <ShieldX className="mr-2 h-4 w-4" />
            {isApplying ? 'Aplicando...' : 'ACTIVAR BLOQUEO'}
          </Button>
        </CardContent>
      </Card>

      {/* Modo Clase */}
      <Card className="bg-tech-darkCard border-tech-darkBorder border-l-4 border-l-status-online">
        <CardHeader>
          <CardTitle className="text-tech-text flex items-center gap-2">
            <Wifi className="h-5 w-5 text-status-online" />
            MODO CLASE
          </CardTitle>
          <CardDescription>
            Ejecuta script SSH: Netplan DHCP + UFW Allow All
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleClassMode}
            disabled={isApplying}
            className="w-full sm:w-auto bg-status-online hover:bg-status-online/90 text-black font-semibold"
          >
            <Wifi className="mr-2 h-4 w-4" />
            {isApplying ? 'Aplicando...' : 'RESTAURAR INTERNET'}
          </Button>
        </CardContent>
      </Card>

      {/* Log de acciones */}
      {lastAction && (
        <div className="bg-tech-hoverState p-4 rounded-lg border border-tech-darkBorder">
          <p className="text-sm text-tech-textDim flex items-center gap-2">
            {isApplying ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <span className="text-status-online">✓</span>
            )}
            {lastAction}
          </p>
        </div>
      )}
    </div>
  );
}
