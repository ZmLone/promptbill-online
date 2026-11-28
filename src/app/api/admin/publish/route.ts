import { NextRequest, NextResponse } from 'next/server';

const GITHUB_OWNER = process.env.GITHUB_OWNER || 'ZmLone';
const GITHUB_REPO = process.env.GITHUB_REPO || 'tokenledger';
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';
const MODELS_PATH = process.env.MODELS_JSON_PATH || 'src/data/models.json';
const PENDING_PATH = process.env.PENDING_JSON_PATH || 'src/data/pending-models.json';
const NEWS_PATH = process.env.NEWS_JSON_PATH || 'src/data/news.json';

async function upsertGitHubFile(
  token: string,
  filePath: string,
  content: string,
  commitMessage: string
) {
  const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  let existingSha: string | undefined;
  const getRes = await fetch(`${apiUrl}?ref=${encodeURIComponent(GITHUB_BRANCH)}`, {
    headers,
    cache: 'no-store',
  });
  if (getRes.ok) {
    const existingData = (await getRes.json()) as { sha?: string };
    existingSha = existingData.sha;
  }

  const encodedContent = Buffer.from(content, 'utf8').toString('base64');
  const putRes = await fetch(apiUrl, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      message: commitMessage,
      content: encodedContent,
      branch: GITHUB_BRANCH,
      ...(existingSha ? { sha: existingSha } : {}),
    }),
  });

  if (!putRes.ok) {
    const errText = await putRes.text();
    throw new Error(`GitHub write failed for ${filePath} (${putRes.status}): ${errText}`);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      adminPassword?: string;
      modelsJsonContent?: string;
      pendingJsonContent?: string;
      newsJsonContent?: string;
      commitMessage?: string;
    };

    const expectedPassword = process.env.ADMIN_PASSWORD;
    const githubToken = process.env.GITHUB_TOKEN;

    if (!expectedPassword || !body.adminPassword || body.adminPassword !== expectedPassword) {
      return NextResponse.json({ error: 'Unauthorized: invalid admin password.' }, { status: 401 });
    }
    if (!githubToken) {
      return NextResponse.json(
        { error: 'Server misconfiguration: GITHUB_TOKEN is not set.' },
        { status: 500 }
      );
    }

    const msg =
      body.commitMessage?.trim() || 'chore(admin): publish PromptBill catalog, queue & news';

    if (typeof body.modelsJsonContent === 'string') {
      await upsertGitHubFile(githubToken, MODELS_PATH, body.modelsJsonContent, msg);
    }
    if (typeof body.pendingJsonContent === 'string') {
      await upsertGitHubFile(githubToken, PENDING_PATH, body.pendingJsonContent, msg);
    }
    if (typeof body.newsJsonContent === 'string') {
      await upsertGitHubFile(githubToken, NEWS_PATH, body.newsJsonContent, msg);
    }

    return NextResponse.json({
      ok: true,
      message: 'Published updates to GitHub. Vercel deployment will start automatically.',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error publishing changes.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
