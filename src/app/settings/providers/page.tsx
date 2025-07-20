import { ProviderSettings } from '@/modules/settings/providers/ProviderSettings';
import { Suspense } from 'react';

export default function ProvidersPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<div>Loading...</div>}>
        <ProviderSettings />
      </Suspense>
    </div>
  );
}
