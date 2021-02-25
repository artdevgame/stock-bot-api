/**
 * Pushing a tree
 *
 * https://github.com/octokit/rest.js/issues/1308
 */
import config from 'config';
import dayjs from 'dayjs';
import fs from 'fs';
import pino from 'pino';

import { Octokit } from '@octokit/rest';

export const logger = pino({ level: 'debug', prettyPrint: true });

interface GitHubConfig {
  accessToken: string;
  base: string;
  head: string;
  owner: string;
  repo: string;
}

interface Push extends Omit<GitHubConfig, 'accessToken'> {
  changes: {
    commit: string;
    files: Record<GitHubFilePath, Base64EncodedFileContents>;
  };
}

type Base64EncodedFileContents = string;
type GitHubFilePath = string;

async function push(github: Octokit, { owner, repo, base, head, changes }: Push) {
  let response;

  if (!base) {
    response = await github.repos.get({ owner, repo });
    // tslint:disable-next-line:no-parameter-reassignment
    base = response.data.default_branch;
  }

  response = await github.repos.listCommits({
    owner,
    repo,
    sha: base,
    per_page: 1,
  });
  let latestCommitSha = response.data[0].sha;
  const treeSha = response.data[0].commit.tree.sha;

  response = await github.git.createTree({
    owner,
    repo,
    base_tree: treeSha,
    tree: Object.keys(changes.files).map((path) => {
      // shut up the compiler...
      const mode: '100644' | '100755' | '040000' | '160000' | '120000' = '100644';
      return {
        path,
        mode,
        content: changes.files[path],
      };
    }),
  });
  const newTreeSha = response.data.sha;

  response = await github.git.createCommit({
    owner,
    repo,
    message: changes.commit,
    tree: newTreeSha,
    parents: [latestCommitSha],
  });
  latestCommitSha = response.data.sha;

  return await github.git.updateRef({
    owner,
    repo,
    sha: latestCommitSha,
    ref: `heads/${head}`,
    force: true,
  });
}

async function run() {
  const { accessToken, ...githubConfig } = config.get('backup.github') as GitHubConfig;

  const github = new Octokit({
    auth: accessToken,
  });

  const changes = {
    files: {
      'auth/key-store.json': fs.readFileSync(`${__dirname}/../src/auth/key-store.json`).toString('utf8'),
      'suppliers/trading212.com/instruments.json': fs
        .readFileSync(`${__dirname}/../src/suppliers/trading212.com/.cache/instruments/instruments.json`)
        .toString('utf8'),
    },
    commit: `${dayjs().format('YYYY-MM-DD')}: Backup from stock-bot-api`,
  };

  logger.info(`Pushing files to GiHub`);

  await push(github, { ...githubConfig, changes });

  logger.info(`[Process complete]`);
}

run();
