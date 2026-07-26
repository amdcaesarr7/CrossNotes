import { useState } from "react";
import type { Potion } from "@/data/potions";

const warnedAbout = new Set<string>();

/**
 * Renders a potion's icon image if it exists; if the image 404s or is
 * missing, falls back to the emoji and logs a console.warn (once per
 * image, not once per render) so a missing asset is loud in devtools
 * instead of silently invisible.
 */
export default function PotionIcon({ potion, size = 40 }: { potion: Potion; size?: number }) {
  const [failed, setFailed] = useState(false);

  if (!potion.imageSrc || failed) {
    return (
      <span
        role="img"
        aria-label={potion.name}
        style={{ fontSize: size * 0.72, lineHeight: 1, display: "inline-block" }}
      >
        {potion.emoji}
      </span>
    );
  }

  return (
    <img
      src={potion.imageSrc}
      alt={potion.name}
      width={size}
      height={size}
      style={{ objectFit: "contain" }}
      onError={() => {
        if (!warnedAbout.has(potion.imageSrc!)) {
          warnedAbout.add(potion.imageSrc!);
          console.warn(
            `[PotionIcon] "${potion.imageSrc}" for "${potion.name}" failed to load — falling back to emoji ${potion.emoji}. ` +
              `Add the image at that path in /public to show real artwork instead.`,
          );
        }
        setFailed(true);
      }}
    />
  );
}
