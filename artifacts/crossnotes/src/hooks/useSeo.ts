import { useEffect, useRef } from 'react';

export interface MetaTags {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogImageAlt?: string;
  ogImageWidth?: string;
  ogImageHeight?: string;
  ogUrl?: string;
  ogType?: 'website' | 'article' | 'book';
  twitterCard?: 'summary' | 'summary_large_image';
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  twitterSite?: string;
  noIndex?: boolean;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface StructuredData {
  type: 'BreadcrumbList' | 'FAQPage' | 'WebSite' | 'Organization' | 'EducationalOrganization' | 'LearningResource' | 'Article' | 'Quiz';
  data: Record<string, unknown>;
}

const BASE_URL = 'https://cross-notes-crossnotes-i2u7.vercel.app';
const OG_IMAGE_URL = `${BASE_URL}/og-image.png`;
const OG_IMAGE_ALT = 'CrossNotes free Maharashtra Board Class 10 study resources';

function normalizeCanonical(value?: string) {
  if (!value) return undefined;
  return new URL(value, `${BASE_URL}/`).toString();
}

function setMetaTag(name: string, content: string | undefined, isProperty = false) {
  const selector = isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`;
  let el = document.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    if (isProperty) {
      el.setAttribute('property', name);
    } else {
      el.setAttribute('name', name);
    }
    document.head.appendChild(el);
  }
  if (content) {
    el.content = content;
  } else {
    el.remove();
  }
}

function setLinkTag(rel: string, href: string | undefined, id?: string) {
  let el: HTMLLinkElement | null;
  if (id) {
    el = document.getElementById(id) as HTMLLinkElement | null;
    if (!el) {
      el = document.createElement('link');
      el.id = id;
      el.rel = rel;
      document.head.appendChild(el);
    }
  } else {
    const selector = `link[rel="${rel}"]`;
    el = document.querySelector(selector) as HTMLLinkElement | null;
    if (!el) {
      el = document.createElement('link');
      el.rel = rel;
      document.head.appendChild(el);
    }
  }
  if (href) {
    el.href = href;
  } else {
    el.remove();
  }
}

export function applyMetaTags(tags: MetaTags) {
  const { title, description, keywords, canonical, ogTitle, ogDescription, ogImage, ogImageAlt, ogImageWidth, ogImageHeight, ogUrl, ogType, twitterCard, twitterTitle, twitterDescription, twitterImage, twitterSite, noIndex } = tags;
  const normalizedCanonical = normalizeCanonical(canonical ?? (typeof window !== 'undefined' ? window.location.pathname : '/'));
  const image = ogImage ?? OG_IMAGE_URL;

  if (title) document.title = title;

  setMetaTag('description', description);
  setMetaTag('keywords', keywords);
  setMetaTag('robots', noIndex ? 'noindex, nofollow' : 'index, follow');
  setLinkTag('canonical', normalizedCanonical, 'seo-canonical');
  setMetaTag('og:url', ogUrl ?? normalizedCanonical, true);
  setMetaTag('og:title', ogTitle ?? title, true);
  setMetaTag('og:description', ogDescription ?? description, true);
  setMetaTag('og:image', image, true);
  setMetaTag('og:image:alt', ogImageAlt ?? OG_IMAGE_ALT, true);
  setMetaTag('og:image:width', ogImageWidth ?? '1200', true);
  setMetaTag('og:image:height', ogImageHeight ?? '630', true);
  setMetaTag('og:type', ogType ?? 'website', true);
  setMetaTag('twitter:card', twitterCard ?? 'summary_large_image');
  setMetaTag('twitter:title', twitterTitle ?? ogTitle ?? title);
  setMetaTag('twitter:description', twitterDescription ?? ogDescription ?? description);
  setMetaTag('twitter:image', twitterImage ?? image);
  setMetaTag('twitter:image:alt', ogImageAlt ?? OG_IMAGE_ALT);
  setMetaTag('twitter:site', twitterSite);
}

export function buildBreadcrumbSchema(items: BreadcrumbItem[]): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${BASE_URL}${item.url}`,
    })),
  };
  return JSON.stringify(schema);
}

