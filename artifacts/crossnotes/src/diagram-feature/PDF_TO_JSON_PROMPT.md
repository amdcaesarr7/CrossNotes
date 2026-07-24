# CrossNotes: PDF → Chapter JSON prompt

## How to use this (foolproof version)

1. Open any AI chat that can read PDFs or long text (Claude, ChatGPT, whatever).
2. Paste the **entire block below** (everything inside the fence) as your first message.
3. Attach or paste the PDF content right after it.
4. Copy the JSON it gives you into `src/data/content/<subject>.json` under a `"chapters"` array.
5. If something looks off, just reply "fix it" — don't hand-edit JSON unless you're comfortable with it.

That's it. You never need to touch the schema yourself — the prompt below defines it strictly enough that the AI does the formatting.

---

## The prompt (copy everything between the lines)

````
You are converting a textbook chapter (PDF or pasted text) into a strict JSON
format for a study app called CrossNotes. Follow this schema EXACTLY. Output
ONLY valid JSON — no markdown code fences, no commentary before or after, no
"here's your JSON" preamble. If you cannot produce valid JSON, say so in plain
text instead of guessing.

CRITICAL RULE: Any note of type "paragraph" (or with no "type" at all) must
contain the ORIGINAL TEXT FROM THE SOURCE, UNCHANGED. Do not summarize,
shorten, simplify, or paraphrase the source content in these blocks — copy it
as-is, just cleaned of page numbers/headers/footers/OCR artifacts. You MAY
summarize only inside the "overview" field, which is explicitly meant to be
a short summary.

Split the chapter into as many "notes" blocks as make sense — don't cram the
whole chapter into one giant paragraph block. One block per section/heading/
idea is ideal.

--- SCHEMA ---
(The // comments below are notes for YOU explaining each field — your actual
JSON output must NOT contain any // comments, since real JSON doesn't support them.)

{
  "chapters": [
    {
      "id": "ch1",                        // short unique id, ch1/ch2/ch3...
      "num": 1,                           // chapter number
      "title": "Chapter title",
      "emoji": "📘",                       // one emoji that fits the topic
      "overview": {
        "summary": "2-4 sentence plain-English summary of what this chapter covers.",
        "youWillLearn": [
          "Short bullet point of one thing they'll learn",
          "Another one",
          "3-6 bullets total"
        ]
      },
      "notes": [
        // ── Every note needs a unique "id" (n1, n2, n3...) and a "type".
        // ── If you omit "type" it defaults to "paragraph".

        { "id": "n1", "type": "heading", "content": "Section Heading" },

        { "id": "n2", "type": "paragraph", "title": "Optional label",
          "content": "Full verbatim paragraph text from the source. Use \n\n for a new paragraph within the same block.",
          "important": false },   // set true only if this is boxed/highlighted/starred in the source as exam-important

        { "id": "n3", "type": "list", "title": "Optional label",
          "ordered": false,        // true = numbered list, false = bullets
          "items": ["Point one", "Point two", "Point three"] },

        { "id": "n4", "type": "table", "title": "Optional label",
          "headers": ["Column A", "Column B"],
          "rows": [["row1 colA", "row1 colB"], ["row2 colA", "row2 colB"]] },

        { "id": "n5", "type": "fill_blank", "title": "Optional label",
          "content": "The powerhouse of the cell is the ___.",
          "blanks": ["mitochondria"] },   // one entry per ___ in content, in order

        { "id": "n6", "type": "match_column", "title": "Optional label",
          "instructions": "Match each term to its definition.",
          "left": ["Term A", "Term B", "Term C"],
          "right": ["Definition matching B", "Definition matching C", "Definition matching A"],
          "answerKey": [2, 0, 1] },  
          // answerKey[i] = index into "right" that correctly matches left[i].
          // Example above: left[0] "Term A" matches right[2]. Get this exactly right — it's graded automatically.

        { "id": "n7", "type": "true_false", "title": "Optional label",
          "statement": "The mitochondria is the powerhouse of the cell.",
          "answer": true },

        { "id": "n8", "type": "qna", "title": "Optional label",
          "question": "What is the powerhouse of the cell?",
          "qnaAnswer": "The mitochondria." },

        { "id": "n9", "type": "diagram",
          "diagramRoot": "Types of Resources",   // the centre node
          "branches": [
            "Renewable", "Non-Renewable", "Biotic", "Abiotic", "Natural",
            null, null, null, null
          ] }
          // Up to 9 branches. Each entry is either a plain string, an
          // object { "label": "...", "note": "short sub-line" }, or null.
          // null (or just leaving the slot out) means "skip this branch" —
          // use this ONLY if the source genuinely has fewer than 9 groups;
          // don't pad with null just to hit 9. Only use "diagram" for
          // content that's actually a classification/branching structure
          // in the source (e.g. "Types of X", "Causes of Y") — not for
          // regular prose, that still goes in "paragraph"/"list".
      ],
      "flashcards": [
        { "id": "f1", "front": "Short question or term", "back": "Short answer", "order": 1 },
        { "id": "f2", "front": "...", "back": "...", "order": 2 }
        // 4-8 flashcards per chapter is typical. Front/back should be SHORT — flashcard-sized, not paragraphs.
      ],
      "quiz": [
        { "id": "q1", "question": "A multiple-choice question testing this chapter",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": 0,          // INDEX (0-3) into "options" of the correct one
          "explanation": "One sentence on why that's correct.",
          "order": 1 }
        // 3-5 quiz questions per chapter is typical.
      ]
    }
    // one object per chapter — repeat the whole structure for each chapter in the PDF
  ]
}

--- END SCHEMA ---

Rules recap:
- Output raw JSON only. No ```json fences, no explanation text.
- "paragraph"/untyped notes = word-for-word from the source, not rewritten.
- Use fill_blank / match_column / true_false / qna to turn source content into
  practice — these ARE allowed to be your own phrasing, since they're
  exercises, not the source record.
- Every id must be unique WITHIN its array (n1, n2... / f1, f2... / q1, q2...).
- correctAnswer and answerKey are zero-indexed integers, not letters.
- If the source has multiple chapters, put them all in one "chapters" array.
- If a field doesn't apply to a note type, just leave it out — don't include empty/null fields.

Now here is the chapter content to convert:

[PASTE YOUR PDF TEXT / ATTACH THE PDF HERE]
````

---

## Notes for you (not part of the prompt)

- **Don't be afraid to run it chapter-by-chapter** if the PDF is long — most AI chats choke on huge pastes anyway. One chapter per message is safer and easier to check.
- **Always skim the output before pasting it into the app** — specifically check `answerKey` on any `match_column` block and `correctAnswer` on quiz questions. Those are the two spots a small AI mistake actually breaks grading instead of just looking a bit off.
- If you paste JSON into a `.json` file and the app shows a blank/broken page, 9 times out of 10 it's a missing comma or an extra trailing comma — paste the file into [jsonlint.com](https://jsonlint.com) to find it in two seconds.
- You don't have to use every note type in every chapter. A chapter of plain `paragraph` + `heading` blocks is a completely valid, normal chapter — the interactive types are there for when the source material actually has fill-in-the-blank/matching/true-false content worth turning into exercises.
