import { NextRequest, NextResponse } from 'next/server';
import type { NewsArticle } from '@/lib/news';

const GITHUB_OWNER = 'ZmLone';
const GITHUB_REPO = 'tokenledger';
const GITHUB_BRANCH = 'main';
const NEWS_FILE_PATH = 'src/data/news.json';

function isAuthorized(req: NextRequest): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const authHeader = req.headers.get('x-admin-password') || req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  return authHeader === expected;
}

async function fetchGitHubNewsFile(token: string): Promise<{ sha: string; articles: NewsArticle[] }> {
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${NEWS_FILE_PATH}?ref=${GITHUB_BRANCH}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`GitHub GET failed (${res.status}): ${errText}`);
  }

  const data = (await res.json()) as { sha: string; content: string };
  const decoded = Buffer.from(data.content, 'base64').toString('utf-8');
  const parsed = JSON.parse(decoded);
  return {
    sha: data.sha,
    articles: Array.isArray(parsed) ? (parsed as NewsArticle[]) : [],
  };
}

async function commitGitHubNewsFile(
  token: string,
  sha: string,
  articles: NewsArticle[],
  commitMessage: string
) {
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${NEWS_FILE_PATH}`;
  const contentBase64 = Buffer.from(`${JSON.stringify(articles, null, 2)}\n`, 'utf-8').toString('base64');

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify({
      message: commitMessage,
      content: contentBase64,
      sha,
      branch: GITHUB_BRANCH,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`GitHub PUT failed (${res.status}): ${errText}`);
  }

  return res.json();
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'Missing GITHUB_TOKEN' }, { status: 500 });
  }

  try {
    const { articles } = await fetchGitHubNewsFile(token);
    return NextResponse.json({ articles });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load news';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'Missing GITHUB_TOKEN' }, { status: 500 });
  }

  try {
    const body = (await req.json()) as {
      article: NewsArticle;
      originalSlug?: string;
    };

    if (!body?.article?.slug || !body?.article?.title) {
      return NextResponse.json({ error: 'Article slug and title are required' }, { status: 400 });
    }

    const { sha, articles } = await fetchGitHubNewsFile(token);
    const nowIso = new Date().toISOString();

    const sanitized: NewsArticle = {
      ...body.article,
      slug: body.article.slug.trim(),
      title: body.article.title.trim(),
      summary: (body.article.summary || '').trim(),
      publishedAt: body.article.publishedAt || nowIso,
      updatedAt: nowIso,
      relatedModelSlugs: Array.isArray(body.article.relatedModelSlugs) ? body.article.relatedModelSlugs : [],
      priceDeltas: Array.isArray(body.article.priceDeltas) ? body.article.priceDeltas : [],
      keyTakeaways: Array.isArray(body.article.keyTakeaways) ? body.article.keyTakeaways : [],
      sections: Array.isArray(body.article.sections) ? body.article.sections : [],
      sourceUrls: Array.isArray(body.article.sourceUrls) ? body.article.sourceUrls : [],
    };

    const matchSlug = body.originalSlug?.trim() || sanitized.slug;
    const existingIndex = articles.findIndex((a) => a.slug === matchSlug);

    let updated: NewsArticle[];
    let actionLabel: string;

    if (existingIndex >= 0) {
      updated = [...articles];
      updated[existingIndex] = sanitized;
      actionLabel = `chore(news): update article "${sanitized.slug}"`;
    } else {
      updated = [sanitized, ...articles];
      actionLabel = `feat(news): publish article "${sanitized.slug}"`;
    }

    await commitGitHubNewsFile(token, sha, updated, actionLabel);
    return NextResponse.json({ ok: true, articles: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save news article';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'Missing GITHUB_TOKEN' }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug')?.trim();
    if (!slug) {
      return NextResponse.json({ error: 'Missing slug query parameter' }, { status: 400 });
    }

    const { sha, articles } = await fetchGitHubNewsFile(token);
    const nextArticles = articles.filter((a) => a.slug !== slug);

    if (nextArticles.length === articles.length) {
      return NextResponse.json({ error: `Article "${slug}" not found` }, { status: 404 });
    }

    await commitGitHubNewsFile(token, sha, nextArticles, `chore(news): delete article "${slug}"`);
    return NextResponse.json({ ok: true, articles: nextArticles });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete news article';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
