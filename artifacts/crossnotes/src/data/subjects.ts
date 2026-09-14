// Static subject list — edit this file to add/remove subjects.
// "isLive" controls whether the subject is clickable or shows a "coming soon" lock.

export interface SubjectMeta {
  id: number;
  name: string;
  slug: string;
  emoji: string;
  color: string; // CSS suffix → var(--{color}-bg), var(--{color}-border), var(--{color}-shadow)
  description?: string;
  seoDescription: string;
  learningFocus: string[];
  isLive: boolean;
}

const subjects: SubjectMeta[] = [
  { id: 1, name: "Science 1", slug: "science-1", emoji: "🧪", color: "science", description: "Physics, Chemistry & Space Science", seoDescription: "Maharashtra Board Class 10 Science 1 revision covering physics, chemistry, gravitation, electricity, lenses and space science with concise notes and practice quizzes.", learningFocus: ["Physics formulas and numerical problem solving", "Chemistry reactions and everyday applications", "Space science concepts for board revision"], isLive: true },
  { id: 2, name: "Science 2", slug: "science-2", emoji: "🔬", color: "science", description: "Advanced Biology & Life Sciences", seoDescription: "Free Maharashtra Board Class 10 Science 2 notes for biology and life science topics, including heredity, evolution, environment and biotechnology practice.", learningFocus: ["Biology diagrams and key definitions", "Heredity, evolution and life processes", "Environment and sustainable development"], isLive: true },
  { id: 3, name: "Maths 1 (Algebra)", slug: "maths-1", emoji: "📐", color: "math", description: "Algebra, Equations & Polynomials", seoDescription: "Class 10 Maharashtra Board Maths 1 study material for algebra, linear equations, quadratic equations, arithmetic progressions and probability.", learningFocus: ["Algebraic identities and equations", "Step-by-step board-style problem solving", "Probability and arithmetic progression revision"], isLive: true },
  { id: 4, name: "Maths 2 (Geometry)", slug: "maths-2", emoji: "📊", color: "math", description: "Geometry, Circles & Trigonometry", seoDescription: "Maharashtra Board Class 10 Maths 2 notes and quizzes for geometry, circles, coordinate geometry, trigonometry and mensuration.", learningFocus: ["Theorems, proofs and constructions", "Circles, coordinates and trigonometry", "Exam-ready geometry practice"], isLive: true },
  { id: 5, name: "English", slug: "english", emoji: "📖", color: "lang", description: "Poetry, Prose & Grammar", seoDescription: "English study resources for Maharashtra Board Class 10, covering prose, poetry, writing skills and grammar for exam preparation.", learningFocus: ["Reading comprehension and literature", "Writing skills and grammar", "Vocabulary for board exams"], isLive: false },
  { id: 6, name: "Marathi", slug: "marathi", emoji: "✍️", color: "lang", description: "कविता, गद्य आणि व्याकरण", seoDescription: "मराठी माध्यमासाठी इयत्ता दहावीचे कविता, गद्य आणि व्याकरण अभ्याससाहित्य.", learningFocus: ["कविता आणि गद्य आकलन", "व्याकरणाचा सराव", "लेखन कौशल्य"], isLive: false },
  { id: 7, name: "Hindi", slug: "hindi", emoji: "📝", color: "lang", description: "गद्य, पद्य और व्याकरण", seoDescription: "महाराष्ट्र बोर्ड कक्षा 10 हिंदी के लिए गद्य, पद्य और व्याकरण की परीक्षा तैयारी सामग्री।", learningFocus: ["गद्य और पद्य का अध्ययन", "व्याकरण अभ्यास", "लेखन कौशल"], isLive: false },
  { id: 8, name: "History & Pol. Science", slug: "history", emoji: "🏛️", color: "social", description: "Indian History & Political Science", seoDescription: "Maharashtra Board Class 10 History and Political Science notes covering modern Indian history, democracy, civics and important exam questions.", learningFocus: ["Modern Indian history timelines", "Democracy and political institutions", "Short-answer and long-answer revision"], isLive: true },
  { id: 9, name: "Geography", slug: "geography", emoji: "🌍", color: "violet", description: "Maharashtra Board Geography", seoDescription: "Class 10 Maharashtra Board Geography study material for physical geography, resources, population, industries and map-based exam preparation.", learningFocus: ["Maps, resources and physical geography", "Population and economic geography", "Data interpretation and board questions"], isLive: true },
];

export default subjects;
export function getSubjectBySlug(slug: string): SubjectMeta | undefined {
  return subjects.find(s => s.slug === slug);
}
