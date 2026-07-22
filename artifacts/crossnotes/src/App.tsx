import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Switch, Route, Router as WouterRouter } from 'wouter';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { SoundProvider } from '@/contexts/SoundContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Toaster } from 'sonner';

import Dashboard  from '@/pages/Dashboard';
import Home       from '@/pages/Home';       // Subjects list
import Subject    from '@/pages/Subject';
import Notes      from '@/pages/Notes';
import Flashcards from '@/pages/Flashcards';
import Quiz       from '@/pages/Quiz';
import Progress   from '@/pages/Progress';
import Leaderboard from '@/pages/Leaderboard';
import Shop       from '@/pages/Shop';
import NotFound   from '@/pages/not-found';

const queryClient = new QueryClient();

export default function App() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeProvider>
            <SoundProvider>
              <WouterRouter base={base}>
                <ErrorBoundary>
                  <Switch>
                    <Route path="/"                        component={Dashboard}  />
                    <Route path="/subjects"                component={Home}       />
                    <Route path="/subject/:slug"           component={Subject}    />
                    <Route path="/notes/:slug/:chapterId"  component={Notes}      />
                    <Route path="/flashcards/:slug/:chapterId" component={Flashcards} />
                    <Route path="/quiz/:slug/:chapterId"   component={Quiz}       />
                    <Route path="/progress"                component={Progress}   />
                    <Route path="/leaderboard"             component={Leaderboard} />
                    <Route path="/shop"                    component={Shop}       />
                    <Route                                 component={NotFound}   />
                  </Switch>
                </ErrorBoundary>
              </WouterRouter>
              <Toaster richColors position="top-center" />
            </SoundProvider>
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
