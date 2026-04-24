import { decrypt } from "./crypto";

export interface GitHubRepoMeta {
  name: string;
  full_name: string;
  description: string | null;
  homepage: string | null;
  topics: string[];
}

/**
 * Fetches repository metadata and detects Cloudflare configuration.
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

  // 2. Look for wrangler.toml or wrangler.jsonc
  let cfProjectName = null;
  let isCf = false;

  // Check homepage first
  if (repoData.homepage?.includes(".pages.dev") || repoData.homepage?.includes(".workers.dev")) {
    isCf = true;
  }

  // Check for wrangler config files
  const filesToCheck = ["wrangler.toml", "wrangler.jsonc"];
  for (const file of filesToCheck) {
    const fileRes = await fetch(
      `https://api.github.com/repos/${githubRepoFullName}/contents/${file}`,
      { headers }
    );
    if (fileRes.ok) {
      isCf = true;
      const fileData = await fileRes.json();
      const content = atob(fileData.content);
      
      // Basic regex to find name = "..." or "name": "..."
      const nameMatch = content.match(/name\s*[:=]\s*["']([^"']+)["']/);
      if (nameMatch) {
        cfProjectName = nameMatch[1];
      }
      break; 
    }
  }

  return {
    description: repoData.description,
    prodUrl: repoData.homepage,
    isCloudflareProject: isCf,
    cloudflareProjectName: cfProjectName,
  };
}
