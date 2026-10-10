# Master AI Generation Guide & JSON Schema Specification

> [!IMPORTANT]
> **STRICT COMPLIANCE DIRECTIVES FOR AI GENERATORS:**
> 1. **STRICT SKELETON ADHERENCE:** You MUST strictly follow the JSON skeleton, schema layout, polymorphic block definitions, and field types specified in this document. Do NOT introduce custom fields, alter object structures, or deviate from the schema.
> 2. **COMPLETE QUESTION EXTRACTION FROM PDF:** When extracting data or generating JSON content from a provided PDF, you MUST strictly copy **every single question, sub-question, exercise, fill-in-the-blank, and practice problem** from the source PDF. No questions may be skipped, summarized, truncated, or omitted under any circumstances.
> 3. **SVG VECTOR GRAPHICS SUPPORT:** SVGs are explicitly confirmed and supported across existing JSON files in two distinct modalities:
>    - **External SVG Reference:** Referenced via `figureSrc` in `figure` notes (e.g., `"/figures/gravitation-force.svg"` in `science-1.json`).
>    - **Raw Inline SVG Markup:** Embedded directly inside `content` strings in `paragraph` notes (e.g., `"svg\n<svg viewBox='0 0 500 300' ..."` in `geography.json`).

---

## 1. Comparative Feature Analysis Across All JSON Files

The workspace contains 9 `.json` content files. Below is the comparative matrix summarizing the structural features, metadata keys, polymorphic note types, SVG usage, and quiz formats present across each file.

| File Name | Chapter Count | Chapter Metadata Fields | Overview Object | Polymorphic Note Types Used | Flashcards | Quiz Types Used | SVG Graphics Confirmed | Special Formatting / Features |
| :--- | :---: | :--- | :---: | :--- | :---: | :--- | :---: | :--- |
| `english.json` | 1 | `id`, `num`, `title`, `emoji` | ❌ | `unspecified` (implicit paragraph) | ✅ | `implicit` (MCQ without `qType`) | ❌ | Minimal baseline structure |
| `geography.json` | 1 | `id`, `num`, `title`, `emoji`, `kind` | ✅ | `paragraph`, `qna` | ✅ | `mcq`, `fill_blank`, `true_false` | ✅ (Inline XML string in `paragraph`) | Multi-quiz polymorphism, `overview.youWillLearn`, inline raw SVG maps |
| `hindi.json` | 0 | None (Empty state) | ❌ | None | ❌ | None | ❌ | Standard root stub (`{"chapters": []}`) |
| `history.json` | 13 | `id`, `num`, `title`, `emoji`, `kind`, `part`, `section` | ✅ | `paragraph`, `fill_blank`, `table`, `heading`, `qna` | ✅ | `mcq` | ❌ | `part` and `section` chapter groupings |
| `marathi.json` | 0 | None (Empty state) | ❌ | None | ❌ | None | ❌ | Standard root stub (`{"chapters": []}`) |
| `maths-1.json` | 6 | `id`, `num`, `title`, `emoji`, `overview` | ✅ | `markdown` | ❌ (empty array) | ❌ (empty array) | ❌ | Full Markdown content blocks with image URLs & `sourceUrl` |
| `maths-2.json` | 7 | `id`, `num`, `title`, `emoji`, `overview` | ✅ | `unspecified` (implicit paragraph) | ❌ (empty array) | ❌ (empty array) | ❌ | Notes with `important` flags, empty quiz/flashcard arrays |
| `science-1.json` | 10 | `id`, `num`, `title`, `emoji`, `kind` | ✅ | `callout`, `diagram`, `figure`, `fill_blank`, `list`, `match_column`, `paragraph`, `qna`, `table` | ✅ | `mcq` | ✅ (External path in `figure.figureSrc`) | Rich visual note blocks (`figure`, `diagram`, `callout`, `match_column`), external SVG figures |
| `science-2.json` | 10 | `id`, `num`, `title`, `emoji`, `kind` | ✅ | `heading`, `list`, `paragraph`, `qna`, `table` | ✅ | `mcq`, `true_false` | ❌ | Mixed structured notes & multi-type quizzes |

---

