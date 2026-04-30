import { TextEncoder, TextDecoder } from "util"; // For polyfill in Workers, if needed

const MAX_CHUNK_SIZE = 512; // Tokens or characters, adjust as needed

interface EmbeddingResult {
  vector: number[];
  id: string;
  metadata: {
    projectId: string;
    source: string; // e.g., 'docs/README.md'
    chunkIndex: number;
    text: string;
  };
}

/**
 * Chunks text into smaller pieces for embedding.
 * Simple chunking for now, can be improved with semantic chunking.
 */
function chunkText(text: string): string[] {
  const chunks: string[] = [];
  let currentChunk = "";
  const words = text.split(/\s+/); // Split by whitespace

  for (const word of words) {
    if ((currentChunk + word).length <= MAX_CHUNK_SIZE) {
      currentChunk += (currentChunk ? " " : "") + word;
    } else {
      chunks.push(currentChunk);
      currentChunk = word;
    }
  }
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  return chunks;
}

/**
 * Generates embeddings for a given text using Cloudflare Workers AI.
 */
export async function generateEmbedding(
  ai: any, // AI binding from Hono Context
  text: string
): Promise<number[]> {
  const inputs = { text };
  const response = await ai.run("@cf/baai/bge-small-en-v1.5", inputs);
  return response.data[0];
}

/**
 * Upserts embeddings into a Cloudflare Vectorize index.
 */
export async function upsertEmbeddings(
  vectorize: Vectorize, // Vectorize binding from Hono Context
  embeddings: EmbeddingResult[]
) {
  const vectors = embeddings.map(e => ({
    id: e.id,
    values: e.vector,
    metadata: e.metadata,
  }));
  await vectorize.upsert(vectors);
}

/**
 * Scans R2 for Markdown docs, chunks them, generates embeddings, and upserts to Vectorize.
 */
export async function indexProjectDocs(
  projectId: string,
  BUCKET: R2Bucket,
  AI: any,
  VECTORIZE: Vectorize
): Promise<number> {
  const docPrefix = `projects/${projectId}/docs/`;
  const listed = await BUCKET.list({ prefix: docPrefix });
  let indexedCount = 0;

  for (const obj of listed.objects) {
    const textContent = await BUCKET.get(obj.key).then(o => o?.text());
    if (!textContent) continue;

    const chunks = chunkText(textContent);
    const embeddingsToUpsert: EmbeddingResult[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const embedding = await generateEmbedding(AI, chunks[i]);
      embeddingsToUpsert.push({
        vector: embedding,
        id: `${projectId}-${obj.key.replace(/\//g, '-')}-${i}`, // Unique ID for each chunk
        metadata: {
          projectId,
          source: obj.key,
          chunkIndex: i,
          text: chunks[i],
        },
      });
    }
    
    if (embeddingsToUpsert.length > 0) {
      await upsertEmbeddings(VECTORIZE, embeddingsToUpsert);
      indexedCount += embeddingsToUpsert.length;
    }
  }
  return indexedCount;
}

/**
 * Performs a vector search query against the Vectorize index.
 */
export async function queryVectorIndex(
  vectorize: Vectorize,
  queryEmbedding: number[],
  projectId: string,
  topK: number = 5
): Promise<any[]> {
  const query = {
    vector: queryEmbedding,
    topK,
    filter: { projectId: projectId }
  };
  const results = await vectorize.query(query);
  return results.matches;
}
