import { useRef, useState } from 'react';
import './App.css';
import { CanvasBoard } from './features/canvas/CanvasBoard';

interface SpotlightMessage {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

const demoMessages: SpotlightMessage[] = [
  {
    id: '1',
    author: 'Guest-4219',
    content: 'Launching a pop-up art show this Friday — drop by and grab a square! 🎨',
    createdAt: '2024-04-01T09:15:00Z'
  },
  {
    id: '2',
    author: 'Studio Lumen',
    content: 'New lighting design studio booking clients. Claim premium slots before they fill up.',
    createdAt: '2024-04-01T10:02:00Z'
  },
  {
    id: '3',
    author: 'Board Owner: Downtown Wall',
    content: 'Looking for collaborators to co-host a sponsored mural week! DM to partner.',
    createdAt: '2024-04-01T10:30:00Z'
  }
];

export default function App(): JSX.Element {
  const [messages] = useState(demoMessages);
  const boardRef = useRef<HTMLDivElement | null>(null);

  const handleLaunchCanvas = (): void => {
    const target = boardRef.current;

    if (target && typeof target.scrollIntoView === 'function') {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero__meta">
          <p className="hero__badge">Founders Preview</p>
          <h1>Post Your Ad Board</h1>
          <p className="hero__description">
            A collaborative canvas where anyone can sketch ideas, drop notes, and pay for premium spots when
            the board is buzzing.
          </p>
        </div>
        <div className="cta-panel">
          <p>Create anonymously or claim a profile to unlock analytics, board ownership, and payouts.</p>
          <div className="cta-panel__actions">
            <button type="button" className="cta-panel__primary" onClick={handleLaunchCanvas}>
              Launch Canvas
            </button>
            <button type="button" className="cta-panel__secondary">
              View Roadmap
            </button>
          </div>
        </div>
      </header>

      <div ref={boardRef} className="canvas-section">
        <CanvasBoard />
      </div>

      <main className="preview">
        <section className="preview__board">
          <h2>Live Board Preview</h2>
          <div className="preview__grid">
            {messages.map((message) => (
              <article key={message.id} className="preview__card">
                <header>
                  <h3>{message.author}</h3>
                  <time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleString()}</time>
                </header>
                <p>{message.content}</p>
              </article>
            ))}
          </div>
        </section>

        <aside className="preview__sidebar">
          <h2>Placement Tiers</h2>
          <ul>
            <li>
              <span className="tier tier--premium">Spotlight Banner</span>
              <span className="price">$25 / day</span>
            </li>
            <li>
              <span className="tier tier--plus">Prime Quadrant</span>
              <span className="price">$12 / day</span>
            </li>
            <li>
              <span className="tier tier--base">Community Tile</span>
              <span className="price">Free (limited)</span>
            </li>
          </ul>
          <p className="sidebar__hint">
            Own a board? Set custom pricing, approve posts, and earn from every placement.
          </p>
        </aside>
      </main>

      <footer className="footer">
        <p>Built with fairness, community, and transparency in mind.</p>
      </footer>
    </div>
  );
}
