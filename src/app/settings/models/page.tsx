import { ModelSettings } from '@/modules/settings/models/ModelSettings';
import { Suspense } from 'react';

export default function ModelsPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<div>Loading...</div>}>
        <ModelSettings />
      </Suspense>
    </div>
  );
}
