import crypto from "crypto";

const SECRET_KEY = process.env.ENCRYPT_SECRET_KEY || "12345678901234567890123456789012";
const ALGORITHM = "aes-256-cbc";

export function encryptData(data) {
  const iv = crypto.randomBytes(16); 
  const json = JSON.stringify(data);

  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);
  let encrypted = cipher.update(json, "utf8", "hex");
  encrypted += cipher.final("hex");

  return `${iv.toString("hex")}:${encrypted}`;
}

export function decryptData(encrypted) {
  const [ivHex, encryptedText] = encrypted.split(":");
  const iv = Buffer.from(ivHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return JSON.parse(decrypted);
}
