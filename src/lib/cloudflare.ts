import { decrypt } from "./crypto";

/**
 * Fetches recent deployments for a Cloudflare Pages project.
 */
export async function fetchRecentPagesDeployments(
  accountId: string,
  projectName: string,
  token: string,
  masterKey: string
) {
  let cfToken = token;
  if (cfToken.includes(":")) {
    cfToken = await decrypt(cfToken, masterKey);
  }

  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}/deployments`, {
    headers: {
      Authorization: `Bearer ${cfToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) return [];

  const data = await res.json() as any;
  return (data.result || []).slice(0, 3).map((d: any) => ({
    id: d.id,
    status: d.latest_stage?.status || "unknown",
    environment: d.environment,
    url: d.url,
    createdAt: d.created_on
  }));
}

/**
 * Fetches the status of a Cloudflare Worker.
 */
export async function fetchWorkerStatus(
  accountId: string,
  workerName: string,
  token: string,
  masterKey: string
) {
  let cfToken = token;
  if (cfToken.includes(":")) {
    cfToken = await decrypt(cfToken, masterKey);
  }

  // Workers API is slightly different, usually we just check the production script status
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/services/${workerName}`, {
    headers: {
      Authorization: `Bearer ${cfToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) return null;

  const data = await res.json() as any;
  return {
    status: data.result ? "active" : "inactive",
    updatedAt: data.result?.modified_on
  };
}
