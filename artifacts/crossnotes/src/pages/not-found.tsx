import '../crossnotes.css';
import { Link } from 'wouter';
import MewMascot from '@/components/MewMascot';

const NOT_FOUND_BURNS = [
  "Even Caesar doesn't know where this page went. It probably ran away from exams.",
  "404: Page skipped school today. Just like you wanted to.",
  "This page exists only in your dreams. And maybe in the supplement exam.",
  "Congratulations, you reached the absolute edge of CrossNotes.",
];

export default function NotFound() {
  const burn = NOT_FOUND_BURNS[Math.floor(Math.random() * NOT_FOUND_BURNS.length)];

  return (
    <div className="cn-body flex flex-col items-center justify-center min-h-screen text-center p-6 gap-4">
      <MewMascot size="lg" mood="judgy" speech="Bro... where are you trying to go? 🙄" />
      <h1 className="font-display font-black text-3xl mt-2" style={{ color: 'var(--text)' }}>
        404 — Lost in the Syllabus
      </h1>
      <p className="max-w-md text-sm font-semibold leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        {burn}
      </p>
      <Link href="/">
        <button className="clay-btn px-6 py-3 text-sm mt-2">
          ← Escape back to Dashboard
        </button>
      </Link>
    </div>
  );
}
