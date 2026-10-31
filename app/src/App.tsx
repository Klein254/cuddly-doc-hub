import { PillNav } from './components/PillNav';
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

  if (!sync.ready) return <div className="app-bg" />;

  if (sync.mode === 'cloud' && !sync.session) {
    return (
      <>
        <div className="app-bg" />
        <Login />
      </>
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
    <>
      <div className="app-bg" />
      <PillNav active={active} />
      <main className="mx-auto max-w-6xl px-3 pb-32 pt-4 md:px-4 md:pb-16 md:pt-6">{page}</main>
      <Toaster />
    </>
  );
}
