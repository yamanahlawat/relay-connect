import { components } from '@/lib/api/schema';
import { ProviderCard } from '@/modules/settings/Providers/ProviderCard';

type Provider = components['schemas']['ProviderRead'];

interface ProviderGroupProps {
  title: string;
  providers: Provider[];
  onEdit: (provider: Provider) => void;
  onDelete: (provider: Provider) => void;
}

export function ProviderGroup({ title, providers, onEdit, onDelete }: ProviderGroupProps) {
  if (providers.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <div className="space-y-2">
        {providers.map((provider) => (
          <ProviderCard key={provider.id} provider={provider} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}
