export interface VaultShelfMeta {
  slug: string;
  name: string;
  emoji: string;
  color: string;
  description: string;
}

export const GENERAL_SHELF: VaultShelfMeta = {
  slug: 'general',
  name: 'General',
  emoji: '🗂️',
  color: 'gold',
  description: "Study assets that aren't tied to one subject",
};

export const SPECIAL_SHELVES: VaultShelfMeta[] = [
  {
    slug: 'scout-and-guide',
    name: 'Scout & Guide',
    emoji: '⚜️',
    color: 'social',
    description: 'Scout and Guide syllabus and reference material',
  },
  {
    slug: 'science-practical',
    name: 'Science Practical',
    emoji: '🧪',
    color: 'blue',
    description: 'Class 10 Science practical experiments and reference material',
  },
];

export function getSpecialShelf(slug: string): VaultShelfMeta | undefined {
  return SPECIAL_SHELVES.find((shelf) => shelf.slug === slug);
}
