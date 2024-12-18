import ApiClientProvider from '@/context/ApiClientProvider';
import ReactQueryProvider from '@/context/ReactQueryProvider';
import '@/lib/apiClient';
import { inter } from '@/lib/fonts';
import '@/styles/globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Relay',
    default: 'Relay',
  },
  description: 'Simple yet effective open source LLM Studio.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased bg-background text-foreground`}>
        <ReactQueryProvider>
          <ApiClientProvider>{children}</ApiClientProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
