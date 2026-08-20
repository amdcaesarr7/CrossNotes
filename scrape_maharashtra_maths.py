"""Scrape Maharashtra Board Class 10 Maths solutions through r.jina.ai.

The index page is fetched through r.jina.ai, its Part 1/Part 2 practice-set and
problem-set links are discovered, and each linked page is fetched through Jina
and saved as Markdown. The default output directory is the Windows path
requested for this task.

Examples (Windows):
    python scrape_maharashtra_maths.py
    python scrape_maharashtra_maths.py --max-pages 3 --output-dir .\\maths2_test
    python scrape_maharashtra_maths.py --include-problem-sets false
"""

from __future__ import annotations

import argparse
import csv
import re
import sys
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable
from urllib.parse import urljoin, urlparse

import requests


INDEX_URL = "https://maharashtraboardsolutions.com/maharashtra-state-board-class-10-maths-solutions/"
JINA_PREFIX = "https://r.jina.ai/"
SOURCE_HOST = "maharashtraboardsolutions.com"
DEFAULT_OUTPUT_DIR = Path(r"C:\Users\admin\Desktop\Scraped content\maths2")

# The discovered URLs follow this shape, including the exceptional 4a/4b suffixes:
# /class-10-maths-solutions-part-{1|2}-chapter-{chapter}-{practice-set|problem-set}-{set}/
TARGET_PATH_RE = re.compile(
    r"^/class-10-maths-solutions-part-(?P<part>[12])-chapter-"
    r"(?P<chapter>\d+)-(?P<kind>practice-set|problem-set)-"
    r"(?P<set>[0-9]+(?:-[0-9]+|[a-z])?)/*$",
    re.IGNORECASE,
)
URL_RE = re.compile(r"https?://[^\s)\]>\"]+", re.IGNORECASE)
MARKDOWN_LINK_RE = re.compile(r"\[[^\]]*\]\((https?://[^)\s]+)(?:\s+[^)]*)?\)")


@dataclass(frozen=True)
class Target:
    title: str
    url: str
    jina_url: str
    part: int
    chapter: int
    kind: str
    set_name: str


class ScrapeError(RuntimeError):
    """Raised when a page cannot be retrieved after retries."""


def jina_url(source_url: str) -> str:
    """Return the r.jina.ai URL for a normal HTTPS page URL."""
    return JINA_PREFIX + source_url


def normalise_url(raw_url: str) -> str:
    """Remove fragments and trailing whitespace while preserving the path."""
    url = raw_url.strip().rstrip(".,;\"'")
    parsed = urlparse(url)
    if not parsed.scheme or not parsed.netloc:
        return ""
    return parsed._replace(fragment="").geturl()


def parse_target(source_url: str, title: str) -> Target | None:
    parsed = urlparse(source_url)
    if parsed.scheme not in {"http", "https"} or parsed.netloc.lower() != SOURCE_HOST:
        return None
    match = TARGET_PATH_RE.match(parsed.path)
    if not match:
        return None
    return Target(
        title=title.strip() or source_url,
        url=source_url,
        jina_url=jina_url(source_url),
        part=int(match.group("part")),
        chapter=int(match.group("chapter")),
        kind=match.group("kind").lower(),
        set_name=match.group("set").lower(),
    )


def extract_index_links(index_markdown: str) -> list[Target]:
    """Extract only the site's Class 10 Maths practice/problem-set URLs."""
    candidates: list[tuple[str, str]] = []

    # Prefer Markdown links because the Jina response normally returns labels.
    for match in MARKDOWN_LINK_RE.finditer(index_markdown):
        url = normalise_url(match.group(1))
        label = re.sub(r"\s+", " ", match.group(0).split("](", 1)[0].lstrip("["))
        candidates.append((label, url))

    # Also support a Jina/index response containing bare URLs.
    if not candidates:
        candidates.extend(("", normalise_url(m.group(0))) for m in URL_RE.finditer(index_markdown))

    targets: list[Target] = []
    seen: set[str] = set()
    for label, url in candidates:
        if not url or url in seen:
            continue
        target = parse_target(url, label)
        if target is not None:
            targets.append(target)
            seen.add(url)

    return sorted(targets, key=lambda item: (item.part, item.chapter, item.kind, item.set_name, item.url))


