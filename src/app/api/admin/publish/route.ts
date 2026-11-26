import { NextRequest, NextResponse } from 'next/server';

interface PublishBody {
  adminPassword?: string;
  modelsJsonContent?: string;
  pendingJsonContent?: string;
  commitMessage?: string;
}

async function getGitHubFileSha(
  owner: string,
  repo: string,
  branch: string,
  filePath: string,
  token: string
): Promise<string> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${encodeURIComponent(branch)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      cache: 'no-store',
    }
  );
  if (!res.ok) {
    throw new Error(`Failed to read ${filePath} from GitHub (${res.status})`);
  }
  const data = await res.json();
  return data.sha as string;
}

async function putGitHubFile(
  owner: string,
  repo: string,
  branch: string,
  filePath: string,
  content: string,
  message: string,
  sha: string,
  token: string
) {
  const encoded = Buffer.from(content, 'utf8').toString('base64');
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify({
      message,
      content: encoded,
      sha,
      branch,
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to update ${filePath} on GitHub (${res.status}): ${errText}`);
  }
}

export async function POST(req: NextRequest) {
  let body: PublishBody;
  try {
    body = (await req.json()) as PublishBody;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON request body.' }, { status: 400 });
  }

  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedPassword) {
    return NextResponse.json(
      {
        ok: false,
        needsSetup: true,
        error: 'ADMIN_PASSWORD is not configured in Vercel Environment Variables yet.',
      },
      { status: 503 }
    );
  }

  if (!body.adminPassword || body.adminPassword !== expectedPassword) {
    return NextResponse.json({ ok: false, error: 'Incorrect admin password.' }, { status: 401 });
  }

  const modelsJsonContent = body.modelsJsonContent;
  const pendingJsonContent = body.pendingJsonContent;
  if (!modelsJsonContent || !pendingJsonContent) {
    return NextResponse.json(
      { ok: false, error: 'Missing modelsJsonContent or pendingJsonContent.' },
      { status: 400 }
    );
  }

  try {
    const parsedModels = JSON.parse(modelsJsonContent);
    if (!Array.isArray(parsedModels) || parsedModels.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Refusing to publish empty or invalid models.json array.' },
        { status: 400 }
      );
    }
    JSON.parse(pendingJsonContent);
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON payload.' }, { status: 400 });
  }

  const githubToken = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_REPO_OWNER || 'ZmLone';
  const repo = process.env.GITHUB_REPO_NAME || 'tokenledger';
  const branch = process.env.GITHUB_REPO_BRANCH || 'main';

  if (!githubToken) {
    return NextResponse.json(
      {
        ok: false,
        needsSetup: true,
        error: 'GITHUB_TOKEN is not configured in Vercel Environment Variables yet. Use Download JSON fallback or add GITHUB_TOKEN for 1-click publish.',
      },
      { status: 503 }
    );
  }

  try {
    const commitMsg =
      body.commitMessage || 'chore(admin): publish approved LLM models, prices & benchmarks';

    const modelsSha = await getGitHubFileSha(
      owner,
      repo,
      branch,
      'src/data/models.json',
      githubToken
    );
    await putGitHubFile(
      owner,
      repo,
      branch,
      'src/data/models.json',
      modelsJsonContent.endsWith('\n') ? modelsJsonContent : modelsJsonContent + '\n',
      commitMsg,
      modelsSha,
      githubToken
    );

    const pendingSha = await getGitHubFileSha(
      owner,
      repo,
      branch,
      'src/data/pending-registry.json',
      githubToken
    );
    await putGitHubFile(
      owner,
      repo,
      branch,
      'src/data/pending-registry.json',
      pendingJsonContent.endsWith('\n') ? pendingJsonContent : pendingJsonContent + '\n',
      `${commitMsg} (clear approved queue)`,
      pendingSha,
      githubToken
    );

    return NextResponse.json({
      ok: true,
      message: 'Committed approved changes to GitHub. Vercel is automatically deploying promptbill.online now!',
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : 'GitHub commit failed.',
      },
      { status: 500 }
    );
  }
}
