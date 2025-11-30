import type {PC} from '@/types'; 
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Monitor, User } from 'lucide-react';
import { StatusIndicator } from './StatusIndicator';

interface PCCardProps {
  pc: PC;
  onClick?: () => void;
}

export function PCCard({ pc, onClick }: PCCardProps) {
  return (
    <Card
      className="bg-tech-darkCard border-tech-darkBorder hover:-translate-y-1 hover:shadow-lg transition-all cursor-pointer"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-2">
          <Monitor className="h-10 w-10 text-tech-text" />
          <StatusIndicator status={pc.status} />
        </div>
        <CardTitle className="text-tech-text text-lg">{pc.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="flex items-center gap-2 text-sm">
          <User className="h-3 w-3 text-tech-textDim" />
          <span className="text-tech-textDim">
            {pc.user || 'Sin Usuario'}
          </span>
        </div>
        <p className="text-xs text-tech-textDim">{pc.ip}</p>
      </CardContent>
    </Card>
  );
}
