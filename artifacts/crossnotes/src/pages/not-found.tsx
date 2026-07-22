import '../crossnotes.css';
import { Link } from 'wouter';

export default function NotFound() {
  return (
    <div className="cn-body" style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem', gap: '1rem' }}>
      <div style={{ fontSize: '5rem' }}>😵</div>
      <h1 className="font-display" style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text)' }}>Page not found</h1>
      <p style={{ color: 'var(--text-muted)', fontWeight: 700 }}>
        Even Caesar doesn't know where this page went. It probably ran away from exams.
      </p>
      <Link href="/">
        <button className="clay-btn" style={{ marginTop: '1rem' }}>← Back to Home</button>
      </Link>
    </div>
  );
}
