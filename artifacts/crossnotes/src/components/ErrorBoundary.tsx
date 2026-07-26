import { Component, type ReactNode } from "react";

const FUNNY = [
  "The app had an existential crisis. Very relatable.",
  "Something went boom. Even Caesar's notes couldn't survive this one.",
  "Error detected. Our study elves are panicking.",
  "Welp. This is awkward. The app broke, not you.",
];

export default class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; errorMessage: string }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMessage: error?.message ?? "Unknown error" };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      const msg = FUNNY[Math.floor(Math.random() * FUNNY.length)];
      return (
        <div
          className="cn-body"
          style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem', gap: '1rem' }}
        >
          <div style={{ fontSize: '4rem' }}>💥</div>
          <h1 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)' }}>{msg}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Technical gibberish:</p>
          <code style={{ fontSize: '0.75rem', color: 'var(--primary)', background: 'var(--primary-light)', padding: '0.5rem 1rem', borderRadius: 8, display: 'block', maxWidth: 480, wordBreak: 'break-all' }}>
            {this.state.errorMessage}
          </code>
          <button
            className="clay-btn"
            onClick={() => { this.setState({ hasError: false, errorMessage: "" }); window.location.href = "/"; }}
          >
            Take me home (please)
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