## 2. SVG Implementation Verification

SVGs are confirmed to be present in the workspace files. The AI generator must support both implementation patterns when handling graphical diagrams:

### Pattern A: External SVG Asset Reference (`science-1.json`)
Used inside `figure` type note blocks:
```json
{
  "id": "n-fig-grav",
  "type": "figure",
  "title": "Mutual gravitational force",
  "figureSrc": "/figures/gravitation-force.svg",
  "figureAlt": "Two masses M1 and M2 with equal and opposite gravitational forces",
  "figureCaption": "Forces are equal in magnitude, opposite in direction.",
  "figureLabels": [
    { "text": "M₁", "x": 18, "y": 42, "side": "left" },
    { "text": "M₂", "x": 82, "y": 42, "side": "right" }
  ],
  "important": true
}
```

### Pattern B: Raw Inline SVG Markup (`geography.json`)
Used inside standard `paragraph` type note blocks where vector graphics are embedded directly in code:
```json
{
  "id": "n64",
  "type": "paragraph",
  "title": "SVG Diagram: India — Transport Network",
  "content": "svg\n<svg viewBox='0 0 500 300' xmlns='http://www.w3.org/2000/svg'>\n  <rect x='20' y='20' width='460' height='260' fill='#f4f4f4'/>\n</svg>"
}
```

---

## 3. Complete Master JSON Skeleton

The following JSON skeleton demonstrates every possible field, node type, and polymorphic structure supported across all 9 JSON files. The AI **MUST STRICTLY FOLLOW THIS SKELETON STRUCTURE**.

