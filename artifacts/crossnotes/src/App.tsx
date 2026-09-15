import { lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Switch, Route, Router as WouterRouter } from 'wouter';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { SoundProvider } from '@/contexts/SoundContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import AuthStartupGate from '@/components/AuthStartupGate';
import AppInstallPrompt from '@/components/AppInstallPrompt';
import FirstUseTour from '@/components/FirstUseTour';
import MewCompanion from '@/components/MewCompanion';
import OfflineNotice from '@/components/OfflineNotice';
import CookieConsent from '@/components/CookieConsent';
import LoginReminder from '@/components/LoginReminder';
import { Toaster } from 'sonner';

const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Home = lazy(() => import('@/pages/Home'));
const Subject = lazy(() => import('@/pages/Subject'));
const Vault = lazy(() => import('@/pages/Vault'));
const VaultSubject = lazy(() => import('@/pages/VaultSubject'));
const Notes = lazy(() => import('@/pages/Notes'));
const Flashcards = lazy(() => import('@/pages/Flashcards'));
const Quiz = lazy(() => import('@/pages/Quiz'));
const Progress = lazy(() => import('@/pages/Progress'));
const Leaderboard = lazy(() => import('@/pages/Leaderboard'));
const Shop = lazy(() => import('@/pages/Shop'));
const AdminFeedback = lazy(() => import('@/pages/AdminFeedback'));
const Credits = lazy(() => import('@/pages/Credits'));
const NotFound = lazy(() => import('@/pages/not-found'));

const queryClient = new QueryClient();

export default function App() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeProvider>
            <SoundProvider>
              <AuthStartupGate>
                <Suspense fallback={<main className="cn-body route-loading" aria-live="polite">Loading CrossNotes…</main>}>
                  <WouterRouter base={base}>
                    <ErrorBoundary>
                      <Switch>
                        <Route path="/" component={Dashboard} />
                        <Route path="/subjects" component={Home} />
                        <Route path="/subject/:slug" component={Subject} />
                        <Route path="/vault" component={Vault} />
                        <Route path="/vault/:slug" component={VaultSubject} />
                        <Route path="/notes/:slug/:chapterId" component={Notes} />
                        <Route path="/flashcards/:slug/:chapterId" component={Flashcards} />
                        <Route path="/quiz/:slug/:chapterId" component={Quiz} />
                        <Route path="/progress" component={Progress} />
                        <Route path="/leaderboard" component={Leaderboard} />
                        <Route path="/shop" component={Shop} />
                        <Route path="/admin/feedback" component={AdminFeedback} />
                        <Route path="/credits" component={Credits} />
                        <Route component={NotFound} />
                      </Switch>
                    </ErrorBoundary>
                  </WouterRouter>
                </Suspense>
                <FirstUseTour />
                <AppInstallPrompt />
                <MewCompanion />
                <OfflineNotice />
                <CookieConsent />
                <LoginReminder />
                <Toaster richColors position="top-center" />
              </AuthStartupGate>
            </SoundProvider>
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
