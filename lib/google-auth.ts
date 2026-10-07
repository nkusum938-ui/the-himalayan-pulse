import fs from "node:fs";
import path from "node:path";
import os from "node:os";

export function ensureGoogleCredentials() {
  if (
    process.env.GOOGLE_APPLICATION_CREDENTIALS &&
    fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)
  ) {
    return;
  }

  const b64 = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (b64) {
    const json = Buffer.from(b64, "base64").toString("utf8");
    const tmpFile = path.join(os.tmpdir(), "gcp-sa.json");
    fs.writeFileSync(tmpFile, json);
    process.env.GOOGLE_APPLICATION_CREDENTIALS = tmpFile;
    return;
  }

  throw new Error(
    "Missing Google credentials: set GOOGLE_APPLICATION_CREDENTIALS (local) or GOOGLE_SERVICE_ACCOUNT_JSON (Vercel)"
  );
}
