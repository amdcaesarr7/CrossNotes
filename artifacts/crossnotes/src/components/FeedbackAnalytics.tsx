import { useMemo } from 'react';
import { BarChart3, CheckCircle2, Heart, Lightbulb, MessageCircleWarning, Minus, TrendingUp } from 'lucide-react';
import type { FeedbackItem, FeedbackKind } from '@/lib/feedback';

type Sentiment = 'positive' | 'neutral' | 'concern';

type SentimentCounts = Record<Sentiment, number>;

const POSITIVE_TERMS = new Set([
  'amazing', 'awesome', 'best', 'brilliant', 'cool', 'easy', 'enjoy', 'excellent', 'fantastic', 'good',
  'great', 'helpful', 'improve', 'incredible', 'love', 'lovely', 'nice', 'perfect', 'please', 'smooth',
  'thank', 'thanks', 'useful', 'well', 'wonderful',
]);

const CONCERN_TERMS = new Set([
  'bad', 'broken', 'bug', 'buggy', 'cannot', 'cant', 'confusing', 'crash', 'difficult', 'error', 'fail',
  'frustrating', 'hard', 'hate', 'issue', 'lag', 'missing', 'not', 'problem', 'slow', 'stuck', 'worse', 'wrong',
]);

const kindLabels: Record<FeedbackKind, string> = {
  idea: 'Ideas',
  bug: 'Bug reports',
  encouragement: 'Encouragement',
};

function emptySentiments(): SentimentCounts {
  return { positive: 0, neutral: 0, concern: 0 };
}

