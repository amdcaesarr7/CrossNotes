import { ArrowUpRight, BookMarked, HeartHandshake, Landmark, ShieldCheck, Sparkles } from 'lucide-react';
import AppHeader from '@/components/AppHeader';

const sources = [
  {
    title: 'Maharashtra State Board Mathematics Textbooks',
    role: 'Official textbook reference',
    description: 'Chapter sequence, syllabus context, and question wording are aligned with the English-medium Standard X Mathematics textbooks published by the Maharashtra State Bureau of Textbook Production and Curriculum Research.',
    href: 'https://books.ebalbharati.in/',
    icon: Landmark,
  },
  {
    title: 'Shaalaa',
    role: 'External study-resource credit',
    description: 'Shaalaa is acknowledged as an external study resource for Maharashtra Board learners. CrossNotes does not reproduce Shaalaa pages or solutions; the worked answers in this app are written as native CrossNotes explanations.',
    href: 'https://www.shaalaa.com/',
    icon: BookMarked,
  },
];

export default function Credits() {
  return (
    <div className="app-page credits-page">
      <AppHeader title="Credits & Sources" backHref="/" backLabel="Home" />

      <main className="credits-content">
        <section className="credits-hero clay-card">
          <span className="credits-kicker"><Sparkles size={15} /> Built with care and clear attribution</span>
          <h1>Credits &amp; Sources</h1>
          <p>
            CrossNotes is an independent study companion. We believe learners deserve clear sources,
            respectful credit, and explanations written to help them understand—not just copy an answer.
          </p>
        </section>

        <section className="credits-principles" aria-label="CrossNotes source principles">
          <article className="credits-principle clay-card">
            <ShieldCheck size={22} />
            <div><strong>Transparent attribution</strong><span>We identify the textbook and learning resources that inform the study experience.</span></div>
          </article>
          <article className="credits-principle clay-card">
            <HeartHandshake size={22} />
            <div><strong>Original learner-first explanations</strong><span>CrossNotes explanations are written as native study material for focused revision.</span></div>
          </article>
        </section>

        <section className="credits-section" aria-labelledby="source-list-title">
          <div className="credits-section-heading">
            <span>Source acknowledgements</span>
            <h2 id="source-list-title">Resources we credit</h2>
          </div>
          <div className="credits-source-list">
            {sources.map(({ title, role, description, href, icon: Icon }) => (
              <article className="credits-source-card clay-card" key={title}>
                <span className="credits-source-icon"><Icon size={21} /></span>
                <div className="credits-source-copy">
                  <span>{role}</span>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
                <a href={href} target="_blank" rel="noreferrer" className="credits-source-link" aria-label={`Visit ${title}`}>
                  <span>Visit</span><ArrowUpRight size={16} />
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="credits-note clay-card">
          <BookMarked size={22} />
          <div>
            <h2>About the Maths notes</h2>
            <p>
              Practice-set pages are organised around the question data in CrossNotes. The displayed methods,
              workings, final answers, and page layout are created for this app. When a textbook diagram is useful,
              it is shown as a study aid alongside the relevant explanation.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
