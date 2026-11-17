import { useEffect } from 'react';
import { LevelPage } from '../level/LevelPage';
import { Guide } from '../pages/Guide';
import { Home } from '../pages/Home';
import { normalizeHash, parseRoute, useHash } from './router';

export function App() {
  const hash = useHash();
  useEffect(normalizeHash, [hash]);
  const route = parseRoute(hash);

  useEffect(() => {
    document.body.classList.toggle('in-level', route.page === 'level');
    if (route.page !== 'level') window.scrollTo(0, 0);
  }, [route.page]);

  if (route.page === 'level') return <LevelPage key={route.id} id={route.id} />;
  if (route.page === 'guide') return <Guide />;
  return <Home />;
}