function getSentiment(item: FeedbackItem): Sentiment {
  const words = item.message.toLocaleLowerCase().match(/[a-z']+/g) ?? [];
  let positive = 0;
  let concern = 0;

  for (const word of words) {
    if (POSITIVE_TERMS.has(word)) positive += 1;
    if (CONCERN_TERMS.has(word)) concern += 1;
  }

  if (item.kind === 'bug' && concern === 0) concern += 1;
  if (concern > positive) return 'concern';
  if (positive > concern) return 'positive';
  return 'neutral';
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function percent(value: number, total: number) {
  return total ? Math.round((value / total) * 100) : 0;
}

export default function FeedbackAnalytics({ items }: { items: FeedbackItem[] }) {
  const analytics = useMemo(() => {
    const now = new Date();
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(now);
      date.setHours(0, 0, 0, 0);
      date.setDate(now.getDate() - (6 - index));
      return {
        key: dateKey(date),
        label: new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(date),
        sentiments: emptySentiments(),
        total: 0,
      };
    });
    const daysByKey = new Map(days.map((day) => [day.key, day]));
    const sentiments = emptySentiments();
    const categories: Record<FeedbackKind, number> = { idea: 0, bug: 0, encouragement: 0 };

    for (const item of items) {
      const sentiment = getSentiment(item);
      sentiments[sentiment] += 1;
      categories[item.kind] += 1;
      const day = daysByKey.get(dateKey(new Date(item.createdAt)));
      if (day) {
        day.sentiments[sentiment] += 1;
        day.total += 1;
      }
    }

    const resolved = items.filter((item) => item.status === 'resolved').length;
    const active = items.filter((item) => item.status === 'new' || item.status === 'in_review').length;
    const strongestCategory = (Object.keys(categories) as FeedbackKind[]).sort((a, b) => categories[b] - categories[a])[0];
    const maxDayTotal = Math.max(...days.map((day) => day.total), 1);
    const concernShare = percent(sentiments.concern, items.length);
    const positiveShare = percent(sentiments.positive, items.length);

    return { days, sentiments, categories, resolved, active, strongestCategory, maxDayTotal, concernShare, positiveShare };
  }, [items]);

  const total = items.length;
  const resolutionRate = percent(analytics.resolved, total);
  const topKindCount = analytics.categories[analytics.strongestCategory];

  return (
    <section className="feedback-analytics clay-card" aria-label="Feedback analytics and sentiment trends">
      <header className="feedback-analytics-header">
        <div>
          <span className="feedback-analytics-kicker"><BarChart3 size={14} /> Feedback intelligence</span>
          <h2>What learners are telling you</h2>
          <p>Transparent, keyword-based sentiment signals from the submitted feedback itself.</p>
        </div>
        <span className="feedback-analytics-period">Last 7 days</span>
      </header>

      {total === 0 ? (
        <div className="feedback-analytics-empty"><BarChart3 size={26} /><p>Analytics will appear after the first feedback submission.</p></div>
      ) : (
        <>
          <div className="feedback-analytics-stats">
            <div className="feedback-analytics-stat positive"><span><Heart size={17} /></span><div><strong>{analytics.positiveShare}%</strong><small>Positive signal</small></div></div>
            <div className="feedback-analytics-stat concern"><span><MessageCircleWarning size={17} /></span><div><strong>{analytics.concernShare}%</strong><small>Needs attention</small></div></div>
            <div className="feedback-analytics-stat resolved"><span><CheckCircle2 size={17} /></span><div><strong>{resolutionRate}%</strong><small>Resolution rate</small></div></div>
            <div className="feedback-analytics-stat active"><span><TrendingUp size={17} /></span><div><strong>{analytics.active}</strong><small>Open items</small></div></div>
          </div>

          <div className="feedback-analytics-grid">
            <div className="feedback-sentiment-trend">
              <div className="feedback-analytics-section-heading"><div><h3>Sentiment movement</h3><p>Message volume by day</p></div><span><i className="sentiment-dot positive" /> Positive <i className="sentiment-dot neutral" /> Neutral <i className="sentiment-dot concern" /> Concern</span></div>
              <div className="sentiment-chart" role="img" aria-label="A seven-day stacked bar chart of positive, neutral, and concern feedback">
                {analytics.days.map((day) => (
                  <div key={day.key} className="sentiment-column" title={`${day.label}: ${day.total} item${day.total === 1 ? '' : 's'}`}>
                    <div className="sentiment-bar-shell">
                      <div className="sentiment-bar" style={{ height: `${Math.max((day.total / analytics.maxDayTotal) * 100, day.total ? 11 : 0)}%` }}>
                        {(['positive', 'neutral', 'concern'] as Sentiment[]).map((sentiment) => day.sentiments[sentiment] > 0 && (
                          <span key={sentiment} className={sentiment} style={{ flexGrow: day.sentiments[sentiment] }} />
                        ))}
                      </div>
                    </div>
                    <strong>{day.total || '–'}</strong><small>{day.label}</small>
                  </div>
                ))}
              </div>
            </div>

            <div className="feedback-analytics-breakdown">
              <div className="feedback-analytics-section-heading"><div><h3>Signal mix</h3><p>{total} total feedback item{total === 1 ? '' : 's'}</p></div></div>
              <div className="signal-mix-bar" aria-label={`Positive ${analytics.positiveShare} percent, neutral ${percent(analytics.sentiments.neutral, total)} percent, concern ${analytics.concernShare} percent`}>
                <span className="positive" style={{ width: `${analytics.positiveShare}%` }} /><span className="neutral" style={{ width: `${percent(analytics.sentiments.neutral, total)}%` }} /><span className="concern" style={{ width: `${analytics.concernShare}%` }} />
              </div>
              <div className="signal-mix-legend">
                <span><i className="sentiment-dot positive" /> Positive <strong>{analytics.sentiments.positive}</strong></span>
                <span><i className="sentiment-dot neutral" /> Neutral <strong>{analytics.sentiments.neutral}</strong></span>
                <span><i className="sentiment-dot concern" /> Concern <strong>{analytics.sentiments.concern}</strong></span>
              </div>
              <div className="feedback-top-theme"><span><Lightbulb size={17} /></span><div><small>Most common type</small><strong>{kindLabels[analytics.strongestCategory]}</strong><p>{topKindCount} item{topKindCount === 1 ? '' : 's'} in this theme.</p></div></div>
              <div className="feedback-analytics-note"><Minus size={14} /> Sentiment is an aid for triage, not a decision-maker. Review the underlying message before acting.</div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
