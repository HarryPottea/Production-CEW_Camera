import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
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

function getEnv(name: string) {
  return process.env[name]?.trim() || "";
}

function toStatus(publishedAt: string): EquipmentStatus {
  const published = new Date(publishedAt).getTime();
  const daysAgo = (Date.now() - published) / (1000 * 60 * 60 * 24);

  if (Number.isNaN(daysAgo)) return "발표";
  if (daysAgo <= 45) return "발표";
  if (daysAgo <= 180) return "출시 예정";
  return "출시 완료";
}

function normalizeWhitespace(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
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
    .replace(/(introduces|announces|launches|releases|unveils)/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

function matchesKeywords(text: string, keywords: string[]) {
  const haystack = text.toLowerCase();
  return keywords.some((keyword) => haystack.includes(keyword.toLowerCase()));
}

async function fetchJson(url: string) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "Production-CEW-Camera-Bot/1.0",
      accept: "application/json,text/plain,*/*",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function fetchText(url: string) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "Production-CEW-Camera-Bot/1.0",
      accept: "application/rss+xml,application/xml,text/xml,text/plain,*/*",
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
    if (!matchesKeywords(`${title} ${summary}`, source.keywords)) continue;

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

function parseSonyJson(payload: any, source: SourceConfig): FeedCandidate[] {
  const list = Array.isArray(payload?.items) ? payload.items : Array.isArray(payload) ? payload : [];

  return list
    .map((item: any) => ({
      title: normalizeWhitespace(item.title || item.headline || ""),
      url: item.url || item.link || "",
      publishedAt: new Date(item.date || item.published_at || Date.now()).toISOString(),
      summary: normalizeWhitespace(item.summary || item.teaser || ""),
      brand: source.brand,
      category: source.category,
    }))
    .filter((item) => item.title && item.url)
    .filter((item) => matchesKeywords(`${item.title} ${item.summary}`, source.keywords));
}

function parseCanonJson(payload: any, source: SourceConfig): FeedCandidate[] {
  const list = Array.isArray(payload?.news) ? payload.news : Array.isArray(payload) ? payload : [];

  return list
    .map((item: any) => ({
      title: normalizeWhitespace(item.title || ""),
      url: item.url || item.link || "",
      publishedAt: new Date(item.date || item.published_at || Date.now()).toISOString(),
      summary: normalizeWhitespace(item.summary || item.description || ""),
      brand: source.brand,
      category: source.category,
    }))
    .filter((item) => item.title && item.url)
    .filter((item) => matchesKeywords(`${item.title} ${item.summary}`, source.keywords));
}

async function collectFromSource(source: SourceConfig): Promise<FeedCandidate[]> {
  try {
    if (source.type === "rss") {
      const xml = await fetchText(source.url);
      return parseRssItems(xml, source);
    }

    const payload = await fetchJson(source.url);

    if (source.brand === "Sony") return parseSonyJson(payload, source);
    if (source.brand === "Canon") return parseCanonJson(payload, source);

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
    official_url: candidate.url,
    manual_url: null,
    firmware_url: null,
    featured: false,
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

async function syncToSupabase(items: EquipmentItem[]) {
  const url = getEnv("VITE_SUPABASE_URL");
  const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !serviceRoleKey) {
    console.log("[supabase] skipped (missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)");
    return;
  }

  const supabase = createClient(url, serviceRoleKey);
  const payload = items.map((item) => ({
    id: item.id,
    brand: item.brand,
    model: item.model,
    category: item.category,
    announced_at: item.announced_at,
    release_date: item.release_date,
    status: item.status,
    summary: item.summary,
    official_url: item.official_url,
    manual_url: item.manual_url,
    firmware_url: item.firmware_url,
    featured: item.featured ?? false,
    is_published: item.is_published ?? true,
    source_title: item.source_title ?? null,
  }));

  const { error } = await supabase.from("equipment").upsert(payload, { onConflict: "id" });
  if (error) {
    throw new Error(`[supabase] upsert failed: ${error.message}`);
  }

  console.log(`[supabase] synced ${payload.length} items`);
}

async function main() {
  const allCandidates = (await Promise.all(sourceConfigs.map((source) => collectFromSource(source)))).flat();

  const deduped = Array.from(
    new Map(allCandidates.map((item) => [`${item.brand}:${item.url}`, item])).values(),
  )
    .sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt))
    .slice(0, 100)
    .map(toEquipmentItem);

  await writeSnapshot(deduped);
  await syncToSupabase(deduped);

  console.log(`[done] collected ${deduped.length} equipment news items`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