```json
{
  "chapters": [
    {
      "id": "<string: unique chapter identifier, e.g., 'ch-1' or 'science-ch1'>",
      "num": "<integer: chapter number, e.g., 1>",
      "title": "<string: chapter title>",
      "emoji": "<string: single emoji icon, e.g., '🔬'>",
      "kind": "<optional string: 'chapter'>",
      "part": "<optional string: group heading, e.g., 'Part 1: Ancient History'>",
      "section": "<optional string: section heading, e.g., 'Section A'>",
      "overview": {
        "summary": "<string: chapter summary narrative>",
        "youWillLearn": [
          "<string: key learning objective 1>",
          "<string: key learning objective 2>"
        ]
      },
      "notes": [
        {
          "id": "<string: note identifier, e.g., 'n1'>",
          "type": "paragraph",
          "title": "<string: section title>",
          "content": "<string: paragraph text, formatted markdown, or inline raw SVG>",
          "important": "<optional boolean: true | false>"
        },
        {
          "id": "<string: note identifier>",
          "type": "heading",
          "content": "<string: section header text>"
        },
        {
          "id": "<string: note identifier>",
          "type": "markdown",
          "title": "<string: section title>",
          "content": "<string: multi-line raw markdown text with headers, math, images>",
          "sourceUrl": "<optional string: reference URL>"
        },
        {
          "id": "<string: note identifier>",
          "type": "qna",
          "title": "<optional string: question heading>",
          "question": "<string: question text>",
          "qnaAnswer": "<string: answer text>",
          "important": "<optional boolean: true | false>"
        },
        {
          "id": "<string: note identifier>",
          "type": "callout",
          "calloutKind": "<string: e.g., 'formula' | 'note' | 'warning'>",
          "title": "<string: callout title>",
          "content": "<string: callout body text or equation>"
        },
        {
          "id": "<string: note identifier>",
          "type": "list",
          "title": "<string: list title>",
          "ordered": "<boolean: true for ordered list, false for bullet list>",
          "items": [
            "<string: item text 1>",
            "<string: item text 2>"
          ]
        },
        {
          "id": "<string: note identifier>",
          "type": "table",
          "title": "<string: table title>",
          "headers": [
            "<string: column header 1>",
            "<string: column header 2>"
          ],
          "rows": [
            [
              "<string: row 1 cell 1>",
              "<string: row 1 cell 2>"
            ]
          ]
        },
        {
          "id": "<string: note identifier>",
          "type": "fill_blank",
          "title": "<string: title>",
          "content": "<string: text with '___' placeholder>",
          "blanks": [
            "<string: correct fill answer>"
          ]
        },
        {
          "id": "<string: note identifier>",
          "type": "match_column",
          "title": "<string: title>",
          "left": [
            "<string: left column item 0>",
            "<string: left column item 1>"
          ],
          "right": [
            "<string: right column option 0>",
            "<string: right column option 1>"
          ],
          "answerKey": [
            "<integer: index in right array corresponding to left[0]>",
            "<integer: index in right array corresponding to left[1]>"
          ]
        },
        {
          "id": "<string: note identifier>",
          "type": "diagram",
          "title": "<string: diagram title>",
          "diagramRoot": "<string: central node label>",
          "branches": [
            {
              "label": "<string: branch title>",
              "note": "<string: branch subtitle or description>",
              "children": [
                "<string: leaf node 1>",
                "<string: leaf node 2>"
              ]
            }
          ],
          "content": "<string: usage instruction or notes regarding diagram>"
        },
        {
          "id": "<string: note identifier>",
          "type": "figure",
          "title": "<string: figure title>",
          "figureSrc": "<string: SVG path or URL, e.g., '/figures/gravitation-force.svg'>",
          "figureAlt": "<string: accessible alt text>",
          "figureCaption": "<string: figure caption>",
          "figureLabels": [
            {
              "text": "<string: label text>",
              "x": "<number: x-position percentage>",
              "y": "<number: y-position percentage>",
              "side": "<string: position alignment, e.g., 'top' | 'bottom' | 'left' | 'right'>"
            }
          ],
          "important": "<optional boolean: true | false>"
        },
        {
          "id": "<string: note identifier>",
          "title": "<string: note title>",
          "content": "<string: body content>",
          "important": "<optional boolean: true | false>"
        }
      ],
      "flashcards": [
        {
          "id": "<string: flashcard identifier, e.g., 'fc1'>",
          "front": "<string: question or prompt>",
          "back": "<string: answer or explanation>",
          "order": "<optional integer: 1-based order index>"
        }
      ],
      "quiz": [
        {
          "id": "<string: quiz item identifier, e.g., 'q1'>",
          "qType": "mcq",
          "question": "<string: question text>",
          "options": [
            "<string: option 0>",
            "<string: option 1>",
            "<string: option 2>",
            "<string: option 3>"
          ],
          "correctAnswer": "<integer: 0-based index of correct option>",
          "explanation": "<string: answer explanation>",
          "order": "<integer: question sequence number>"
        },
        {
          "id": "<string: quiz item identifier>",
          "qType": "true_false",
          "question": "<string: statement text>",
          "options": [
            "True",
            "False"
          ],
          "correctAnswer": "<integer: 0 for True, 1 for False>",
          "explanation": "<string: answer explanation>",
          "order": "<integer: question sequence number>"
        },
        {
          "id": "<string: quiz item identifier>",
          "qType": "fill_blank",
          "sentence": "<string: sentence containing '___' placeholder>",
          "wordBank": [
            "<string: option 0>",
            "<string: option 1>",
            "<string: option 2>",
            "<string: option 3>"
          ],
          "correctWord": "<string: target answer string>",
          "options": [],
          "correctAnswer": "<integer: 0-based index of target in wordBank>",
          "explanation": "<string: answer explanation>",
          "order": "<integer: question sequence number>"
        },
        {
          "id": "<string: quiz item identifier>",
          "question": "<string: question text>",
          "options": [
            "<string: option 0>",
            "<string: option 1>",
            "<string: option 2>",
            "<string: option 3>"
          ],
          "correctAnswer": "<integer: 0-based index of correct option>",
          "explanation": "<string: answer explanation>",
          "order": "<integer: question sequence number>"
        }
      ]
    }
  ]
}
```

---

## 4. Comprehensive Schema Field Reference

### 4.1 Root Level
- `chapters` *(array, required)*: List of chapter objects. An empty file must contain `{"chapters": []}`.

---

