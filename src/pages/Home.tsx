import { LEVELS } from '../levels';
import { Nav } from '../ui/Nav';

// Placeholder. Replaced by the real home page.
export function Home() {
  return (
    <>
      <Nav active="home" />
      <div className="wrap">
        <ul>
          {LEVELS.map((l) => (
            <li key={l.id}>
              <a href={`#/level/${l.id}`}>{l.title}</a>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
