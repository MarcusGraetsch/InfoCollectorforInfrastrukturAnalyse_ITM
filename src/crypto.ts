/**
 * At-rest encryption for localStorage via WebCrypto (AES-GCM + PBKDF2).
 *
 * Keys are derived from a user password and never stored in plain text.
 * The encrypted payload lives under STORAGE_KEY; a flag key marks encryption as active.
 */

const FLAG_KEY = 'it-sa-encrypted';
const SALT_KEY = 'it-sa-salt';
const IV_KEY = 'it-sa-iv';
const PBKDF2_ITERATIONS = 310_000;

function getSubtle(): SubtleCrypto {
  return window.crypto.subtle;
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await getSubtle().importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return getSubtle().deriveKey(
    { name: 'PBKDF2', salt: salt.buffer as ArrayBuffer, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

function toBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function fromBase64(s: string): Uint8Array {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}

/** Returns true when the data store is currently encrypted. */
export function isEncrypted(): boolean {
  return localStorage.getItem(FLAG_KEY) === '1';
}

/**
 * Encrypt a plaintext string with the given password.
 * Stores salt + IV in localStorage; returns the base64 ciphertext.
 */
export async function encryptData(plaintext: string, password: string): Promise<string> {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const enc = new TextEncoder();
  const cipherBuf = await getSubtle().encrypt({ name: 'AES-GCM', iv: iv.buffer as ArrayBuffer }, key, enc.encode(plaintext).buffer as ArrayBuffer);
  localStorage.setItem(SALT_KEY, toBase64(salt.buffer as ArrayBuffer));
  localStorage.setItem(IV_KEY, toBase64(iv.buffer as ArrayBuffer));
  localStorage.setItem(FLAG_KEY, '1');
  return toBase64(cipherBuf);
}

/**
 * Decrypt a base64 ciphertext with the given password.
 * Reads salt + IV from localStorage.
 * Throws if the password is wrong or data is corrupt.
 */
export async function decryptData(ciphertext: string, password: string): Promise<string> {
  const saltB64 = localStorage.getItem(SALT_KEY);
  const ivB64 = localStorage.getItem(IV_KEY);
  if (!saltB64 || !ivB64) throw new Error('Kein Salt/IV gefunden — Daten nicht entschlüsselbar.');
  const salt = fromBase64(saltB64);
  const iv = fromBase64(ivB64);
  const key = await deriveKey(password, salt);
  const dec = new TextDecoder();
  const plainBuf = await getSubtle().decrypt({ name: 'AES-GCM', iv: iv.buffer as ArrayBuffer }, key, fromBase64(ciphertext).buffer as ArrayBuffer);
  return dec.decode(plainBuf);
}

/** Remove encryption keys from localStorage (called on disable). */
export function clearEncryptionMeta(): void {
  localStorage.removeItem(FLAG_KEY);
  localStorage.removeItem(SALT_KEY);
  localStorage.removeItem(IV_KEY);
}
