import { useLaboratory } from '@/contexts/LaboratoryContext';
import { LabCard } from './LabCard';
import { Building2 } from 'lucide-react';

// ==========================================
// LabGrid - Grid de laboratorios para Home
// ==========================================

export function LabGrid() {
  const { laboratories } = useLaboratory();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Building2 className="w-8 h-8" />
          Mis Laboratorios
        </h1>
        <p className="text-tech-textDim mt-2">
          Selecciona un laboratorio para ver su dashboard
        </p>
      </div>

      {/* Grid de Labs */}
      {laboratories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {laboratories.map((lab) => (
            <LabCard key={lab.id} lab={lab} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 text-tech-textDim mx-auto mb-4" />
          <p className="text-tech-textDim">No hay laboratorios configurados</p>
        </div>
      )}
    </div>
  );
}
