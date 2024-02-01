import type { NextRequest } from 'next/server';

import { NextResponse } from 'next/server';
import { Octokit } from 'octokit';

import { getServerAuthSession } from '@/server/auth';
import { db } from '@/server/db';

export type TFileRequest = {
  repoName: string;
  ghUsername: string;
};

export async function POST(request: NextRequest) {
  try {
    const { repoName, ghUsername } = (await request.json()) as TFileRequest;
    const session = await getServerAuthSession();

    const account = await db.account.findFirstOrThrow({
      where: {
        userId: session?.user.id
      }
    });
    const octokit = new Octokit({
      auth: account.access_token
    });
    const repoDetails = await octokit.rest.repos.get({
      owner: ghUsername,
      repo: repoName
    });
    const projectTree = await octokit.rest.git.getTree({
      owner: ghUsername,
      repo: repoName,
      tree_sha: repoDetails.data.default_branch,
      recursive: 'true'
    });

    // Filter out unnecessary files through the agent
    const filePaths = projectTree.data.tree
      .filter((file) => file.type == 'blob' && file.path?.endsWith('.rs'))
      .map((file) => file.path);

    return NextResponse.json({ data: filePaths }, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json({ error }, { status: 500 });
  }
}
