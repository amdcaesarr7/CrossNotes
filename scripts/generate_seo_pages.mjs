import fs from 'fs';
import path from 'path';

const contentDir = path.resolve('artifacts/crossnotes/src/data/content');
const outDir = path.resolve('extdashboard');

const subjects = [
  {
    slug: 'science-1',
    file: 'science-1.json',
    htmlName: 'science-1.html',
    name: 'Science 1',
    shortTitle: 'Science 1',
    subtitle: 'Physics, Chemistry & Space Science',
    color: '#6b4eff',
    emoji: '🧪',
    metaDesc: 'Free Maharashtra Board Class 10 Science 1 notes, chapter summaries, key concepts, flashcards, and quizzes for Gravitation, Periodic Classification, Chemical Reactions, and more.',
    keywords: 'Maharashtra Board Class 10 Science 1 notes, SSC Science 1 notes, Gravitation Class 10 notes, Periodic Classification of Elements, Chemical Reactions and Equations, Effects of Electric Current notes, Class 10 Science 1 SSC syllabus'
  },
  {
    slug: 'science-2',
    file: 'science-2.json',
    htmlName: 'science-2.html',
    name: 'Science 2',
    shortTitle: 'Science 2',
    subtitle: 'Advanced Biology & Life Sciences',
    color: '#4682b4',
    emoji: '🔬',
    metaDesc: 'Complete Maharashtra Board Class 10 Science 2 notes, Heredity and Evolution, Life Processes, Cell Biology, Environmental Management, and Animal Classification.',
    keywords: 'Maharashtra Board Class 10 Science 2 notes, SSC Science 2 notes, Heredity and Evolution notes, Life Processes Class 10, Animal Classification, Cell Biology and Biotechnology, SSC Board Science 2'
  },
  {
    slug: 'maths-1',
    file: 'maths-1.json',
    htmlName: 'maths-1.html',
    name: 'Maths 1 (Algebra)',
    shortTitle: 'Maths 1',
    subtitle: 'Algebra, Equations & Polynomials',
    color: '#8d63ff',
    emoji: '📐',
    metaDesc: 'Maharashtra Board Class 10 Maths 1 (Algebra) chapter notes, formulas, Linear Equations in Two Variables, Quadratic Equations, Arithmetic Progression, Probability, and Statistics.',
    keywords: 'Maharashtra Board Class 10 Maths 1 notes, SSC Algebra notes, Linear Equations in Two Variables class 10, Quadratic Equations formula sheet, Arithmetic Progression SSC, Probability class 10 notes'
  },
  {
    slug: 'maths-2',
    file: 'maths-2.json',
    htmlName: 'maths-2.html',
    name: 'Maths 2 (Geometry)',
    shortTitle: 'Maths 2',
    subtitle: 'Geometry, Circles & Trigonometry',
    color: '#79bf48',
    emoji: '📊',
    metaDesc: 'Free Maharashtra Board Class 10 Maths 2 (Geometry) theorem guides, Similarity, Pythagoras Theorem, Circles, Coordinate Geometry, Trigonometry formulas, and Mensuration.',
    keywords: 'Maharashtra Board Class 10 Maths 2 notes, SSC Geometry notes, Pythagoras theorem proofs, Similarity Class 10, Circles theorem class 10, Trigonometry formulas SSC, Mensuration class 10'
  },
  {
    slug: 'history',
    file: 'history.json',
    htmlName: 'history.html',
    name: 'History & Political Science',
    shortTitle: 'History',
    subtitle: 'Indian History & Political Science',
    color: '#f08b56',
    emoji: '🏛️',
    metaDesc: 'Maharashtra State Board Class 10 History & Political Science revision notes, chapter overviews, Applied History, Mass Media, Sports, Tourism, and Heritage Management.',
    keywords: 'Maharashtra Board Class 10 History notes, SSC History notes, Historiography Development in the West, Applied History notes, Indian Tradition historiography, Heritage Management class 10'
  },
  {
    slug: 'geography',
    file: 'geography.json',
    htmlName: 'geography.html',
    name: 'Geography',
    shortTitle: 'Geography',
    subtitle: 'Maharashtra Board Geography & Field Study',
    color: '#c276e6',
    emoji: '🌍',
    metaDesc: 'Maharashtra Board Class 10 Geography chapter notes, comparative India-Brazil studies, Physiography, Climate, Natural Vegetation, Wildlife, and Human Settlements.',
    keywords: 'Maharashtra Board Class 10 Geography notes, SSC Geography notes, Physiography and Drainage India Brazil, Climate class 10, Natural Vegetation SSC, Population geography Maharashtra Board'
  }
];

