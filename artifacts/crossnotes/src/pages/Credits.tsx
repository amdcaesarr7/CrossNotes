import {
  ArrowUpRight,
  BookMarked,
  Bot,
  Cloud,
  Code2,
  Github,
  HeartHandshake,
  Image,
  Landmark,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Terminal,
  UserRound,
} from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import { useTheme } from '@/contexts/ThemeContext';
import { useHead, useBreadcrumb, getCreditsMeta } from '@/hooks/useSeo';

const sources = [
  {
    title: 'Caesar Anwar',
    role: 'Founder, builder, and everything else',
    description: 'The person behind CrossNotes: product direction, content, design decisions, testing, and the work that brings the whole study experience together.',
    href: 'https://github.com/amdcaesarr7',
    icon: UserRound,
  },
  {
    title: 'ChatGPT',
    role: 'Development collaborator',
    description: 'Used for product thinking, implementation support, debugging, writing, and iteration throughout development.',
    href: 'https://openai.com/chatgpt/',
    icon: MessageSquare,
  },
  {
    title: 'Claude',
    role: 'Development collaborator',
    description: 'Used for code exploration, reasoning, and development support while shaping the CrossNotes experience.',
    href: 'https://claude.ai/',
    icon: Bot,
  },
  {
    title: 'Replit',
    role: 'Development environment',
    description: 'Provided the collaborative environment used to prototype, build, and iterate on CrossNotes.',
    href: 'https://replit.com/',
    icon: Terminal,
  },
  {
    title: 'v0',
    role: 'Interface prototyping',
    description: 'Used for exploring interface ideas and visual directions during development.',
    href: 'https://v0.dev/',
    icon: Code2,
  },
  {
    title: 'Vercel',
    role: 'Development tooling',
    description: 'Development and deployment tooling that supported the web application workflow.',
    href: 'https://vercel.com/',
    icon: Cloud,
  },
  {
    title: 'Gemini',
    role: 'Logo design support',
    description: 'Credited for support with the CrossNotes logo and visual identity exploration.',
    href: 'https://gemini.google.com/',
    icon: Image,
  },
  {
    title: 'OpenCode',
    role: 'Development tooling',
    description: 'Used as part of the broader open development toolkit supporting the project.',
    href: 'https://opencode.ai/',
    icon: Code2,
  },
  {
    title: 'GitHub',
    role: 'Version management',
    description: 'Hosts the source code and provides version control and collaboration infrastructure for CrossNotes.',
    href: 'https://github.com/amdcaesarr7/CrossNotes',
    icon: Github,
  },
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
  const { isDark } = useTheme();
  useHead(getCreditsMeta());
  useBreadcrumb([
    { name: 'Home', url: '/' },
    { name: 'Credits', url: '/credits' },
  ]);

  return (
    <div className={`cn-body ${isDark ? 'dark-mode' : ''} app-page credits-page`}>
      <AppHeader title="Credits & Sources" backHref="/" backLabel="Home" />

      <main className="credits-content">
        <section className="credits-hero clay-card">
          <span className="credits-kicker"><Sparkles size={15} /> Built with care and clear attribution</span>
          <h1>Credits &amp; Sources</h1>
          <p>
            CrossNotes is an independent study companion built with care, collaboration, and clear attribution.
            We believe learners deserve useful tools, respectful credit, and explanations written to help them understand—not just copy an answer.
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
            <span>People, tools &amp; sources</span>
            <h2 id="source-list-title">Everyone who helped CrossNotes</h2>
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
