import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { LEVELS, loadLevel, loadSecrets } from './levels';

// Placeholder until the real pages land: lists levels and loads one to prove the loaders work.
function App() {
  const [info, setInfo] = useState('');
  useEffect(() => {
    const id = location.hash.slice(1) || LEVELS[0].id;
    Promise.all([loadLevel(id), loadSecrets(id)]).then(([L, s]) =>
      setInfo(`${id}: ${Object.keys(L?.files ?? {}).length} files, ${Object.keys(s.solution).length} fixed files`),
    );
  }, []);
  return (
    <p>
      bug/drill: {LEVELS.length} levels. {info}
    </p>
  );
}

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