function generateHtml(subj) {
  const contentFile = path.join(contentDir, subj.file);
  const data = JSON.parse(fs.readFileSync(contentFile, 'utf8'));
  const chapters = data.chapters || [];

  const otherSubjs = subjects.filter(s => s.slug !== subj.slug);

  const courseLessons = chapters.map((ch, idx) => ({
    "@type": "CourseInstance",
    "name": `Chapter ${ch.num || idx + 1}: ${ch.title}`,
    "description": ch.overview?.summary || `Chapter notes and revision guide for ${ch.title}.`
  }));

  const schemaJson = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://crossnotes.rf.gd/"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Subjects",
            "item": "https://crossnotes.rf.gd/#subjects"
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": subj.name,
            "item": `https://crossnotes.rf.gd/${subj.htmlName}`
          }
        ]
      },
      {
        "@type": "Course",
        "name": `Class 10 ${subj.name} — Maharashtra State Board`,
        "description": subj.metaDesc,
        "provider": {
          "@type": "Organization",
          "name": "CrossNotes",
          "sameAs": "https://crossnotes.rf.gd/"
        },
        "hasCourseInstance": courseLessons
      }
    ]
  };

  const chapterCardsHtml = chapters.map((ch, idx) => {
    const chNum = ch.num || (idx + 1);
    const summary = ch.overview?.summary || '';
    const learnings = ch.overview?.youWillLearn || [];
    const learnList = learnings.length > 0
      ? `<div class="ch-learnings">
           <strong>Key Concepts:</strong>
           <ul>
             ${learnings.map(l => `<li>${l}</li>`).join('\n             ')}
           </ul>
         </div>`
      : '';

    return `
      <article class="chapter-card clay-panel reveal" id="ch-${ch.id || chNum}">
        <div class="chapter-card__header">
          <span class="ch-badge" style="--ch-color:${subj.color}">Chapter ${chNum}</span>
          <h2 class="ch-title">${ch.title} ${ch.emoji || ''}</h2>
        </div>
        ${summary ? `<p class="ch-summary">${summary}</p>` : ''}
        ${learnList}
        <div class="ch-actions">
          <a href="https://cross-notes-crossnotes-i2u7.vercel.app/notes/${subj.slug}/${ch.id}" class="btn btn-primary btn-sm" target="_blank" rel="noopener">Read Notes →</a>
          <a href="https://cross-notes-crossnotes-i2u7.vercel.app/flashcards/${subj.slug}/${ch.id}" class="btn btn-ghost btn-sm" target="_blank" rel="noopener">Flashcards ◈</a>
          <a href="https://cross-notes-crossnotes-i2u7.vercel.app/quiz/${subj.slug}/${ch.id}" class="btn btn-secondary btn-sm" target="_blank" rel="noopener">Take Quiz ✓</a>
        </div>
      </article>
    `;
  }).join('\n');

  const otherSubjsHtml = otherSubjs.map(s => `
    <a href="${s.htmlName}" class="other-subj-card clay-panel" style="--sc:${s.color}">
      <span class="other-subj-icon">${s.emoji}</span>
      <div>
        <strong>${s.name}</strong>
        <p>${s.subtitle}</p>
      </div>
      <span class="card-arrow">→</span>
    </a>
  `).join('\n');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Class 10 ${subj.name} Notes, Syllabus &amp; Quizzes — Maharashtra Board | CrossNotes</title>
  <meta name="description" content="${subj.metaDesc}">
  <meta name="keywords" content="${subj.keywords}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://crossnotes.rf.gd/${subj.htmlName}">

  <!-- Open Graph -->
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="CrossNotes">
  <meta property="og:title" content="Class 10 ${subj.name} Notes &amp; Revision — Maharashtra Board">
  <meta property="og:description" content="${subj.metaDesc}">
  <meta property="og:url" content="https://crossnotes.rf.gd/${subj.htmlName}">
  <meta property="og:image" content="https://crossnotes.rf.gd/assets/favicon.svg">

  <!-- Twitter -->
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="Class 10 ${subj.name} Notes — Maharashtra Board | CrossNotes">
  <meta name="twitter:description" content="${subj.metaDesc}">
  <meta name="twitter:image" content="https://crossnotes.rf.gd/assets/favicon.svg">

  <meta name="theme-color" content="#f4f1ff">
  <link rel="icon" type="image/svg+xml" href="assets/favicon.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <script>
    (function(){
      var savedTheme = localStorage.getItem('crossnotes-theme');
      var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.dataset.theme = savedTheme || (prefersDark ? 'dark' : 'light');
    })();
  </script>
  <link rel="stylesheet" href="style.css?v=20260820">

  <!-- Schema.org Course & Breadcrumbs -->
  <script type="application/ld+json">
  ${JSON.stringify(schemaJson, null, 2)}
  </script>

  <style>
    .subj-hero {
      padding: 60px 0 45px;
    }
    .breadcrumbs {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      font-weight: 800;
      color: var(--ink-soft);
      margin-bottom: 24px;
    }
    .breadcrumbs a:hover {
      color: var(--purple-dark);
      text-decoration: underline;
    }
    .subj-hero__title {
      font-size: clamp(34px, 5.5vw, 56px);
      margin-bottom: 14px;
    }
    .subj-hero__desc {
      max-width: 680px;
      color: var(--ink-soft);
      font-size: 17px;
      line-height: 1.6;
      margin-bottom: 26px;
    }
    .subj-cta-row {
      display: flex;
      flex-wrap: wrap;
      gap: 14px;
      align-items: center;
    }
    .chapters-section {
      padding: 30px 0 90px;
    }
    .chapters-grid {
      display: flex;
      flex-direction: column;
      gap: 24px;
      max-width: 920px;
      margin: 0 auto;
    }
    .chapter-card {
      padding: 28px 32px;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .chapter-card:hover {
      transform: translateY(-4px);
    }
    .chapter-card__header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }
    .ch-badge {
      padding: 4px 12px;
      border-radius: 999px;
      background: var(--ch-color);
      color: #fff;
      font-size: 11px;
      font-weight: 900;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .ch-title {
      font-size: clamp(20px, 3.5vw, 26px);
      margin: 0;
      color: var(--ink);
    }
    .ch-summary {
      color: var(--ink-soft);
      font-size: 15px;
      line-height: 1.6;
      margin-bottom: 16px;
    }
    .ch-learnings {
      background: rgba(140, 99, 255, 0.08);
      border-radius: var(--r-sm);
      padding: 16px 20px;
      margin-bottom: 20px;
    }
    .ch-learnings strong {
      display: block;
      font-size: 13px;
      color: var(--purple-dark);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 8px;
    }
    .ch-learnings ul {
      margin: 0;
      padding-left: 20px;
    }
    .ch-learnings li {
      font-size: 14px;
      color: var(--ink);
      margin-bottom: 6px;
      line-height: 1.5;
    }
    .ch-learnings li:last-child {
      margin-bottom: 0;
    }
    .ch-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    .other-subjects {
      padding: 40px 0 90px;
    }
    .other-subjs-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
      margin-top: 28px;
    }
    .other-subj-card {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 18px 20px;
      text-decoration: none;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .other-subj-card:hover {
      transform: translateY(-4px);
    }
    .other-subj-icon {
      font-size: 24px;
    }
    .other-subj-card strong {
      display: block;
      font-size: 16px;
      color: var(--ink);
    }
    .other-subj-card p {
      font-size: 12px;
      color: var(--ink-soft);
      margin: 2px 0 0;
    }
    .other-subj-card .card-arrow {
      margin-left: auto;
      color: var(--purple-dark);
      font-weight: 900;
    }
    @media (max-width: 600px) {
      .chapter-card {
        padding: 20px 18px;
      }
      .ch-actions {
        flex-direction: column;
      }
      .ch-actions .btn {
        width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="page-orb page-orb--one" aria-hidden="true"></div>
  <div class="page-orb page-orb--two" aria-hidden="true"></div>

  <header class="nav" id="nav">
    <div class="wrap nav__inner">
      <a href="index.html" class="logo" aria-label="CrossNotes home">
        <svg class="logo__mark" viewBox="0 0 40 40" aria-hidden="true">
          <rect x="1" y="1" width="38" height="38" rx="12" fill="#8c63ff"/>
          <rect x="10" y="8" width="20" height="24" rx="4" fill="#fff"/>
          <path d="M14 15h12M14 20h12M14 25h7" stroke="#8c63ff" stroke-width="2" stroke-linecap="round"/>
          <circle cx="29" cy="29" r="7" fill="#a4e86f"/>
          <path d="m26 29 2 2 4-5" stroke="#263047" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="logo__word">Cross<span>Notes</span></span>
      </a>

      <nav class="nav__links" id="navLinks" aria-label="Primary navigation">
        <a href="index.html#features">Features</a>
        <a href="index.html#subjects">Subjects</a>
        <a href="index.html#leaderboard">Leaderboard</a>
        <a href="index.html#faq">FAQ</a>
        <div class="nav__cta-mobile">
          <button class="theme-toggle theme-toggle--mobile" type="button" data-theme-toggle aria-pressed="false" aria-label="Switch to dark mode">
            <span class="theme-toggle__icon theme-toggle__icon--sun" aria-hidden="true">☼</span>
            <span class="theme-toggle__icon theme-toggle__icon--moon" aria-hidden="true">☾</span>
            <span class="theme-toggle__label">Dark mode</span>
          </button>
          <a href="https://cross-notes-crossnotes-i2u7.vercel.app/subject/${subj.slug}" class="btn btn-primary btn-sm" target="_blank" rel="noopener">Open in App</a>
        </div>
      </nav>

      <div class="nav__cta">
        <button class="theme-toggle" type="button" data-theme-toggle aria-pressed="false" aria-label="Switch to dark mode">
          <span class="theme-toggle__icon theme-toggle__icon--sun" aria-hidden="true">☼</span>
          <span class="theme-toggle__icon theme-toggle__icon--moon" aria-hidden="true">☾</span>
          <span class="theme-toggle__label">Dark mode</span>
        </button>
        <a href="https://cross-notes-crossnotes-i2u7.vercel.app/subject/${subj.slug}" class="btn btn-primary btn-sm" target="_blank" rel="noopener">Open ${subj.shortTitle} in App</a>
      </div>
      <button class="hamburger" id="hamburger" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="navLinks"><span></span><span></span><span></span></button>
    </div>
  </header>

  <main>
    <section class="subj-hero">
      <div class="wrap">
        <nav class="breadcrumbs" aria-label="Breadcrumb">
          <a href="index.html">Home</a>
          <span aria-hidden="true">/</span>
          <a href="index.html#subjects">Subjects</a>
          <span aria-hidden="true">/</span>
          <span aria-current="page">${subj.name}</span>
        </nav>

        <p class="eyebrow" style="background:${subj.color}22; color:${subj.color}">Maharashtra State Board · Class 10</p>
        <h1 class="subj-hero__title">Class 10 <span>${subj.name}</span> Notes &amp; Syllabus</h1>
        <p class="subj-hero__desc">${subj.metaDesc}</p>

        <div class="subj-cta-row">
          <a href="https://cross-notes-crossnotes-i2u7.vercel.app/subject/${subj.slug}" class="btn btn-primary btn-lg" target="_blank" rel="noopener">Launch ${subj.shortTitle} Studio <span aria-hidden="true">→</span></a>
          <a href="#chapters" class="btn btn-ghost btn-lg">Browse ${chapters.length} Chapters ↓</a>
        </div>
      </div>
    </section>

    <section class="chapters-section" id="chapters">
      <div class="wrap">
        <div class="section-heading section-heading--center reveal">
          <p class="eyebrow">Chapter Breakdown</p>
          <h2 class="section-title">All Chapters &amp; Revision Guides</h2>
          <p class="section-sub">Select any chapter below to explore notes, key takeaways, flashcards, and interactive practice quizzes.</p>
        </div>

        <div class="chapters-grid">
          ${chapterCardsHtml}
        </div>
      </div>
    </section>

    <section class="other-subjects">
      <div class="wrap">
        <div class="section-heading reveal">
          <div>
            <p class="eyebrow">Continue Exploring</p>
            <h2 class="section-title">Other Class 10 Subjects</h2>
          </div>
          <p class="section-sub">Switch to any other subject to prepare for your board exams.</p>
        </div>

        <div class="other-subjs-grid reveal">
          ${otherSubjsHtml}
        </div>
      </div>
    </section>
  </main>

  <footer class="footer">
    <div class="wrap footer__grid">
      <div class="footer__brand">
        <a href="index.html" class="logo">
          <svg class="logo__mark" viewBox="0 0 40 40" aria-hidden="true">
            <rect x="1" y="1" width="38" height="38" rx="12" fill="#8c63ff"/>
            <rect x="10" y="8" width="20" height="24" rx="4" fill="#fff"/>
            <path d="M14 15h12M14 20h12M14 25h7" stroke="#8c63ff" stroke-width="2" stroke-linecap="round"/>
            <circle cx="29" cy="29" r="7" fill="#a4e86f"/>
            <path d="m26 29 2 2 4-5" stroke="#263047" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="logo__word">Cross<span>Notes</span></span>
        </a>
        <p>A calmer way to prepare for Maharashtra Board Class 10.</p>
      </div>
      <div class="footer__col">
        <h4>Subjects</h4>
        <a href="science-1.html">Science 1</a>
        <a href="science-2.html">Science 2</a>
        <a href="maths-1.html">Maths 1 (Algebra)</a>
        <a href="maths-2.html">Maths 2 (Geometry)</a>
        <a href="history.html">History</a>
        <a href="geography.html">Geography</a>
      </div>
      <div class="footer__col">
        <h4>Product</h4>
        <a href="index.html#features">Features</a>
        <a href="index.html#leaderboard">Leaderboard</a>
        <a href="index.html#faq">FAQ</a>
      </div>
      <div class="footer__col">
        <h4>Legal &amp; App</h4>
        <a href="privacy.html">Privacy Policy</a>
        <a href="privacy.html#disclaimer">Disclaimer</a>
        <a href="https://cross-notes-crossnotes-i2u7.vercel.app/">Open App</a>
      </div>
    </div>
    <div class="wrap footer__bottom">
      <p>© <span id="year"></span> CrossNotes. Built for focused study.</p>
    </div>
  </footer>
  <script src="js/script.js"></script>
</body>
</html>
`;
}

// Generate all files
for (const subj of subjects) {
  const html = generateHtml(subj);
  const outPath = path.join(outDir, subj.htmlName);
  fs.writeFileSync(outPath, html, 'utf8');
  console.log(`Generated: ${subj.htmlName} (${Math.round(html.length / 1024)} KB)`);
}

console.log('All subject landing pages generated successfully!');
