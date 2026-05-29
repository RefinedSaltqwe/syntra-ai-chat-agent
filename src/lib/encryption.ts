import crypto from "crypto";


const ALGO = "aes-256-gcm"
const SECRET = process.env.MCP_SECRET_KEY!

export function encrypt(key: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(
    ALGO, Buffer.from(SECRET, "hex"), iv
  )

  const encrypted = Buffer.concat(
    [
      cipher.update(key, "utf8"),
      cipher.final()
    ]
  )

  return `${iv.toString("hex")}:${encrypted.toString("hex")}:${cipher.getAuthTag().toString("hex")}`
}

export function decrypt(encryptedKey: string) {
  const [iv, data, tag] = encryptedKey.split(":");

  const decipher = crypto.createDecipheriv(
    ALGO,
    Buffer.from(SECRET, "hex"),
    Buffer.from(iv, "hex")
  )
  decipher.setAuthTag(Buffer.from(tag, "hex"));
  return decipher.update(Buffer.from(data, "hex")) + decipher.final("utf8");
}
