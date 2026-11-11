const KV_URL = (
  process.env.KV_REST_API_URL ||
  process.env.UPSTASH_REDIS_REST_URL ||
  ""
).replace(/\/+$/, "");

const KV_TOKEN =
  process.env.KV_REST_API_TOKEN ||
  process.env.UPSTASH_REDIS_REST_TOKEN ||
  "";

export function isCloudKvConfigured(): boolean {
  return Boolean(KV_URL && KV_TOKEN);
}

export function isServerlessRuntime(): boolean {
  return Boolean(process.env.VERCEL || process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME);
}

async function kvCommand<T = unknown>(args: (string | number)[]): Promise<T | null> {
  if (!isCloudKvConfigured()) return null;
  try {
    const res = await fetch(KV_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${KV_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(args),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { result?: T };
    return json?.result !== undefined ? json.result : null;
  } catch {
    return null;
  }
}

export async function kvGetJson<T>(key: string): Promise<T | null> {
  const raw = await kvCommand<string | null>(["GET", key]);
  if (!raw || typeof raw !== "string") return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function kvSetJson(key: string, value: unknown): Promise<boolean> {
  const res = await kvCommand<string>(["SET", key, JSON.stringify(value)]);
  return res === "OK";
}

export async function kvDelete(key: string): Promise<boolean> {
  const res = await kvCommand<number>(["DEL", key]);
  return Number(res) > 0;
}

