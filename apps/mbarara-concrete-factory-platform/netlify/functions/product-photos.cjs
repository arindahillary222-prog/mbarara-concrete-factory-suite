const crypto = require("crypto");
const { connectLambda, getStore } = require("@netlify/blobs");

const manifestKey = "manifest.json";
const tokenTtlMs = 6 * 60 * 60 * 1000;
const maxUploadBytes = 4_000_000;
const allowedContentTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
let store;

const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

function json(statusCode, payload) {
  return {
    statusCode,
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  };
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left), "hex");
  const rightBuffer = Buffer.from(String(right), "hex");
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function base64url(input) {
  return Buffer.from(input).toString("base64url");
}

function unbase64url(input) {
  return Buffer.from(String(input), "base64url").toString("utf8");
}

function tokenSecret() {
  return process.env.OWNER_UPLOAD_TOKEN_SECRET || process.env.OWNER_UPLOAD_PASSWORD_HASH || "";
}

function sign(payload) {
  return crypto.createHmac("sha256", tokenSecret()).update(payload).digest("base64url");
}

function createToken() {
  const payload = base64url(JSON.stringify({ sub: "owner", exp: Date.now() + tokenTtlMs }));
  return `${payload}.${sign(payload)}`;
}

function verifyToken(value) {
  if (!value || !tokenSecret()) return false;
  const token = String(value).replace(/^Bearer\s+/i, "");
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  const expectedSignature = sign(payload);
  if (signature.length !== expectedSignature.length) return false;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) return false;
  try {
    const parsed = JSON.parse(unbase64url(payload));
    return parsed.sub === "owner" && Number(parsed.exp) > Date.now();
  } catch {
    return false;
  }
}

function sanitizeProductId(value) {
  const productId = String(value || "");
  if (!/^[a-zA-Z0-9_-]{2,90}$/.test(productId)) return "";
  return productId;
}

function sanitizeIndex(value) {
  const index = Number(value);
  if (!Number.isInteger(index) || index < 0 || index > 9) return -1;
  return index;
}

function extensionFor(contentType) {
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  return "jpg";
}

function manifestToClient(manifest) {
  const photos = {};
  Object.entries(manifest.photos || {}).forEach(([productId, slots]) => {
    photos[productId] = {};
    Object.entries(slots || {}).forEach(([index, slot]) => {
      photos[productId][index] = {
        src: `/.netlify/functions/product-photos?productId=${encodeURIComponent(productId)}&index=${encodeURIComponent(index)}&v=${encodeURIComponent(slot.version || slot.updatedAt || "")}`,
        label: slot.label,
        fileName: slot.fileName,
        updatedAt: slot.updatedAt,
      };
    });
  });
  return photos;
}

async function readManifest() {
  if (!store) store = getStore("product-photos");
  const manifest = await store.get(manifestKey, { type: "json" });
  return manifest && typeof manifest === "object" ? manifest : { photos: {} };
}

async function writeManifest(manifest) {
  if (!store) store = getStore("product-photos");
  await store.setJSON(manifestKey, manifest, {
    metadata: { contentType: "application/json", updatedAt: new Date().toISOString() },
  });
}

function parseBody(event) {
  if (!event.body) return {};
  return JSON.parse(event.isBase64Encoded ? Buffer.from(event.body, "base64").toString("utf8") : event.body);
}

function parseDataUrl(dataUrl) {
  const match = String(dataUrl || "").match(/^data:(image\/(?:jpeg|png|webp));base64,([a-zA-Z0-9+/=]+)$/);
  if (!match) return null;
  const contentType = match[1];
  const bytes = Buffer.from(match[2], "base64");
  if (!allowedContentTypes.has(contentType) || bytes.length > maxUploadBytes) return null;
  return { contentType, bytes };
}

async function handleLogin(body) {
  const expectedHash = process.env.OWNER_UPLOAD_PASSWORD_HASH;
  if (!expectedHash || !tokenSecret()) return json(500, { ok: false, error: "Owner upload security is not configured." });
  const actualHash = sha256(body.passphrase || "");
  if (!safeEqual(actualHash, expectedHash)) return json(401, { ok: false, error: "Invalid owner passphrase." });
  return json(200, { ok: true, token: createToken(), expiresInSeconds: tokenTtlMs / 1000 });
}

