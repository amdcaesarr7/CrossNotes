/**
 * Vault content hooks — same lazy-import pattern as useStaticChapters in
 * useContent.ts. One vault-<slug>.json per subject, plus vault-general.json
 * for cross-subject study assets. Never touches Firestore — read-only static
 * content, exactly like the rest of the app's subject/chapter data.
 *
 * To add Vault content for a subject: drop/edit src/data/vault/vault-<slug>.json.
 * To add a brand-new subsection: just fill in an empty subsecN slot — no
 * code change needed, VaultSubjectPage only renders slots that have entries.
 */

import { useState, useEffect } from "react";
import type { VaultSubjectContent, VaultSubsection } from "@/types/vault";
import { isVisibleSubsection } from "@/types/vault";

async function loadVault(slug: string): Promise<VaultSubjectContent | null> {
  try {
    switch (slug) {
      case "general": {
        const m = await import("@/data/vault/vault-general.json");
        return m.default as VaultSubjectContent;
      }
      case "science-1": {
        const m = await import("@/data/vault/vault-science-1.json");
        return m.default as VaultSubjectContent;
      }
      case "science-2": {
        const m = await import("@/data/vault/vault-science-2.json");
        return m.default as VaultSubjectContent;
      }
      case "maths-1": {
        const m = await import("@/data/vault/vault-maths-1.json");
        return m.default as VaultSubjectContent;
      }
      case "maths-2": {
        const m = await import("@/data/vault/vault-maths-2.json");
        return m.default as VaultSubjectContent;
      }
      case "english": {
        const m = await import("@/data/vault/vault-english.json");
        return m.default as VaultSubjectContent;
      }
      case "marathi": {
        const m = await import("@/data/vault/vault-marathi.json");
        return m.default as VaultSubjectContent;
      }
      case "hindi": {
        const m = await import("@/data/vault/vault-hindi.json");
        return m.default as VaultSubjectContent;
      }
      case "history": {
        const m = await import("@/data/vault/vault-history.json");
        return m.default as VaultSubjectContent;
      }
      case "geography": {
        const m = await import("@/data/vault/vault-geography.json");
        return m.default as VaultSubjectContent;
      }
      default:
        return null;
    }
  } catch {
    // Missing file for a subject just means "no vault content yet" —
    // same soft-fail behaviour as loadContent() in useContent.ts.
    return null;
  }
}

/** Non-hook helper — resolves to only the visible (non-empty) subsections,
 *  in subsec1..5 order. Used by both the hook below and the top-level Vault
 *  shelf list, which needs to check many slugs at once (can't call a hook
 *  in a loop, so it calls this directly inside a single useEffect). */
export async function loadVisibleSubsections(slug: string): Promise<VaultSubsection[]> {
  const content = await loadVault(slug);
  const slots = content?.subsections ?? {};
  const ordered = [slots.subsec1, slots.subsec2, slots.subsec3, slots.subsec4, slots.subsec5];
  return ordered.filter(isVisibleSubsection);
}

/** All visible (non-empty) subsections for a subject, in subsec1..5 order. */
export function useVaultSubsections(slug: string) {
  const [subsections, setSubsections] = useState<VaultSubsection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) { setLoading(false); return; }
    setLoading(true);
    loadVisibleSubsections(slug).then(subs => {
      setSubsections(subs);
      setLoading(false);
    });
  }, [slug]);

  return { subsections, loading };
}
