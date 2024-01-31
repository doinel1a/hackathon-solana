import React from 'react';

import { type Octokit } from 'octokit';

import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

type TReposTableRowProperties = {
  octokit: Octokit;
  ghUsername: string;
  name: string;
  owner: string;
  visibility: string;
};

export default async function ReposTableRow({
  octokit,
  ghUsername,
  name,
  owner,
  visibility
}: TReposTableRowProperties) {
  const repoTree = await getRepoTreeAction(octokit, ghUsername, name);
  const isRepoAuditable = repoTree?.data.tree.some((file) => file.path?.includes('Anchor.toml'));

  return (
    <TableRow
      className={cn({
        'cursor-not-allowed opacity-50 hover:!bg-transparent focus:!bg-transparent': !repoTree
      })}
    >
      <TableCell className='font-medium'>{name}</TableCell>
      <TableCell>{owner}</TableCell>
      <TableCell>{visibility}</TableCell>
      <TableCell>
        <Button disabled={!isRepoAuditable}>Audit</Button>
      </TableCell>
    </TableRow>
  );
}

async function getRepoTreeAction(octokit: Octokit, ghUsername: string, repoName: string) {
  'use server';

  let repoTree = null;

  try {
    const repoDetails = await octokit.rest.repos.get({
      owner: ghUsername,
      repo: repoName
    });

    repoTree = await octokit.rest.git.getTree({
      owner: ghUsername,
      repo: repoName,
      tree_sha: repoDetails.data.default_branch,
      recursive: 'true'
    });
  } catch (error: unknown) {
    console.error('ERROR FETCHING REPO TREE', error);
  }

  return repoTree;
}