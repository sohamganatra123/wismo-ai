const encoder = new TextEncoder();
const decoder = new TextDecoder();

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function importKey(base64Key: string, usage: KeyUsage) {
  const key = base64ToBytes(base64Key);
  if (key.byteLength !== 32) throw new Error("INTEGRATION_ENCRYPTION_KEY must contain exactly 32 bytes");
  return crypto.subtle.importKey("raw", key, "AES-GCM", false, [usage]);
}

export async function encryptCredentials(value: unknown, base64Key: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await importKey(base64Key, "encrypt");
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoder.encode(JSON.stringify(value)));
  return `${bytesToBase64(iv)}.${bytesToBase64(new Uint8Array(encrypted))}`;
}

export async function decryptCredentials<T>(value: string, base64Key: string): Promise<T> {
  const [ivValue, encryptedValue, extra] = value.split(".");
  if (!ivValue || !encryptedValue || extra) throw new Error("Invalid encrypted credential payload");
  const key = await importKey(base64Key, "decrypt");
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: base64ToBytes(ivValue) }, key, base64ToBytes(encryptedValue));
  return JSON.parse(decoder.decode(decrypted)) as T;
}
