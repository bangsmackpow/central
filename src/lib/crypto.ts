/**
 * Web Crypto API Helpers for AES-GCM Encryption/Decryption
 * Optimized for Cloudflare Workers.
 */

async function getEncryptionKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const rawKey = encoder.encode(secret);
  
  // Hash the input secret to ensure it's exactly 256 bits for AES-256
  const hash = await crypto.subtle.digest("SHA-256", rawKey);
  
  return await crypto.subtle.importKey(
    "raw",
    hash,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts a string using AES-GCM.
 * Returns format: "base64(iv):base64(ciphertext)"
 */
export async function encrypt(text: string, masterKey: string): Promise<string> {
  const key = await getEncryptionKey(masterKey);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  const data = encoder.encode(text);

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    data
  );

  const ivBase64 = btoa(String.fromCharCode(...iv));
  const encryptedBase64 = btoa(String.fromCharCode(...new Uint8Array(encrypted)));

  return `${ivBase64}:${encryptedBase64}`;
}

/**
 * Decrypts a string encrypted with the format above.
 */
export async function decrypt(encryptedData: string, masterKey: string): Promise<string> {
  const [ivBase64, ciphertextBase64] = encryptedData.split(":");
  if (!ivBase64 || !ciphertextBase64) throw new Error("Invalid encrypted data format");

  const key = await getEncryptionKey(masterKey);
  
  const iv = new Uint8Array(
    atob(ivBase64)
      .split("")
      .map((c) => c.charCodeAt(0))
  );
  
  const ciphertext = new Uint8Array(
    atob(ciphertextBase64)
      .split("")
      .map((c) => c.charCodeAt(0))
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );

  const decoder = new TextEncoder();
  return new TextDecoder().decode(decrypted);
}
