// Static subject list — edit this file to add/remove subjects.
// "isLive" controls whether the subject is clickable or shows a "coming soon" lock.

export interface SubjectMeta {
  id: number;
  name: string;
  slug: string;
  emoji: string;
  color: string; // CSS suffix → var(--{color}-bg), var(--{color}-border), var(--{color}-shadow)
  description?: string;
  isLive: boolean;
}

const subjects: SubjectMeta[] = [
  { id: 1, name: "Science 1",          slug: "science-1", emoji: "🧪", color: "science", description: "Physics, Chemistry & Space Science", isLive: true  },
  { id: 2, name: "Science 2",          slug: "science-2", emoji: "🔬", color: "science", description: "Advanced Biology & Life Sciences",    isLive: true },
  { id: 3, name: "Maths 1 (Algebra)",  slug: "maths-1",   emoji: "📐", color: "math",    description: "Algebra, Equations & Polynomials",   isLive: true },
  { id: 4, name: "Maths 2 (Geometry)", slug: "maths-2",   emoji: "📊", color: "math",    description: "Geometry, Circles & Trigonometry",   isLive: true },
  { id: 5, name: "English",            slug: "english",   emoji: "📖", color: "lang",    description: "Poetry, Prose & Grammar",            isLive: false },
  { id: 6, name: "Marathi",            slug: "marathi",   emoji: "✍️", color: "lang",    description: "कविता, गद्य आणि व्याकरण",              isLive: false },
  { id: 7, name: "Hindi",              slug: "hindi",     emoji: "📝", color: "lang",    description: "गद्य, पद्य और व्याकरण",                isLive: false },
  { id: 8, name: "History & Pol. Science", slug: "history",   emoji: "🏛️", color: "social",  description: "Indian History & Political Science", isLive: true  },
  { id: 9, name: "Geography",          slug: "geography", emoji: "🌍", color: "violet",  description: "Maharashtra Board Geography",         isLive: true  },
];

export default subjects;
export function getSubjectBySlug(slug: string): SubjectMeta | undefined {
  return subjects.find(s => s.slug === slug);
}
