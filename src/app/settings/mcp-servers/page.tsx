import { MCPServerSettings } from '@/modules/settings/mcp/MCPServerSettings';
import { Suspense } from 'react';

export default function MCPServersPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<div>Loading...</div>}>
        <MCPServerSettings />
      </Suspense>
    </div>
  );
}
