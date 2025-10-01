import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault?.();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  if (!visible || !deferred) return null;

  const install = async () => {
    await deferred.prompt();
    const choice = await deferred.userChoice;
    setVisible(false);
    setDeferred(null);
    // optionally track choice.outcome
  };

  return (
    <div className="fixed bottom-36 left-0 right-0 z-40 px-3 sm:px-4">
      <Card className="mx-auto max-w-lg bg-card border shadow-lg p-3 sm:p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm">
            <p className="text-foreground">Install this app for a better experience.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={install}>Install</Button>
            <Button size="sm" variant="outline" onClick={() => setVisible(false)}>Dismiss</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
