'use client';

import { client } from '@/client/sdk.gen';
import { ReactNode, useEffect } from 'react';

interface ApiClientProviderProps {
  children: ReactNode;
}

const ApiClientProvider = ({ children }: ApiClientProviderProps) => {
  useEffect(() => {
    client.setConfig({
      baseURL: process.env.NEXT_PUBLIC_RELAY_SERVE_HOST,
    });
  }, []);

  return <>{children}</>;
};

export default ApiClientProvider;
