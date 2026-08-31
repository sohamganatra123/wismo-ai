import { describe, expect, it } from "vitest";
import { decryptCredentials, encryptCredentials } from "./credentials";

describe("integration credential encryption", () => {
  const key = Buffer.alloc(32, 7).toString("base64");

  it("round-trips credentials without storing plaintext", async () => {
    const secret = { refreshToken: "gmail-secret", accessToken: "short-lived" };
    const encrypted = await encryptCredentials(secret, key);
    expect(encrypted).not.toContain("gmail-secret");
    await expect(decryptCredentials(encrypted, key)).resolves.toEqual(secret);
  });

  it("rejects the wrong encryption key", async () => {
    const encrypted = await encryptCredentials({ token: "secret" }, key);
    await expect(decryptCredentials(encrypted, Buffer.alloc(32, 8).toString("base64"))).rejects.toThrow();
  });
});