def fetch_markdown(
    session: requests.Session,
    source_url: str,
    *,
    retries: int,
    timeout: float,
    backoff: float,
) -> str:
    """Fetch one source page through r.jina.ai with bounded retries."""
    endpoint = jina_url(source_url)
    last_error: Exception | None = None
    for attempt in range(1, retries + 1):
        try:
            response = session.get(endpoint, timeout=timeout)
            response.raise_for_status()
            text = response.text.strip()
            if not text:
                raise ScrapeError("r.jina.ai returned an empty response")
            return text + "\n"
        except (requests.RequestException, ScrapeError) as exc:
            last_error = exc
            if attempt < retries:
                time.sleep(backoff * attempt)
    raise ScrapeError(f"Failed to fetch {endpoint}: {last_error}")


def fetch_endpoint_markdown(
    session: requests.Session,
    endpoint: str,
    *,
    retries: int,
    timeout: float,
    backoff: float,
) -> str:
    """Fetch an already-built endpoint, used for the cached-index fallback."""
    last_error: Exception | None = None
    for attempt in range(1, retries + 1):
        try:
            response = session.get(endpoint, timeout=timeout)
            response.raise_for_status()
            text = response.text.strip()
            if not text:
                raise ScrapeError("r.jina.ai returned an empty response")
            return text + "\\n"
        except (requests.RequestException, ScrapeError) as exc:
            last_error = exc
            if attempt < retries:
                time.sleep(backoff * attempt)
    raise ScrapeError(f"Failed to fetch {endpoint}: {last_error}")


def safe_filename(target: Target) -> str:
    """Create a stable Windows-safe filename for an individual page."""
    return f"part-{target.part}_chapter-{target.chapter}_{target.kind}-{target.set_name}.md"


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def write_manifest(path: Path, rows: Iterable[dict[str, str]]) -> None:
    fieldnames = [
        "title", "part", "chapter", "kind", "set_name", "source_url",
        "jina_url", "status", "output_file", "error", "fetched_at_utc",
    ]
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Scrape Class 10 Maharashtra Board Maths practice/problem sets through r.jina.ai."
    )
    parser.add_argument(
        "--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR,
        help=f"Output directory (default: {DEFAULT_OUTPUT_DIR})",
    )
    parser.add_argument(
        "--index-url", default=INDEX_URL,
        help="Index page used to discover the target links.",
    )
    parser.add_argument(
        "--delay", type=float, default=1.0,
        help="Seconds to wait between page requests (default: 1.0).",
    )
    parser.add_argument(
        "--timeout", type=float, default=60.0,
        help="HTTP timeout in seconds (default: 60).",
    )
    parser.add_argument(
        "--retries", type=int, default=3,
        help="Attempts per page (default: 3).",
    )
    parser.add_argument(
        "--max-pages", type=int, default=0,
        help="Fetch only the first N target pages; 0 fetches all discovered pages.",
    )
    parser.add_argument(
        "--include-problem-sets", choices=("true", "false"), default="true",
        help="Include Problem Set pages as well as Practice Set pages (default: true).",
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Discover and write the manifest without fetching individual pages.",
    )
    return parser


