import { components } from '@/lib/api/schema';
import { ModelCard } from '@/modules/settings/models/ModelCard';

type Model = components['schemas']['ModelRead'];

interface ModelGroupProps {
  title: string;
  models: Model[];
  onEdit: (model: Model) => void;
  onDelete: (model: Model) => void;
}

export function ModelGroup({ title, models, onEdit, onDelete }: ModelGroupProps) {
  if (models.length === 0) return null;

  return (
    <div className="p-6">
      <h3 className="text-muted-foreground mb-4 text-sm font-medium">{title}</h3>
      <div className="space-y-3">
        {models.map((model) => (
          <ModelCard key={model.id} model={model} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}
