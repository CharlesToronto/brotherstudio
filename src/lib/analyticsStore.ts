import { promises as fs } from "node:fs";
import path from "node:path";

type AnalyticsData = {
  totalPageViews: number;
  uniqueVisitors: Record<string, true>;
  pageViewsByPath: Record<string, number>;
  dailyPageViews: Record<string, number>;
  lastVisitAt: string | null;
};

export type AnalyticsSummary = {
  totalPageViews: number;
  uniqueVisitors: number;
  pageViewsLast7Days: number;
  lastVisitAt: string | null;
  topPages: Array<{
    path: string;
    views: number;
    sharePercent: number;
  }>;
};

const analyticsFilePath = path.join(process.cwd(), "data", "analytics.json");

function createDefaultData(): AnalyticsData {
  return {
    totalPageViews: 0,
    uniqueVisitors: {},
    pageViewsByPath: {},
    dailyPageViews: {},
    lastVisitAt: null,
  };
}

let writeQueue: Promise<void> = Promise.resolve();

function toDayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function normalizeAnalyticsPath(input: string) {
  const value = input.trim();
  if (!value.startsWith("/")) return "/";

  const hashIndex = value.indexOf("#");
  const noHash = hashIndex === -1 ? value : value.slice(0, hashIndex);
  const queryIndex = noHash.indexOf("?");
  const noQuery = queryIndex === -1 ? noHash : noHash.slice(0, queryIndex);

  const withoutTrailingSlash =
    noQuery.length > 1 && noQuery.endsWith("/") ? noQuery.slice(0, -1) : noQuery;

  if (!withoutTrailingSlash) return "/";
  return withoutTrailingSlash;
}

export function isTrackablePath(pathname: string) {
  if (!pathname.startsWith("/")) return false;
  if (pathname.startsWith("/api")) return false;
  if (pathname.startsWith("/_next")) return false;
  if (pathname.startsWith("/admin")) return false;
  if (pathname === "/favicon.ico") return false;
  return true;
}

async function ensureAnalyticsFile() {
  await fs.mkdir(path.dirname(analyticsFilePath), { recursive: true });

  try {
    await fs.access(analyticsFilePath);
  } catch {
    await fs.writeFile(analyticsFilePath, JSON.stringify(createDefaultData(), null, 2) + "\n");
  }
}

function normalizePositiveInt(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return 0;
  return Math.floor(value);
}

function normalizeStringRecord(value: unknown) {
  if (!value || typeof value !== "object") return {} as Record<string, number>;

  const record = value as Record<string, unknown>;
  const next: Record<string, number> = {};
  for (const [key, val] of Object.entries(record)) {
    const amount = normalizePositiveInt(val);
    if (!key || amount === 0) continue;
    next[key] = amount;
  }

  return next;
}

function normalizeUniqueVisitors(value: unknown) {
  if (!value || typeof value !== "object") return {} as Record<string, true>;

  const record = value as Record<string, unknown>;
  const next: Record<string, true> = {};
  for (const key of Object.keys(record)) {
    if (!key) continue;
    next[key] = true;
  }

  return next;
}

async function readAnalyticsData(): Promise<AnalyticsData> {
  try {
    await ensureAnalyticsFile();
  } catch {
    return createDefaultData();
  }

  try {
    const raw = await fs.readFile(analyticsFilePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return createDefaultData();

    const value = parsed as Partial<AnalyticsData>;
    const data: AnalyticsData = {
      totalPageViews: normalizePositiveInt(value.totalPageViews),
      uniqueVisitors: normalizeUniqueVisitors(value.uniqueVisitors),
      pageViewsByPath: normalizeStringRecord(value.pageViewsByPath),
      dailyPageViews: normalizeStringRecord(value.dailyPageViews),
      lastVisitAt: typeof value.lastVisitAt === "string" ? value.lastVisitAt : null,
    };

    return data;
  } catch {
    return createDefaultData();
  }
}

async function writeAnalyticsData(data: AnalyticsData) {
  try {
    await ensureAnalyticsFile();
    await fs.writeFile(analyticsFilePath, JSON.stringify(data, null, 2) + "\n");
  } catch {
    // Ignore write failures (e.g. read-only file systems).
  }
}

function enqueueWrite<T>(operation: () => Promise<T>) {
  const run = writeQueue.then(operation, operation);
  writeQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export async function recordPageView(input: { path: string; visitorId: string }) {
  const path = normalizeAnalyticsPath(input.path);
  const visitorId = input.visitorId.trim();
  if (!visitorId) return;

  const now = new Date();
  const dayKey = toDayKey(now);

  await enqueueWrite(async () => {
    const data = await readAnalyticsData();

    data.totalPageViews += 1;
    data.uniqueVisitors[visitorId] = true;
    data.pageViewsByPath[path] = (data.pageViewsByPath[path] ?? 0) + 1;
    data.dailyPageViews[dayKey] = (data.dailyPageViews[dayKey] ?? 0) + 1;
    data.lastVisitAt = now.toISOString();

    await writeAnalyticsData(data);
  });
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const data = await readAnalyticsData();

  let views7d = 0;
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() - i);
    const key = toDayKey(date);
    views7d += data.dailyPageViews[key] ?? 0;
  }

  const total = data.totalPageViews;
  const topPages = Object.entries(data.pageViewsByPath)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([path, views]) => ({
      path,
      views,
      sharePercent: total === 0 ? 0 : Math.round((views / total) * 1000) / 10,
    }));

  return {
    totalPageViews: total,
    uniqueVisitors: Object.keys(data.uniqueVisitors).length,
    pageViewsLast7Days: views7d,
    lastVisitAt: data.lastVisitAt,
    topPages,
  };
}