### 4.2 Chapter Object
- `id` *(string, required)*: Unique identifier for the chapter (e.g., `"ch-1"`, `"geography-ch1"`).
- `num` *(integer, required)*: Sequence number of the chapter (1-indexed).
- `title` *(string, required)*: Display title of the chapter.
- `emoji` *(string, required)*: Single emoji representing the chapter subject (e.g., `"📐"`).
- `kind` *(string, optional)*: Explicit taxonomy tag (e.g., `"chapter"`).
- `part` *(string, optional)*: Macro-level grouping header (e.g., `"Part 1: Ancient History"`).
- `section` *(string, optional)*: Sub-grouping header (e.g., `"Section A"`).
- `overview` *(object, optional)*: Summary container containing:
  - `summary` *(string)*: High-level overview narrative.
  - `youWillLearn` *(array of strings)*: List of learning goals.
- `notes` *(array of objects, required)*: Array of polymorphic note blocks.
- `flashcards` *(array of objects, required)*: Array of flashcard objects (can be empty `[]`).
- `quiz` *(array of objects, required)*: Array of polymorphic quiz items (can be empty `[]`).

---

### 4.3 Notes Block Types (`notes[]`)

Every item in the `notes` array must follow one of these structural models:

#### 1. `paragraph` Note
Used for standard prose notes or raw inline SVG content.
- `id` *(string, required)*
- `type` *(string, required)*: `"paragraph"`
- `title` *(string, optional)*
- `content` *(string, required)*: Textual description, formatted paragraph, or raw inline SVG code string.
- `important` *(boolean, optional)*: Highlights key notes when `true`.

#### 2. `heading` Note
Used to break up content within a chapter into logical sections.
- `id` *(string, required)*
- `type` *(string, required)*: `"heading"`
- `content` *(string, required)*: Header text.

#### 3. `markdown` Note
Used for long-form formatted textbook content, mathematical problems, and inline images.
- `id` *(string, required)*
- `type` *(string, required)*: `"markdown"`
- `title` *(string, optional)*
- `content` *(string, required)*: Multi-line raw Markdown string.
- `sourceUrl` *(string, optional)*: Reference hyperlink to source material.

#### 4. `qna` Note
Used for inline Question & Answer pairs.
- `id` *(string, required)*
- `type` *(string, required)*: `"qna"`
- `title` *(string, optional)*: Question title or label.
- `question` *(string, required)*: Prompt string.
- `qnaAnswer` *(string, required)*: Answer text.
- `important` *(boolean, optional)*

#### 5. `callout` Note
Used to highlight key formulas, rules, or warnings.
- `id` *(string, required)*
- `type` *(string, required)*: `"callout"`
- `calloutKind` *(string, required)*: Discriminator (e.g., `"formula"`, `"note"`, `"warning"`).
- `title` *(string, required)*
- `content` *(string, required)*: Equation or rule explanation.

#### 6. `list` Note
Used for ordered or bulleted item sets.
- `id` *(string, required)*
- `type` *(string, required)*: `"list"`
- `title` *(string, required)*
- `ordered` *(boolean, required)*: `true` for numbered lists, `false` for bullets.
- `items` *(array of strings, required)*: Array of list item strings.

#### 7. `table` Note
Used for structured grid data and matrix comparisons.
- `id` *(string, required)*
- `type` *(string, required)*: `"table"`
- `title` *(string, required)*
- `headers` *(array of strings, required)*: Column headers.
- `rows` *(array of array of strings, required)*: 2D matrix of row cells.

#### 8. `fill_blank` Note
Used for in-line completion notes.
- `id` *(string, required)*
- `type` *(string, required)*: `"fill_blank"`
- `title` *(string, required)*
- `content` *(string, required)*: Sentence containing `___` placeholder.
- `blanks` *(array of strings, required)*: Array of expected answers.

#### 9. `match_column` Note
Used for column matching activities.
- `id` *(string, required)*
- `type` *(string, required)*: `"match_column"`
- `title` *(string, required)*
- `left` *(array of strings, required)*: Left column terms.
- `right` *(array of strings, required)*: Right column terms.
- `answerKey` *(array of integers, required)*: 0-based array where `answerKey[i]` specifies the index in `right` matching `left[i]`.

