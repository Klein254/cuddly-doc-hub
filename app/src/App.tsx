import { MotionConfig, motion } from 'motion/react';
import { useEffect } from 'react';
import { CommandPalette } from './components/CommandPalette';
import { Shell } from './components/Shell';
import { Toaster } from './components/ui';
import { useRoute } from './lib/router';
import { useStore, useSync } from './lib/store';
import { DOC_TYPES, type DocType } from './lib/types';
import { Dashboard } from './pages/Dashboard';
import { DocList } from './pages/DocList';
import { Editor } from './pages/Editor';
import { Login } from './pages/Login';
import { Settings } from './pages/Settings';

export function App() {
  const route = useRoute();
  const sync = useSync();
  const [head, id] = route.split('/');
  // Keep the document's section lit in the nav while editing it.
  const editingType = useStore((s) => (head === 'doc' ? s.docs.find((d) => d.id === id)?.type : undefined));

  // Each page starts at the top.
  useEffect(() => {
    document.getElementById('main')?.scrollTo(0, 0);
    window.scrollTo(0, 0);
  }, [route]);

  if (!sync.ready) return null;

  if (sync.mode === 'cloud' && !sync.user) {
    return (
      <MotionConfig reducedMotion="user">
        <Login />
      </MotionConfig>
    );
  }

  let page;
  let active = head;
  if (head === 'doc' && id) {
    page = <Editor key={id} id={id} />;
    active = editingType ?? '';
  } else if (DOC_TYPES.includes(head as DocType)) {
    page = <DocList key={head} type={head as DocType} />;
  } else if (head === 'settings') {
    page = <Settings />;
  } else {
    page = <Dashboard />;
    active = '';
  }

  return (
    <MotionConfig reducedMotion="user">
      <Shell active={active}>
        {/* Pages ease in: a short rise and fade, like a sheet settling into place. */}
        <motion.div key={route} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}>
          {page}
        </motion.div>
      </Shell>
      <CommandPalette />
      <Toaster />
    </MotionConfig>
  );
}
