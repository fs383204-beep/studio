'use client';

import { ThemeProvider } from './ThemeProvider';
import { AppProvider } from '@/contexts/AppContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider storageKey="titlenote-theme">
      <AppProvider>{children}</AppProvider>
    </ThemeProvider>
  );
}
