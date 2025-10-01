import React, { Suspense } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// @ts-ignore dynamic import only used in prod build
const Prod = import.meta.env.PROD ? React.lazy(async () => await import('./PwaBanner.prod')) : null;

export function PwaBanner() {
  if (!import.meta.env.PROD || !Prod) return null;
  return (
    <Suspense fallback={null}>{/* @ts-ignore */}
      <Prod />
    </Suspense>
  );
}