#### 10. `diagram` Note
Used for tree structures and mind maps.
- `id` *(string, required)*
- `type` *(string, required)*: `"diagram"`
- `title` *(string, required)*
- `diagramRoot` *(string, required)*: Label for the main root node.
- `branches` *(array of objects, required)*: List of branch objects:
  - `label` *(string)*: Sub-topic title.
  - `note` *(string)*: Annotations.
  - `children` *(array of strings)*: Leaf nodes.
- `content` *(string, optional)*: Explanatory text.

#### 11. `figure` Note
Used for annotated images and SVG vector graphic files.
- `id` *(string, required)*
- `type` *(string, required)*: `"figure"`
- `title` *(string, required)*
- `figureSrc` *(string, required)*: Path to SVG file or image URL (e.g., `"/figures/gravitation-force.svg"`).
- `figureAlt` *(string, required)*: Accessible image description.
- `figureCaption` *(string, required)*: Display caption below figure.
- `figureLabels` *(array of objects, required)*: Positioning overlay labels:
  - `text` *(string)*: Label text.
  - `x` *(number)*: Horizontal position percentage.
  - `y` *(number)*: Vertical position percentage.
  - `side` *(string)*: Alignment anchor (`"left"`, `"right"`, `"top"`, `"bottom"`).
- `important` *(boolean, optional)*

#### 12. `unspecified` Note (Implicit Format)
Simple note without an explicit `type` key.
- `id` *(string, required)*
- `title` *(string, required)*
- `content` *(string, required)*
- `important` *(boolean, optional)*

---

### 4.4 Flashcards Array (`flashcards[]`)
- `id` *(string, required)*: Unique flashcard identifier (e.g., `"fc1"`).
- `front` *(string, required)*: Prompt/Question shown on the front.
- `back` *(string, required)*: Answer/Explanation shown on the back.
- `order` *(integer, optional)*: Sequence position index.

---

### 4.5 Quiz Items Array (`quiz[]`)

#### 1. Multiple Choice Question (`mcq`)
- `id` *(string, required)*
- `qType` *(string, optional)*: `"mcq"` (May be omitted in implicit quiz items).
- `question` *(string, required)*: Question statement.
- `options` *(array of 4 strings, required)*: Multiple choice options.
- `correctAnswer` *(integer, required)*: 0-based index of the correct option in `options`.
- `explanation` *(string, required)*: Contextual explanation for the answer.
- `order` *(integer, required)*: 1-indexed question sequence number.

#### 2. True / False Question (`true_false`)
- `id` *(string, required)*
- `qType` *(string, required)*: `"true_false"`
- `question` *(string, required)*: Statement to evaluate.
- `options` *(array of strings, required)*: Exactly `["True", "False"]`.
- `correctAnswer` *(integer, required)*: `0` for True, `1` for False.
- `explanation` *(string, required)*
- `order` *(integer, required)*

#### 3. Fill-in-the-Blank Question (`fill_blank`)
- `id` *(string, required)*
- `qType` *(string, required)*: `"fill_blank"`
- `sentence` *(string, required)*: Sentence containing `___` placeholder.
- `wordBank` *(array of strings, required)*: Available choices for the blank.
- `correctWord` *(string, required)*: The correct string answer.
- `options` *(array, required)*: Always set to `[]` (empty list).
- `correctAnswer` *(integer, required)*: Index of `correctWord` inside `wordBank`.
- `explanation` *(string, required)*
- `order` *(integer, required)*

---

## 5. Mandatory AI Generation Execution Rules

When generating JSON content from input PDFs or text sources:

1. **STRICT SKELETON CONFORMANCE**: The generated file MUST strictly comply with the schema skeleton in Section 3. No field renames, key omissions, or custom keys are allowed.
2. **EXHAUSTIVE PDF QUESTION COPYING**: **EVERY SINGLE QUESTION**, exercise, sub-part, fill-in-the-blank, and practice problem present in the source PDF MUST be transcribed into the JSON (`quiz[]`, `notes[]`, or `qna`). Skipping or summarizing questions is strictly prohibited.
3. **SVG ASSET RETRIEVAL & EMBEDDING**: If the source material contains graphics or visual maps:
   - Provide external SVG asset paths via `figureSrc` (`.svg`).
   - Or embed raw inline SVG markup (`<svg>...</svg>`) in `paragraph` content blocks.
