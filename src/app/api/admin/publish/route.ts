import { NextRequest, NextResponse } from 'next/server';

interface PublishBody {
  adminPassword?: string;
  modelsJsonContent?: string;
  pendingJsonContent?: string;
  commitMessage?: string;
}

interface GitHubReadResult {
  exists: boolean;
  sha: string | null;
}

async function getGitHubFileSha(
  owner: string,
  repo: string,
  branch: string,
  filePath: string,
  token: string,
  allowMissing = false
): Promise<GitHubReadResult> {
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
  if (res.status === 404 && allowMissing) {
    return { exists: false, sha: null };
  }
  if (!res.ok) {
    throw new Error(`Failed to read ${filePath} from GitHub (${res.status})`);
  }
  const data = await res.json();
  return { exists: true, sha: data.sha as string };
}

async function putGitHubFile(
  owner: string,
  repo: string,
  branch: string,
  filePath: string,
  content: string,
  message: string,
  sha: string | null,
  token: string
) {
  const encoded = Buffer.from(content, 'utf8').toString('base64');
  const payload: Record<string, string> = {
    message,
    content: encoded,
    branch,
  };
  if (sha) {
    payload.sha = sha;
  }

  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify(payload),
  });

  if (res.status === 409) {
    throw new Error(
      `Conflict while updating ${filePath}: another commit updated '${branch}' while you were editing. Refresh /admin to load the latest state and re-apply your changes.`
    );
  }
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

  let modelCount = 0;
  try {
    const parsedModels = JSON.parse(modelsJsonContent);
    if (!Array.isArray(parsedModels) || parsedModels.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Refusing to publish empty or invalid models.json array.' },
        { status: 400 }
      );
    }

    const seenSlugs = new Set<string>();
    for (const entry of parsedModels) {
      if (!entry || typeof entry !== 'object' || !entry.slug || !entry.name) {
        return NextResponse.json(
          { ok: false, error: 'Invalid model record detected (missing required slug or name).' },
          { status: 400 }
        );
      }
      const slug = String(entry.slug);
      if (seenSlugs.has(slug)) {
        return NextResponse.json(
          { ok: false, error: `Duplicate model slug detected in payload: ${slug}` },
          { status: 400 }
        );
      }
      seenSlugs.add(slug);
    }
    modelCount = parsedModels.length;

    const parsedPending = JSON.parse(pendingJsonContent);
    if (!parsedPending || typeof parsedPending !== 'object' || !Array.isArray(parsedPending.items)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid pending-registry.json structure (expected { updatedAt, items[] }).' },
        { status: 400 }
      );
    }
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
        error:
          'GITHUB_TOKEN is not configured in Vercel Environment Variables yet. Use Download JSON fallback or add GITHUB_TOKEN for 1-click publish.',
      },
      { status: 503 }
    );
  }

  try {
    const commitMsg =
      body.commitMessage || 'chore(admin): publish approved LLM models, prices & benchmarks';

    const [modelsFile, pendingFile] = await Promise.all([
      getGitHubFileSha(owner, repo, branch, 'src/data/models.json', githubToken, false),
      getGitHubFileSha(owner, repo, branch, 'src/data/pending-registry.json', githubToken, true),
    ]);

    await putGitHubFile(
      owner,
      repo,
      branch,
      'src/data/models.json',
      modelsJsonContent.endsWith('\n') ? modelsJsonContent : modelsJsonContent + '\n',
      commitMsg,
      modelsFile.sha,
      githubToken
    );

    await putGitHubFile(
      owner,
      repo,
      branch,
      'src/data/pending-registry.json',
      pendingJsonContent.endsWith('\n') ? pendingJsonContent : pendingJsonContent + '\n',
      `${commitMsg} (sync pending queue)`,
      pendingFile.sha,
      githubToken
    );

    return NextResponse.json({
      ok: true,
      publishedCount: modelCount,
      message: `Committed ${modelCount} model(s) & queue state to GitHub (${owner}/${repo}@${branch}). Vercel is automatically deploying promptbill.online now!`,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'GitHub commit failed.';
    const status = msg.startsWith('Conflict while updating') ? 409 : 500;
    return NextResponse.json(
      {
        ok: false,
        error: msg,
      },
      { status }
    );
  }
}