def main() -> int:
    args = build_parser().parse_args()
    if args.delay < 0 or args.retries < 1 or args.max_pages < 0:
        print("--delay must be >= 0; --retries must be >= 1; --max-pages must be >= 0", file=sys.stderr)
        return 2

    output_dir: Path = args.output_dir.expanduser()
    output_dir.mkdir(parents=True, exist_ok=True)
    session = requests.Session()
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (compatible; MaharashtraMathsScraper/1.0)",
        "Accept": "text/plain,text/markdown,text/html;q=0.9,*/*;q=0.8",
    })

    print(f"Fetching index through r.jina.ai: {jina_url(args.index_url)}")
    try:
        index_markdown = fetch_markdown(
            session, args.index_url, retries=args.retries,
            timeout=args.timeout, backoff=2.0,
        )
    except ScrapeError as exc:
        print(str(exc), file=sys.stderr)
        return 1

    write_text(output_dir / "source_index.md", index_markdown)
    targets = extract_index_links(index_markdown)
    if not targets:
        # Some cached Jina snapshots of this index contain only a placeholder.
        # A second Jina pass exposes the complete Markdown link list.
        try:
            print("The first index snapshot was incomplete; retrying through a Jina-wrapped index.")
            source_http_url = re.sub(r"^https://", "http://", args.index_url, flags=re.IGNORECASE)
            wrapped_endpoint = JINA_PREFIX + "http://r.jina.ai/" + source_http_url
            wrapped_index = fetch_endpoint_markdown(
                session, wrapped_endpoint, retries=args.retries,
                timeout=args.timeout, backoff=2.0,
            )
            write_text(output_dir / "source_index.md", wrapped_index)
            index_markdown = wrapped_index
            targets = extract_index_links(index_markdown)
        except ScrapeError as exc:
            print(f"Index fallback failed: {exc}", file=sys.stderr)
    if args.include_problem_sets == "false":
        targets = [target for target in targets if target.kind != "problem-set"]
    if args.max_pages:
        targets = targets[: args.max_pages]

    if not targets:
        print("No matching Part 1/Part 2 practice-set or problem-set URLs were discovered.", file=sys.stderr)
        return 1

    print(f"Discovered {len(targets)} target pages.")
    manifest_rows: list[dict[str, str]] = []
    combined_sections: list[str] = [
        "# Maharashtra State Board Class 10 Maths Solutions\n",
        f"Source index: {args.index_url}\n",
        f"Retrieved through r.jina.ai on {datetime.now(timezone.utc).isoformat()}\n",
    ]

    for number, target in enumerate(targets, start=1):
        relative_path = Path(f"part-{target.part}") / f"chapter-{target.chapter}" / safe_filename(target)
        destination = output_dir / relative_path
        timestamp = datetime.now(timezone.utc).isoformat()
        print(f"[{number}/{len(targets)}] {target.url}")
        row = {
            "title": target.title,
            "part": str(target.part),
            "chapter": str(target.chapter),
            "kind": target.kind,
            "set_name": target.set_name,
            "source_url": target.url,
            "jina_url": target.jina_url,
            "status": "pending",
            "output_file": str(relative_path),
            "error": "",
            "fetched_at_utc": timestamp,
        }
        if args.dry_run:
            row["status"] = "not_fetched"
            manifest_rows.append(row)
            continue

        try:
            content = fetch_markdown(
                session, target.url, retries=args.retries,
                timeout=args.timeout, backoff=2.0,
            )
            page_header = (
                f"<!-- Source URL: {target.url} -->\n"
                f"<!-- Retrieved through: {target.jina_url} -->\n\n"
            )
            write_text(destination, page_header + content)
            combined_sections.append(
                f"\n\n---\n\n# Part {target.part}, Chapter {target.chapter}, "
                f"{target.kind.replace('-', ' ').title()} {target.set_name}\n\n"
                f"Source: {target.url}\n\n{content}"
            )
            row["status"] = "ok"
        except ScrapeError as exc:
            row["status"] = "error"
            row["error"] = str(exc)
            print(f"  ERROR: {exc}", file=sys.stderr)
        manifest_rows.append(row)
        if number < len(targets) and args.delay:
            time.sleep(args.delay)

    write_manifest(output_dir / "manifest.csv", manifest_rows)
    write_text(output_dir / "all_solutions.md", "".join(combined_sections))

    ok_count = sum(row["status"] == "ok" for row in manifest_rows)
    error_count = sum(row["status"] == "error" for row in manifest_rows)
    print(f"Finished. Successful pages: {ok_count}; errors: {error_count}.")
    print(f"Output directory: {output_dir.resolve()}")
    return 0 if error_count == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
