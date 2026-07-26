# /vault static files

Drop actual PDFs here — this whole folder is served as-is at `/vault/...`
by Vite (anything in `public/` is copied verbatim into the build output).

```
public/vault/
  papers/<subject-slug>/<file>.pdf        e.g. papers/geography/2023-july-en.pdf
  study-assets/<subject-slug>/<file>.pdf  e.g. study-assets/geography/formula-sheet.pdf
  study-assets/general/<file>.pdf         cross-subject assets not tied to one subject
```

Then reference the same path as `sourceUrl` in the matching
`src/data/vault/vault-<subject-slug>.json` entry, e.g.:

```json
"sourceUrl": "/vault/papers/geography/2023-july-en.pdf"
```

Official textbook links (eBalbharati) and open-resource links (DIKSHA/NROER)
should stay as external URLs in `sourceUrl` instead — don't put those PDFs
here, the Vault only mirrors content Sunny is allowed to host directly
(past papers already reproduced/OCR'd, and Sunny's own study assets).

Two placeholder entries in `vault-geography.json` and `vault-general.json`
point at files that don't exist yet in this folder — drop the real PDFs in
with matching filenames (or edit the JSON to point wherever you actually
upload them) and the links will start working.
