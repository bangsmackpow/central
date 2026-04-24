/**
 * Web Crypto API Helpers for AES-GCM Encryption/Decryption
 * Optimized for Cloudflare Workers.
 */

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

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
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

  const ivBase64 = arrayBufferToBase64(iv);
  const encryptedBase64 = arrayBufferToBase64(encrypted);

  return `${ivBase64}:${encryptedBase64}`;
}

/**
 * Decrypts a string.
 */
export async function decrypt(encryptedData: string, masterKey: string): Promise<string> {
  const [ivBase64, ciphertextBase64] = encryptedData.split(":");
  if (!ivBase64 || !ciphertextBase64) throw new Error("Invalid encrypted data format");

  const key = await getEncryptionKey(masterKey);
  const iv = base64ToArrayBuffer(ivBase64);
  const ciphertext = base64ToArrayBuffer(ciphertextBase64);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
}
