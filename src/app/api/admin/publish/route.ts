import { NextRequest, NextResponse } from 'next/server';

const GITHUB_OWNER = 'ZmLone';
const GITHUB_REPO = 'promptbill-online';
const GITHUB_BRANCH = 'main';

interface PublishRequestBody {
  adminPassword?: string;
  modelsJsonContent?: string;
  pendingJsonContent?: string;
  newsJsonContent?: string;
}

interface ExistingNewsArticle {
  slug?: string;
  publishedAt?: string;
  [key: string]: unknown;
}

async function getFileSha(token: string, filePath: string): Promise<string | null> {
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}?ref=${GITHUB_BRANCH}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    cache: 'no-store',
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed reading ${filePath} (${res.status}): ${errText}`);
  }

  const data = (await res.json()) as { sha?: string };
  return data.sha || null;
}

async function fetchExistingNewsArticles(token: string): Promise<ExistingNewsArticle[]> {
  const filePath = 'src/data/news.json';
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}?ref=${GITHUB_BRANCH}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    cache: 'no-store',
  });

  if (res.status === 404) return [];
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed reading existing ${filePath} (${res.status}): ${errText}`);
  }

  const data = (await res.json()) as { content?: string };
  if (!data.content) return [];
  try {
    const decoded = Buffer.from(data.content, 'base64').toString('utf-8');
    const parsed = JSON.parse(decoded);
    return Array.isArray(parsed) ? (parsed as ExistingNewsArticle[]) : [];
  } catch {
    return [];
  }
}

async function putFileToGitHub(
  token: string,
  filePath: string,
  content: string,
  commitMessage: string
): Promise<void> {
  const sha = await getFileSha(token, filePath);
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`;
  const contentBase64 = Buffer.from(content, 'utf-8').toString('base64');

  const body: Record<string, string> = {
    message: commitMessage,
    content: contentBase64,
    branch: GITHUB_BRANCH,
  };
  if (sha) {
    body.sha = sha;
  }

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed committing ${filePath} (${res.status}): ${errText}`);
  }
}

export async function POST(req: NextRequest) {
  const expectedPassword = process.env.ADMIN_PASSWORD;
  const githubToken = process.env.GITHUB_TOKEN;

  if (!expectedPassword || !githubToken) {
    return NextResponse.json(
      {
        ok: false,
        needsSetup: true,
        error:
          'Server missing ADMIN_PASSWORD or GITHUB_TOKEN environment variables in Vercel project settings.',
      },
      { status: 500 }
    );
  }

  let payload: PublishRequestBody;
  try {
    payload = (await req.json()) as PublishRequestBody;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON request body.' }, { status: 400 });
  }

  const headerPass =
    req.headers.get('x-admin-password') ||
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const providedPassword = (payload.adminPassword || headerPass || '').trim();

  if (!providedPassword || providedPassword !== expectedPassword) {
    return NextResponse.json({ ok: false, error: 'Invalid admin password.' }, { status: 401 });
  }

  const updatedFiles: string[] = [];

  try {
    if (typeof payload.modelsJsonContent === 'string' && payload.modelsJsonContent.trim()) {
      JSON.parse(payload.modelsJsonContent);
      await putFileToGitHub(
        githubToken,
        'src/data/models.json',
        payload.modelsJsonContent,
        'chore(admin): publish approved catalog models.json'
      );
      updatedFiles.push('src/data/models.json');
    }

    if (typeof payload.pendingJsonContent === 'string' && payload.pendingJsonContent.trim()) {
      JSON.parse(payload.pendingJsonContent);
      await putFileToGitHub(
        githubToken,
        'src/data/pending-registry.json',
        payload.pendingJsonContent,
        'chore(admin): sync pending queue pending.json'
      );
      updatedFiles.push('src/data/pending-registry.json');
    }

    if (typeof payload.newsJsonContent === 'string' && payload.newsJsonContent.trim()) {
      const parsedIncoming = JSON.parse(payload.newsJsonContent);
      const stagedArticles = Array.isArray(parsedIncoming)
        ? (parsedIncoming as ExistingNewsArticle[])
        : [];

      if (stagedArticles.length > 0) {
        const existingArticles = await fetchExistingNewsArticles(githubToken);
        const existingBySlug = new Map<string, ExistingNewsArticle>();
        for (const art of existingArticles) {
          if (art?.slug) existingBySlug.set(String(art.slug), art);
        }

        const merged: ExistingNewsArticle[] = [];
        const seenSlugs = new Set<string>();

        for (const item of stagedArticles) {
          if (!item?.slug) continue;
          const slug = String(item.slug);
          const prev = existingBySlug.get(slug);
          merged.push({
            ...prev,
            ...item,
            publishedAt:
              (prev?.publishedAt as string | undefined) ||
              (item.publishedAt as string | undefined) ||
              new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          seenSlugs.add(slug);
        }

        for (const prev of existingArticles) {
          const slug = prev?.slug ? String(prev.slug) : '';
          if (slug && !seenSlugs.has(slug)) {
            merged.push(prev);
          }
        }

        await putFileToGitHub(
          githubToken,
          'src/data/news.json',
          JSON.stringify(merged, null, 2) + '\n',
          'feat(news): publish staged news updates from PromptBill admin'
        );
        updatedFiles.push('src/data/news.json');
      }
    }

    if (updatedFiles.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'No valid JSON payloads provided to publish.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      updatedFiles,
      message: `Committed ${updatedFiles.join(', ')} to ZmLone/promptbill-online (main). Vercel will rebuild automatically.`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'GitHub publish error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
