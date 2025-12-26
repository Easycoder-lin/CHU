import crypto from "node:crypto";
import express from "express";
import cors from "cors";
import helmet from "helmet";

type Credentials = {
  username: string;
  password: string;
};

type StoredCredentials = {
  ciphertext: string;
  iv: string;
  tag: string;
  createdAt: number;
};

type AttestationPayload = {
  offerId: string;
  dataHash: string;
  issuedAt: number;
};

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const port = Number(process.env.PORT || 4001);

const store = new Map<string, StoredCredentials>();

function requireString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} must be a non-empty string`);
  }
  return value;
}

function getMasterKey(): Buffer {
  const raw = process.env.TEE_MASTER_KEY;
  if (!raw) {
    const key = crypto.randomBytes(32);
    console.warn("TEE_MASTER_KEY not set. Using a random key for this process only.");
    return key;
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error("TEE_MASTER_KEY must be base64 for 32 bytes (AES-256 key)");
  }
  return key;
}

const masterKey = getMasterKey();

function encryptCredentials(credentials: Credentials): StoredCredentials {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", masterKey, iv);
  const plaintext = JSON.stringify(credentials);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    createdAt: Date.now(),
  };
}

function decryptCredentials(stored: StoredCredentials): Credentials {
  const iv = Buffer.from(stored.iv, "base64");
  const tag = Buffer.from(stored.tag, "base64");
  const ciphertext = Buffer.from(stored.ciphertext, "base64");

  const decipher = crypto.createDecipheriv("aes-256-gcm", masterKey, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
  return JSON.parse(plaintext) as Credentials;
}

function getAttestationKeys() {
  const raw = process.env.TEE_ATTESTATION_PRIVATE_KEY;
  if (raw) {
    const privateKey = crypto.createPrivateKey(raw);
    const publicKey = crypto.createPublicKey(privateKey);
    return { privateKey, publicKey };
  }

  console.warn("TEE_ATTESTATION_PRIVATE_KEY not set. Using an ephemeral key for this process only.");
  const { privateKey, publicKey } = crypto.generateKeyPairSync("ed25519");
  return { privateKey, publicKey };
}

const attestationKeys = getAttestationKeys();

function signAttestation(payload: AttestationPayload): string {
  const data = Buffer.from(JSON.stringify(payload));
  const signature = crypto.sign(null, data, attestationKeys.privateKey);
  return signature.toString("base64");
}

function hashStored(stored: StoredCredentials): string {
  const hash = crypto.createHash("sha256");
  hash.update(stored.ciphertext);
  hash.update(stored.iv);
  hash.update(stored.tag);
  return hash.digest("hex");
}

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/tee/attestation-public-key", (req, res) => {
  const publicKeyPem = attestationKeys.publicKey.export({ type: "spki", format: "pem" });
  res.json({ publicKey: publicKeyPem });
});

app.post("/api/tee/encrypt-credentials", (req, res) => {
  try {
    const offerId = requireString(req.body?.offerId, "offerId");
    const username = requireString(req.body?.username, "username");
    const password = requireString(req.body?.password, "password");

    // TODO: verify offer exists and caller is the owner using Sui SDK.

    const stored = encryptCredentials({ username, password });
    store.set(offerId, stored);

    const payload: AttestationPayload = {
      offerId,
      dataHash: hashStored(stored),
      issuedAt: Date.now(),
    };

    const attestation = signAttestation(payload);

    res.json({ attestation });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    res.status(400).json({ error: message });
  }
});

app.post("/api/tee/retrieve-credentials", (req, res) => {
  try {
    const offerId = requireString(req.body?.offerId, "offerId");
    requireString(req.body?.seatId, "seatId");
    requireString(req.body?.signature, "signature");

    // TODO: verify seat ownership and signature using Sui SDK.

    const stored = store.get(offerId);
    if (!stored) {
      res.status(404).json({ error: "Credentials not found" });
      return;
    }

    const credentials = decryptCredentials(stored);
    res.json(credentials);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    res.status(400).json({ error: message });
  }
});

app.listen(port, () => {
  console.log(`TEE API listening on http://localhost:${port}`);
});
