import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import type { EquipmentItem, EquipmentStatus } from "../src/types";
import { sourceConfigs, type SourceConfig } from "./sources";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

type FeedCandidate = {
  title: string;
  url: string;
  publishedAt: string;
  summary: string;
  brand: string;
  category: string;
};

const includeTerms = [
  "announce",
  "announces",
  "announced",
  "introduce",
  "introduces",
  "introduced",
  "launch",
  "launches",
  "launched",
  "release",
  "releases",
  "released",
  "unveil",
  "unveils",
  "unveiled",
  "new",
  "camera",
  "cinema",
  "lens",
  "sensor",
  "nikkor",
  "eos",
  "alpha",
  "fx",
  "burano",
  "venice",
  "ursa",
  "pyxis",
  "komodo",
  "v-raptor",
];

const globalExcludeTerms = [
  "software update",
  "firmware update",
  "update!",
  "support",
  "manual",
  "story",
  "column",
  "interview",
  "essay",
  "tips",
  "how to",
  "review",
  "award",
  "accessibility",
  "sustainability",
  "patent",
  "financial",
  "annual report",
  "scholarship",
  "museum",
];

const brandSpecificExclude: Record<string, string[]> = {
  Blackmagic: ["davinci resolve", "video assist", "streaming", "atem", "android", "ios", "blackmagic camera 3", "camera 10."],
  Nikon: [
    "thousand and one nights",
    "a new article",
    "story",
    "z series special content",
    "binocular",
    "binoculars",
    "monarch",
    "prostaff",
    "fieldscope",
    "stabilized",
  ],
  Sony: ["semiconductor solutions", "security cameras", "projector", "accessibility for all"],
  Canon: ["toner", "printer", "lithography", "patent", "wafer", "office", "medical"],
};

function toStatus(publishedAt: string): EquipmentStatus {
  const published = new Date(publishedAt).getTime();
  const daysAgo = (Date.now() - published) / (1000 * 60 * 60 * 24);

  if (Number.isNaN(daysAgo)) return "발표";
  if (daysAgo <= 45) return "발표";
  if (daysAgo <= 180) return "출시 예정";
  return "출시 완료";
}

