import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Memory cache for runtime (and fallback)
const memoryStore = new Map<string, unknown>();

// Local file path fallback for server (in /tmp or project directory)
const getLocalFilePath = (syncId: string) => {
  const safeId = syncId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const tempDir = process.env.VERCEL ? '/tmp' : path.join(process.cwd(), '.data');
  if (!fs.existsSync(tempDir)) {
    try {
      fs.mkdirSync(tempDir, { recursive: true });
    } catch {
      // Ignore if cannot create
    }
  }
  return path.join(tempDir, `progress_${safeId}.json`);
};

// Cloud Upstash Redis / Vercel KV helper
async function getFromKV(key: string) {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  try {
    const res = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.result) {
        return typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
      }
    }
  } catch (err) {
    console.warn('KV get failed, falling back:', err);
  }
  return null;
}

async function saveToKV(key: string, value: unknown) {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return false;

  try {
    const res = await fetch(`${url}/set/${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(value),
    });
    return res.ok;
  } catch (err) {
    console.warn('KV save failed, falling back:', err);
    return false;
  }
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const syncId = searchParams.get('syncId');

  if (!syncId) {
    return NextResponse.json({ error: 'Missing syncId' }, { status: 400 });
  }

  // 1. Try KV / Redis if configured
  const kvData = await getFromKV(`vocab:${syncId}`);
  if (kvData) {
    return NextResponse.json(kvData);
  }

  // 2. Try Memory
  if (memoryStore.has(syncId)) {
    return NextResponse.json(memoryStore.get(syncId));
  }

  // 3. Try Local File fallback
  try {
    const filePath = getLocalFilePath(syncId);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(content);
      memoryStore.set(syncId, parsed);
      return NextResponse.json(parsed);
    }
  } catch {
    // Ignore read errors
  }

  return NextResponse.json({ progress: {}, stats: null });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { syncId, progress, stats, settings, updatedAt } = body;

    if (!syncId) {
      return NextResponse.json({ error: 'Missing syncId' }, { status: 400 });
    }

    const payload = {
      syncId,
      progress: progress || {},
      stats: stats || null,
      settings: settings || null,
      updatedAt: updatedAt || new Date().toISOString(),
    };

    // Save to memory
    memoryStore.set(syncId, payload);

    // Save to KV if configured
    await saveToKV(`vocab:${syncId}`, payload);

    // Save to local file fallback
    try {
      const filePath = getLocalFilePath(syncId);
      fs.writeFileSync(filePath, JSON.stringify(payload), 'utf8');
    } catch {
      // Ignore write errors in readonly serverless environments
    }

    return NextResponse.json({ success: true, savedAt: payload.updatedAt });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to process request', details: String(err) }, { status: 500 });
  }
}