async function handleUpload(event, body) {
  if (!store) store = getStore("product-photos");
  if (!verifyToken(event.headers.authorization || body.token)) return json(401, { ok: false, error: "Owner session required." });
  const productId = sanitizeProductId(body.productId);
  const index = sanitizeIndex(body.index);
  const parsed = parseDataUrl(body.dataUrl);
  if (!productId || index < 0 || !parsed) return json(400, { ok: false, error: "Invalid image upload request." });

  const manifest = await readManifest();
  const previous = manifest.photos?.[productId]?.[index];
  if (previous?.key) await store.delete(previous.key).catch(() => undefined);

  const updatedAt = new Date().toISOString();
  const version = crypto.randomBytes(8).toString("hex");
  const key = `products/${productId}/${index}-${version}.${extensionFor(parsed.contentType)}`;
  await store.set(key, parsed.bytes.buffer.slice(parsed.bytes.byteOffset, parsed.bytes.byteOffset + parsed.bytes.byteLength), {
    metadata: {
      contentType: parsed.contentType,
      fileName: String(body.fileName || "product-photo"),
      productId,
      index,
      updatedAt,
    },
  });

  manifest.photos = manifest.photos || {};
  manifest.photos[productId] = manifest.photos[productId] || {};
  manifest.photos[productId][index] = {
    key,
    label: String(body.label || body.fileName || "Owner uploaded product photo").replace(/\.[^.]+$/, ""),
    fileName: String(body.fileName || "product-photo"),
    contentType: parsed.contentType,
    updatedAt,
    version,
  };
  await writeManifest(manifest);
  return json(200, { ok: true, photos: manifestToClient(manifest) });
}

async function handleDelete(event, body) {
  if (!store) store = getStore("product-photos");
  if (!verifyToken(event.headers.authorization || body.token)) return json(401, { ok: false, error: "Owner session required." });
  const productId = sanitizeProductId(body.productId);
  const index = sanitizeIndex(body.index);
  if (!productId || index < 0) return json(400, { ok: false, error: "Invalid delete request." });

  const manifest = await readManifest();
  const previous = manifest.photos?.[productId]?.[index];
  if (previous?.key) await store.delete(previous.key).catch(() => undefined);
  if (manifest.photos?.[productId]) {
    delete manifest.photos[productId][index];
    if (Object.keys(manifest.photos[productId]).length === 0) delete manifest.photos[productId];
  }
  await writeManifest(manifest);
  return json(200, { ok: true, photos: manifestToClient(manifest) });
}

exports.handler = async (event) => {
  try {
    connectLambda(event);
    store = getStore("product-photos");
    if (event.httpMethod === "OPTIONS") return json(200, { ok: true });

    if (event.httpMethod === "GET") {
      const productId = sanitizeProductId(event.queryStringParameters?.productId);
      const index = sanitizeIndex(event.queryStringParameters?.index);
      const manifest = await readManifest();
      if (!productId || index < 0) return json(200, { ok: true, photos: manifestToClient(manifest) });

      const slot = manifest.photos?.[productId]?.[index];
      if (!slot?.key) return json(404, { ok: false, error: "Photo not found." });
      const data = await store.get(slot.key, { type: "arrayBuffer" });
      return {
        statusCode: 200,
        headers: {
          "content-type": slot.contentType || "image/jpeg",
          "cache-control": "public, max-age=31536000, immutable",
        },
        body: Buffer.from(data).toString("base64"),
        isBase64Encoded: true,
      };
    }

    if (event.httpMethod !== "POST") return json(405, { ok: false, error: "Method not allowed." });
    const body = parseBody(event);
    if (body.action === "login") return handleLogin(body);
    if (body.action === "upload") return handleUpload(event, body);
    if (body.action === "delete") return handleDelete(event, body);
    return json(400, { ok: false, error: "Unknown action." });
  } catch (error) {
    return json(500, { ok: false, error: error instanceof Error ? error.message : "Unexpected server error." });
  }
};
