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
  let cfD1Id = null;
  let cfR2Bucket = null;

  let isDocker = false;
  let dockerStackName = repoData.name; // Default to repo name

  // Check homepage for Cloudflare markers
  if (repoData.homepage?.includes(".pages.dev") || repoData.homepage?.includes(".workers.dev")) {
    isCf = true;
  }

  // 2. Fetch Root File Tree to detect infrastructure
  const treeRes = await fetch(`https://api.github.com/repos/${githubRepoFullName}/contents/`, { headers });
  if (treeRes.ok) {
    const files = await treeRes.json() as any[];
    
    // Detect Docker
    if (files.some(f => f.name === "docker-compose.yml" || f.name === "docker-compose.yaml" || f.name === "Dockerfile")) {
      isDocker = true;
    }

    // Detect Cloudflare and parse config
    const wranglerFile = files.find(f => f.name === "wrangler.toml" || f.name === "wrangler.jsonc");
    if (wranglerFile) {
      isCf = true;
      const fileRes = await fetch(wranglerFile.url, { headers });
      if (fileRes.ok) {
        const fileData = await fileRes.json();
        const content = atob(fileData.content);
        
        const nameMatch = content.match(/name\s*[:=]\s*["']([^"']+)["']/);
        if (nameMatch) cfProjectName = nameMatch[1];

        const d1Match = content.match(/database_id\s*[:=]\s*["']([^"']+)["']/);
        if (d1Match) cfD1Id = d1Match[1];

        const r2Match = content.match(/bucket_name\s*[:=]\s*["']([^"']+)["']/);
        if (r2Match) cfR2Bucket = r2Match[1];
      }
    }

    // If Docker, try to parse docker-compose for stack/image info
    const composeFile = files.find(f => f.name === "docker-compose.yml" || f.name === "docker-compose.yaml");
    if (composeFile) {
      const fileRes = await fetch(composeFile.url, { headers });
      if (fileRes.ok) {
        const fileData = await fileRes.json();
        const content = atob(fileData.content);
        // We could extract more info here if needed
      }
    }
  }

  return {
    description: repoData.description,
    prodUrl: repoData.homepage,
    isCloudflareProject: isCf,
    cloudflareProjectName: cfProjectName,
    cloudflareD1Id: cfD1Id,
    cloudflareR2BucketName: cfR2Bucket,
    isDockerProject: isDocker,
    portainerStackName: isDocker ? dockerStackName : null,
  };
}