function normalizeWhitespace(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function inferModel(title: string) {
  return title
    .replace(/^(sony|canon|nikon|blackmagic|red)\s*/i, "")
    .replace(/(introduces|announces|launches|releases|unveils|develops|delivers)/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

function includesUsefulTerms(text: string) {
  const haystack = text.toLowerCase();
  return includeTerms.some((term) => haystack.includes(term));
}

function includesExcludedTerms(text: string, brand: string) {
  const haystack = text.toLowerCase();
  return [...globalExcludeTerms, ...(brandSpecificExclude[brand] || [])].some((term) => haystack.includes(term));
}

function isEquipmentReleaseCandidate(text: string, brand: string) {
  return includesUsefulTerms(text) && !includesExcludedTerms(text, brand);
}

async function fetchText(url: string) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "Production-CEW-Camera-Bot/1.0",
      accept: "application/rss+xml,application/xml,text/xml,text/html,text/plain,*/*",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

function parseRssItems(xml: string, source: SourceConfig): FeedCandidate[] {
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  const candidates: FeedCandidate[] = [];

  for (const match of xml.matchAll(itemRegex)) {
    const block = match[1];
    const title = normalizeWhitespace(block.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || "");
    const url = normalizeWhitespace(block.match(/<link>([\s\S]*?)<\/link>/i)?.[1] || "");
    const publishedAt = normalizeWhitespace(block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1] || "");
    const summary = normalizeWhitespace(
      block.match(/<description>([\s\S]*?)<\/description>/i)?.[1] ||
        block.match(/<content:encoded>([\s\S]*?)<\/content:encoded>/i)?.[1] ||
        "",
    );

    if (!title || !url) continue;
    if (!isEquipmentReleaseCandidate(`${title} ${summary}`, source.brand)) continue;

    candidates.push({
      title,
      url,
      publishedAt: new Date(publishedAt || Date.now()).toISOString(),
      summary,
      brand: source.brand,
      category: source.category,
    });
  }

  return candidates;
}

function parseCanonHtml(html: string, source: SourceConfig): FeedCandidate[] {
  const candidates: FeedCandidate[] = [];
  const yearBlocks = html.match(/<a href="\/en\/news\/\d{4}\/[^"#]+\.html"[\s\S]*?<\/a>/g) || [];

  for (const block of yearBlocks) {
    const href = block.match(/href="([^"]+)"/)?.[1] || "";
    const title = normalizeWhitespace(block);
    const dateMatch = block.match(/([A-Z][a-z]+\.? \d{1,2}, \d{4}|\d{4}\.\d{2}\.\d{2}|\d{4}\/\d{2}\/\d{2})/);
    const publishedAt = new Date(dateMatch?.[1] || Date.now()).toISOString();

    if (!href || !title) continue;
    if (!isEquipmentReleaseCandidate(title, source.brand)) continue;

    candidates.push({
      title,
      url: new URL(href, source.url).toString(),
      publishedAt,
      summary: title,
      brand: source.brand,
      category: source.category,
    });
  }

  return candidates;
}

function parseSonyHtml(html: string, source: SourceConfig): FeedCandidate[] {
  const candidates: FeedCandidate[] = [];
  const itemRegex = /<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;

  for (const match of html.matchAll(itemRegex)) {
    const href = match[1];
    const anchorText = normalizeWhitespace(match[2]);

    if (!href || !anchorText) continue;
    if (!href.includes("sony.mediaroom.com") && !href.startsWith("/")) continue;
    if (!isEquipmentReleaseCandidate(anchorText, source.brand)) continue;

    const dateMatch = html.slice(Math.max(0, match.index! - 40), match.index! + 20).match(/(\d{2}\/\d{2}\/\d{4})/);
    const publishedAt = dateMatch
      ? new Date(dateMatch[1].replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$3-$1-$2")).toISOString()
      : new Date().toISOString();

    candidates.push({
      title: anchorText,
      url: new URL(href, source.url).toString(),
      publishedAt,
      summary: anchorText,
      brand: source.brand,
      category: source.category,
    });
  }

  return candidates;
}

async function collectFromSource(source: SourceConfig): Promise<FeedCandidate[]> {
  try {
    const body = await fetchText(source.url);

    if (source.type === "rss") {
      return parseRssItems(body, source);
    }

    if (source.brand === "Canon") return parseCanonHtml(body, source);
    if (source.brand === "Sony") return parseSonyHtml(body, source);

    return [];
  } catch (error) {
    console.warn(`[collect] ${source.brand} failed:`, error);
    return [];
  }
}

function toEquipmentItem(candidate: FeedCandidate): EquipmentItem {
  const model = inferModel(candidate.title) || candidate.title;
  return {
    id: `${candidate.brand.toLowerCase()}-${slugify(model)}-${candidate.publishedAt.slice(0, 10)}`,
    brand: candidate.brand,
    model,
    category: candidate.category,
    announced_at: candidate.publishedAt.slice(0, 10),
    release_date: null,
    status: toStatus(candidate.publishedAt),
    summary: candidate.summary || candidate.title,
    news_url: candidate.url,
    product_url: null,
    official_url: candidate.url,
    manual_url: null,
    firmware_url: null,
    featured: /burano|venice|alpha|fx|eos|cinema|nikkor|pyxis|ursa|komodo|v-raptor/i.test(candidate.title),
    is_published: true,
    source_title: candidate.title,
  };
}

async function writeSnapshot(items: EquipmentItem[]) {
  const outDir = path.join(rootDir, "src", "data");
  const outPath = path.join(outDir, "equipment.generated.json");
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(outPath, `${JSON.stringify(items, null, 2)}\n`, "utf8");
  console.log(`[write] saved ${items.length} items to ${path.relative(rootDir, outPath)}`);
}

async function main() {
  const allCandidates = (await Promise.all(sourceConfigs.map((source) => collectFromSource(source)))).flat();

  const deduped = Array.from(new Map(allCandidates.map((item) => [`${item.brand}:${item.url}`, item])).values())
    .sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt))
    .slice(0, 100)
    .map(toEquipmentItem);

  await writeSnapshot(deduped);
  console.log(`[done] collected ${deduped.length} equipment news items`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
