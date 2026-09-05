import { useEffect, useRef } from 'react';

export interface MetaTags {
  title?: string;
  description?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  twitterCard?: 'summary' | 'summary_large_image';
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  noIndex?: boolean;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface StructuredData {
  type: 'BreadcrumbList' | 'FAQPage' | 'WebSite' | 'Organization';
  data: Record<string, unknown>;
}

const BASE_URL = 'https://crossnotes.rf.gd';

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
  const { title, description, canonical, ogTitle, ogDescription, ogImage, ogUrl, twitterCard, twitterTitle, twitterDescription, twitterImage, noIndex } = tags;

  if (title) {
    document.title = title;
  }

  setMetaTag('description', description);
  setMetaTag('robots', noIndex ? 'noindex, nofollow' : 'index, follow');

  if (canonical) {
    setLinkTag('canonical', canonical, 'seo-canonical');
    setMetaTag('og:url', ogUrl ?? canonical);
  }

  setMetaTag('og:title', ogTitle ?? title, true);
  setMetaTag('og:description', ogDescription ?? description, true);
  setMetaTag('og:image', ogImage ?? `${BASE_URL}/favicon.svg`, true);
  setMetaTag('og:type', 'website', true);

  setMetaTag('twitter:card', twitterCard ?? 'summary');
  setMetaTag('twitter:title', twitterTitle ?? ogTitle ?? title);
  setMetaTag('twitter:description', twitterDescription ?? ogDescription ?? description);
  setMetaTag('twitter:image', twitterImage ?? ogImage ?? `${BASE_URL}/favicon.svg`);
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
  baseUrl: BASE_URL,
};

export function getSubjectMeta(subject: { name: string; description?: string }) {
  return {
    title: `${subject.name} — Free Study Notes, Flashcards & Quizzes | CrossNotes`,
    description: `Master ${subject.name} for Maharashtra Board Class 10 with free notes, flashcards, and quizzes. ${subject.description ?? 'Comprehensive study material to ace your exams.'}`,
  };
}

export function getChapterMeta(subject: { name: string }, chapter: { title: string; overview?: { summary?: string } }, mode: 'notes' | 'flashcards' | 'quiz') {
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
  };
}

export function getLeaderboardMeta() {
  return {
    title: 'Leaderboard — Top Students | CrossNotes',
    description: 'See the top students on CrossNotes leaderboard. Compete with classmates by earning XP through studying notes, flashcards, and quizzes.',
  };
}

export function getProgressMeta() {
  return {
    title: 'My Progress — Track Your Learning | CrossNotes',
    description: 'Track your study progress across all subjects and chapters. See which topics you\'ve mastered and which need more revision.',
  };
}

export function getVaultMeta() {
  return {
    title: 'Resource Vault — Extra Study Materials | CrossNotes',
    description: 'Access additional study resources, past papers, and revision materials in the CrossNotes Resource Vault.',
  };
}

export function getCreditsMeta() {
  return {
    title: 'Credits — About CrossNotes',
    description: 'Learn about the team and resources behind CrossNotes. Maharashtra Board Class 10 study app.',
  };
}
