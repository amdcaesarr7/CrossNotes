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
    slug: 'super-secret-stuffs-inside',
    name: 'Super secret stuffs inside',
    emoji: '🔐',
    color: 'gold',
    description: 'Extra SSC papers and writing practice',
  },
];

export function getSpecialShelf(slug: string): VaultShelfMeta | undefined {
  return SPECIAL_SHELVES.find((shelf) => shelf.slug === slug);
}