export function buildSubjectSchema(subject: { name: string; description?: string; seoDescription?: string }, slug: string, chapterCount: number): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${subject.name} Maharashtra Board Class 10 Study Resources`,
    description: subject.seoDescription ?? subject.description,
    url: `${BASE_URL}/subject/${slug}`,
    isPartOf: { '@type': 'WebSite', name: 'CrossNotes', url: BASE_URL },
    author: { '@type': 'Organization', name: 'CrossNotes', url: BASE_URL },
    publisher: { '@type': 'Organization', name: 'CrossNotes', url: BASE_URL },
    educationalLevel: 'Class 10',
    learningResourceType: 'Study guide',
    numberOfItems: chapterCount,
    inLanguage: ['en', 'mr', 'hi'],
  });
}

export function setOrganizationSchema() {
  setStructuredData('seo-organization', JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'CrossNotes',
    url: BASE_URL,
    logo: `${BASE_URL}/icons/icon-192.png`,
    description: SEO_DEFAULTS.description,
  }));
}

export function buildFAQSchema(faqs: Array<{ question: string; answer: string }>): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
  return JSON.stringify(schema);
}

export function setStructuredData(id: string, schema: string) {
  const existing = document.getElementById(id);
  if (existing) {
    existing.textContent = schema;
  } else {
    const el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = id;
    el.textContent = schema;
    document.head.appendChild(el);
  }
}

export function removeStructuredData(id: string) {
  const existing = document.getElementById(id);
  if (existing) {
    existing.remove();
  }
}

export function useHead(tags: MetaTags) {
  const tagsRef = useRef(tags);
  tagsRef.current = tags;

  useEffect(() => {
    applyMetaTags(tagsRef.current);
    setOrganizationSchema();
    return () => {
      document.title = 'CrossNotes — Free Notes, Flashcards & Quizzes for Maharashtra Board Class 10';
    };
  }, []);
}

export function useBreadcrumb(items: BreadcrumbItem[]) {
  useEffect(() => {
    if (items.length === 0) return;
    const schema = buildBreadcrumbSchema(items);
    setStructuredData('seo-breadcrumbs', schema);
    return () => removeStructuredData('seo-breadcrumbs');
  }, [items]);
}

export function useFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  useEffect(() => {
    if (faqs.length === 0) return;
    const schema = buildFAQSchema(faqs);
    setStructuredData('seo-faq', schema);
    return () => removeStructuredData('seo-faq');
  }, [faqs]);
}

export const SEO_DEFAULTS = {
  title: 'CrossNotes — Free Notes, Flashcards & Quizzes for Maharashtra Board Class 10',
  description: 'Free notes, flashcards, quizzes, XP and streaks for Maharashtra State Board Class 10. Science 1, Maths and more — study smarter for free.',
  keywords: 'Maharashtra Board Class 10, SSC Class 10, Maharashtra State Board study material, Class 10 notes, Class 10 Science 1 notes, Class 10 Science 2 notes, Class 10 Maths 1 notes, Class 10 Maths 2 notes, Class 10 History notes, Class 10 Geography notes, Maharashtra Board flashcards, Class 10 quizzes, free exam revision',
  baseUrl: BASE_URL,
};

export function getSubjectMeta(subject: { name: string; description?: string }) {
  return {
    title: `${subject.name} — Free Study Notes, Flashcards & Quizzes | CrossNotes`,
    description: (subject as { seoDescription?: string }).seoDescription ?? `Master ${subject.name} for Maharashtra Board Class 10 with free notes, flashcards, and quizzes. ${subject.description ?? 'Comprehensive study material to ace your exams.'}`,
    keywords: `${subject.name}, Maharashtra Board Class 10 ${subject.name}, SSC ${subject.name} notes, Class 10 ${subject.name} notes, ${subject.name} flashcards, ${subject.name} quiz, Maharashtra State Board study material`,
  };
}

export function getChapterMeta(subject: { name: string }, chapter: { title: string; overview?: { summary?: string } }, mode: 'notes' | 'flashcards' | 'quiz', canonical?: string) {
  const modeLabels = {
    notes: 'Study Notes',
    flashcards: 'Flashcards',
    quiz: 'Quiz',
  };
  const modeDescriptions = {
    notes: 'Revise key concepts and important points with our comprehensive study notes.',
    flashcards: 'Test your knowledge with interactive flip cards. Perfect for quick revision.',
    quiz: 'Practice MCQs and check your understanding with detailed explanations.',
  };

  return {
    title: `${chapter.title} ${modeLabels[mode]} — ${subject.name} | CrossNotes`,
    description: `${modeDescriptions[mode]} Chapter covers: ${chapter.title}. ${chapter.overview?.summary?.slice(0, 100) ?? ''}...`,
    keywords: `${chapter.title}, ${subject.name} Maharashtra Board Class 10, Class 10 ${modeLabels[mode].toLowerCase()}, SSC ${subject.name} revision, Maharashtra State Board exam preparation`,
    canonical,
  };
}

export function getLeaderboardMeta() {
  return {
    title: 'Leaderboard — Top Students | CrossNotes',
    description: 'See the top students on CrossNotes leaderboard. Compete with classmates by earning XP through studying notes, flashcards, and quizzes.',
    keywords: 'Class 10 study leaderboard, Maharashtra Board study motivation, CrossNotes XP, Class 10 quiz practice',
  };
}

export function getShopMeta() {
  return {
    title: 'Study Shop — XP Boosts, Streak Freezes & Nicknames | CrossNotes',
    description: 'Use earned CrossNotes coins to unlock XP boosts, streak freezes, and custom leaderboard nicknames for Maharashtra Board Class 10 revision.',
    keywords: 'Class 10 study rewards, Maharashtra Board study motivation, study streaks, exam preparation rewards',
  };
}

export function getProgressMeta() {
  return {
    title: 'My Progress — Track Your Learning | CrossNotes',
    description: 'Track your study progress across all subjects and chapters. See which topics you\'ve mastered and which need more revision.',
    keywords: 'Class 10 study progress, Maharashtra Board revision tracker, study streak, quiz progress, exam preparation tracker',
  };
}

export function getVaultMeta() {
  return {
    title: 'Resource Vault — Extra Study Materials | CrossNotes',
    description: 'Access additional study resources, past papers, and revision materials in the CrossNotes Resource Vault.',
    keywords: 'Maharashtra Board Class 10 textbook, SSC past papers, Maharashtra Board question papers, Class 10 study resources',
  };
}

export function getCreditsMeta() {
  return {
    title: 'Credits — About CrossNotes',
    description: 'Learn about the team and resources behind CrossNotes. Maharashtra Board Class 10 study app.',
    keywords: 'CrossNotes credits, Maharashtra Board Class 10 study app, CrossNotes study platform',
  };
}
