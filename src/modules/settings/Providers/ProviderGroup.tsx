import { ProviderCard } from '@/modules/settings/providers/ProviderCard';
import type { ProviderRead } from '@/types/provider';

interface ProviderGroupProps {
  title: string;
  providers: ProviderRead[];
  onEdit: (provider: ProviderRead) => void;
  onDelete: (provider: ProviderRead) => void;
}

export function ProviderGroup({ title, providers, onEdit, onDelete }: ProviderGroupProps) {
  if (providers.length === 0) return null;

  return (
    <div className="p-6">
      <h3 className="text-muted-foreground mb-4 text-sm font-medium">{title}</h3>
      <div className="space-y-3">
        {providers.map((provider) => (
          <ProviderCard key={provider.id} provider={provider} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}
