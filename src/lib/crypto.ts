/**
 * Web Crypto API Helpers for AES-GCM Encryption/Decryption
 * Optimized for Cloudflare Workers.
 */

const ENCRYPTION_PREFIX = "enc:v1:";

async function getEncryptionKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const rawKey = encoder.encode(secret);
  const hash = await crypto.subtle.digest("SHA-256", rawKey);
  
  return await crypto.subtle.importKey(
    "raw",
    hash,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

function bufToBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function base64ToBuf(base64: string): Uint8Array {
  return new Uint8Array(atob(base64).split("").map(c => c.charCodeAt(0)));
}

export function isEncrypted(text: string): boolean {
  return text.startsWith(ENCRYPTION_PREFIX);
}

/**
 * Encrypts a string using AES-GCM.
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

  const ivBase64 = bufToBase64(iv);
  const encryptedBase64 = bufToBase64(encrypted);

  return `${ENCRYPTION_PREFIX}${ivBase64}:${encryptedBase64}`;
}

/**
 * Decrypts a string.
 */
export async function decrypt(encryptedData: string, masterKey: string): Promise<string> {
  if (!isEncrypted(encryptedData)) return encryptedData;

  const dataWithoutPrefix = encryptedData.slice(ENCRYPTION_PREFIX.length);
  const [ivBase64, ciphertextBase64] = dataWithoutPrefix.split(":");
  
  if (!ivBase64 || !ciphertextBase64) throw new Error("Invalid encrypted data format");

  const key = await getEncryptionKey(masterKey);
  const iv = base64ToBuf(ivBase64);
  const ciphertext = base64ToBuf(ciphertextBase64);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
}
