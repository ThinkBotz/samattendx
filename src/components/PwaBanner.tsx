import { useEffect, useMemo, useState } from 'react';
// @ts-ignore provided by Vite PWA in production only
let useRegisterSW: any = () => ({
  needRefresh: [false, () => {}],
  offlineReady: [false, () => {}],
  updateServiceWorker: () => {},
});
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  useRegisterSW = require('virtual:pwa-register/react').useRegisterSW;
} catch {}
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function PwaBanner() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered() {},
    onRegisterError() {},
  });

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (needRefresh || offlineReady) setVisible(true);
  }, [needRefresh, offlineReady]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-20 left-0 right-0 z-40 px-3 sm:px-4">
      <Card className="mx-auto max-w-lg bg-card border shadow-lg p-3 sm:p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm">
            {needRefresh && <p className="text-foreground">A new version is available.</p>}
            {offlineReady && !needRefresh && (
              <p className="text-foreground">App is ready for offline use.</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {needRefresh && (
              <Button size="sm" onClick={() => updateServiceWorker(true)}>
                Update
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setOfflineReady(false);
                setNeedRefresh(false);
                setVisible(false);
              }}
            >
              Dismiss
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
