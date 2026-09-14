import { twMerge } from 'tailwind-merge';

import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Resize a Google/Google-sign-in avatar URL to a specific square size.
 *  Google profile URLs end with `=s96-c`; appending another size segment
 *  produces an invalid URL, so we replace the existing size when present. */
export function googleAvatarUrl(url: string | null | undefined, size: number): string {
  if (!url) return '';
  if (!url.includes('googleusercontent.com')) return url;
  return url.replace(/=s\d+-c([?]|$)/, `=s${size}-c$1`).replace(/=s\d+(-c)?([?]|$)/, `=s${size}-c$2`);
}
