import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Share } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { isIOS, isStandalone, promptInstall, useInstall } from '@/lib/install';

/**
 * "Install app" button. Shows only when installing is actually possible:
 * - Chrome / Edge / Android: one tap, using the browser's install prompt.
 * - iPhone / iPad: no prompt exists, so it opens a short "Share > Add to Home Screen" guide.
 * Hidden once the app is installed or already running as an installed app.
 */
const InstallButton = () => {
  const { canPrompt, installed } = useInstall();
  const [help, setHelp] = useState(false);

  if (installed || isStandalone()) return null;
  const ios = isIOS();
  if (!canPrompt && !ios) return null;

  const onClick = () => (canPrompt ? void promptInstall() : setHelp(true));

  return (
    <>
      <motion.button
        onClick={onClick}
        className="p-2 rounded-xl glass-panel text-muted-foreground hover:text-foreground"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        title="Install app"
        aria-label="Install app"
      >
        <Download size={18} />
      </motion.button>

      <Dialog open={help} onOpenChange={setHelp}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Install Cozy Flow</DialogTitle>
            <DialogDescription>Add it to your home screen to open it like an app.</DialogDescription>
          </DialogHeader>
          <ol className="space-y-3 text-sm">
            <li className="flex items-center gap-2">
              <span className="font-medium">1.</span> Tap the <Share size={16} className="inline text-primary" /> Share button in your browser.
            </li>
            <li><span className="font-medium">2.</span> Choose <strong>Add to Home Screen</strong>.</li>
            <li><span className="font-medium">3.</span> Tap <strong>Add</strong>.</li>
          </ol>
          <p className="text-xs text-muted-foreground">On iPhone, this works from Safari and, on newer versions, from Chrome too.</p>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InstallButton;