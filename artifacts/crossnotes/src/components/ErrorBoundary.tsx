import { Component, type ReactNode } from "react";
import MewMascot from "@/components/MewMascot";

const FUNNY_CRASHES = [
  "The app had an existential crisis. Very relatable.",
  "Something went boom. Even Caesar's notes couldn't survive this code crash.",
  "Mew accidentally chewed through the server wires. Don't look at him like that.",
  "Welp. This is awkward. The app broke, but hey, free break from studying!",
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
      const msg = FUNNY_CRASHES[Math.floor(Math.random() * FUNNY_CRASHES.length)];
      return (
        <div
          className="cn-body min-h-screen flex flex-col items-center justify-center text-center p-6 gap-4"
        >
          <MewMascot size="lg" mood="sleepy" speech="Oops... I broke it. 💥" />
          <h1 className="font-display font-black text-2xl" style={{ color: 'var(--text)' }}>{msg}</h1>
          <p className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>Technical gibberish for developers:</p>
          <code className="text-xs font-mono p-3 rounded-xl max-w-md w-full break-all border" style={{ color: 'var(--primary)', background: 'var(--primary-light)', borderColor: 'var(--primary-border)' }}>
            {this.state.errorMessage}
          </code>
          <button
            className="clay-btn px-6 py-3 text-sm mt-2"
            onClick={() => { this.setState({ hasError: false, errorMessage: "" }); window.location.href = "/"; }}
          >
            Take me back to safety 🏠
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
