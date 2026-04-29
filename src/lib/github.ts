import { decrypt } from "./crypto";

export interface GitHubRepoMeta {
  name: string;
  full_name: string;
  description: string | null;
  homepage: string | null;
  topics: string[];
}

/**
 * Fetches repository metadata and detects infrastructure configuration.
 */
export async function syncProjectMetadata(
  githubRepoFullName: string,
  githubPat: string,
  masterKey: string
) {
  let pat = githubPat;
  if (pat.includes(":")) {
    pat = await decrypt(pat, masterKey);
  }

  const headers = {
    Authorization: `token ${pat}`,
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "Central-Dashboard",
  };

  // 1. Fetch Repo Metadata
  const repoRes = await fetch(`https://api.github.com/repos/${githubRepoFullName}`, { headers });
  if (!repoRes.ok) throw new Error("Failed to fetch repo metadata");
  const repoData: GitHubRepoMeta = await repoRes.json();

  let isCf = false;
  let cfProjectName = null;
  let isWorker = false;
  let workerName = null;
  let cfD1Id = null;
  let cfR2Bucket = null;

  let isDocker = false;
  let dockerStackName = repoData.name;

  // Check homepage for Cloudflare markers
  if (repoData.homepage?.includes(".pages.dev") || repoData.homepage?.includes(".workers.dev")) {
    isCf = true;
  }

  // 2. Fetch Root File Tree
  const treeRes = await fetch(`https://api.github.com/repos/${githubRepoFullName}/contents/`, { headers });
  if (treeRes.ok) {
    const files = await treeRes.json() as any[];
    
    if (files.some(f => f.name === "docker-compose.yml" || f.name === "docker-compose.yaml" || f.name === "Dockerfile")) {
      isDocker = true;
    }

    const wranglerFile = files.find(f => f.name === "wrangler.toml" || f.name === "wrangler.jsonc" || f.name === "wrangler.json");
    if (wranglerFile) {
      isCf = true;
      const fileRes = await fetch(wranglerFile.url, { headers });
      if (fileRes.ok) {
        const fileData = await fileRes.json();
        const content = atob(fileData.content);
        
        const nameMatch = content.match(/name\s*[:=]\s*["']([^"']+)["']/);
        if (nameMatch) {
          const name = nameMatch[1];
          // Try to guess if it's a worker or pages based on presence of database_id or similar
          if (content.includes("pages_build_output_dir")) {
            cfProjectName = name;
            isWorker = false;
          } else {
            workerName = name;
            isWorker = true;
          }
        }

        const d1Match = content.match(/database_id\s*[:=]\s*["']([^"']+)["']/);
        if (d1Match) cfD1Id = d1Match[1];

        const r2Match = content.match(/bucket_name\s*[:=]\s*["']([^"']+)["']/);
        if (r2Match) cfR2Bucket = r2Match[1];
      }
    }
  }

  return {
    description: repoData.description,
    prodUrl: repoData.homepage,
    isCloudflareProject: isCf,
    cloudflareProjectName: cfProjectName,
    isWorker,
    cloudflareWorkerName: workerName,
    cloudflareD1Id: cfD1Id,
    cloudflareR2BucketName: cfR2Bucket,
    isDockerProject: isDocker,
    portainerStackName: isDocker ? dockerStackName : null,
  };
}

/**
 * Fetches the last 3 workflow runs for a repository.
 */
export async function fetchRecentActions(
  githubRepoFullName: string,
  githubPat: string,
  masterKey: string
) {
  let pat = githubPat;
  if (pat.includes(":")) {
    pat = await decrypt(pat, masterKey);
  }

  const headers = {
    Authorization: `token ${pat}`,
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "Central-Dashboard",
  };

  const res = await fetch(`https://api.github.com/repos/${githubRepoFullName}/actions/runs?per_page=3`, { headers });
  if (!res.ok) return [];
  
  const data = await res.json() as any;
  return (data.workflow_runs || []).map((run: any) => ({
    id: run.id,
    status: run.status,
    conclusion: run.conclusion,
    name: run.name,
    url: run.html_url,
    createdAt: run.created_at
  }));
}
