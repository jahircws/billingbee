import { createCipheriv, createDecipheriv, randomBytes } from "crypto"

const ALG = "aes-256-gcm"
const KEY_ENV = process.env.ENCRYPTION_KEY ?? ""

function getKey(): Buffer {
  if (!KEY_ENV || KEY_ENV.length < 32) {
    throw new Error("ENCRYPTION_KEY env var must be at least 32 chars")
  }
  return Buffer.from(KEY_ENV.slice(0, 32), "utf-8")
}

export function encrypt(plaintext: string): string {
  const key = getKey()
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALG, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf-8"), cipher.final()])
  const tag = cipher.getAuthTag()
  // iv(12) + tag(16) + ciphertext — all base64url joined with "."
  return [iv.toString("base64url"), tag.toString("base64url"), encrypted.toString("base64url")].join(".")
}

export function decrypt(ciphertext: string): string {
  const key = getKey()
  const parts = ciphertext.split(".")
  if (parts.length !== 3) throw new Error("Invalid ciphertext format")
  const [ivB64, tagB64, dataB64] = parts
  const iv = Buffer.from(ivB64, "base64url")
  const tag = Buffer.from(tagB64, "base64url")
  const data = Buffer.from(dataB64, "base64url")
  const decipher = createDecipheriv(ALG, key, iv)
  decipher.setAuthTag(tag)
  return decipher.update(data) + decipher.final("utf-8")
}
