import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

function App() {
  return <p>bug/drill</p>;
}

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
