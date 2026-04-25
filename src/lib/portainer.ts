import { decrypt } from "./crypto";

export interface PortainerStack {
  Id: number;
  Name: string;
  Type: number;
}

export interface PortainerContainer {
  Id: string;
  Names: string[];
  State: string;
  Status: string;
  Labels: Record<string, string>;
}

/**
 * Fetches current Docker context from Portainer API.
 */
export async function fetchDockerContext(
  baseUrl: string,
  apiKey: string,
  endpointId: number,
  stackName: string,
  masterKey: string
) {
  let token = apiKey;
  if (token.includes(":")) {
    token = await decrypt(token, masterKey);
  }

  const cleanBaseUrl = baseUrl.replace(/\/$/, "");
  const headers = {
    "X-API-Key": token,
  };

  // 1. Fetch Stack Info to get the real ID
  const stacksRes = await fetch(`${cleanBaseUrl}/api/stacks`, { headers });
  if (!stacksRes.ok) throw new Error("Failed to fetch stacks");
  const stacks: PortainerStack[] = await stacksRes.json();
  const stack = stacks.find(s => s.Name === stackName);

  // 2. Fetch Containers to find specific ones linked to this stack
  // We use the 'filters' parameter or just fetch and filter locally for simplicity/reliability
  const containersRes = await fetch(`${cleanBaseUrl}/api/endpoints/${endpointId}/docker/containers/json?all=1`, { headers });
  if (!containersRes.ok) throw new Error("Failed to fetch containers");
  const containers: PortainerContainer[] = await containersRes.json();

  // Filter containers by stack label (standard docker-compose label)
  const stackContainers = containers.filter(c => 
    c.Labels["com.docker.compose.project"] === stackName || 
    c.Labels["com.docker.stack.namespace"] === stackName
  ).map(c => ({
    id: c.Id,
    name: c.Names[0].replace(/^\//, ""),
    state: c.State,
    status: c.Status
  }));

  return {
    stackId: stack?.Id || null,
    stackType: stack?.Type || 2,
    containers: stackContainers
  };
}
