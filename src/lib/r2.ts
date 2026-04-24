export async function uploadToR2(
  bucket: R2Bucket,
  key: string,
  data: ArrayBuffer | string | Blob,
  contentType: string
) {
  return await bucket.put(key, data, {
    httpMetadata: { contentType },
  });
}

export async function deleteFromR2(bucket: R2Bucket, key: string) {
  return await bucket.delete(key);
}

// Helper to construct public URL if using a custom domain or worker proxy
export function getR2PublicUrl(key: string, baseUrl?: string) {
  if (!baseUrl) return `/r2/${key}`;
  return `${baseUrl}/${key}`;
}
