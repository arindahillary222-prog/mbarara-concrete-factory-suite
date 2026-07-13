const MANIFEST_KEY = "manifest.json";
const TOKEN_TTL_SECONDS = 6 * 60 * 60;
const MAX_UPLOAD_BYTES = 4_000_000;
const ALLOWED_CONTENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function corsHeaders(request, env) {
  const configured = String(env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const origin = request.headers.get("Origin") || "";
  const allowOrigin = configured.includes(origin) ? origin : configured[0] || "*";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "content-type,authorization,accept",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function json(request, env, status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders(request, env),
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

function base64urlFromBytes(bytes) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64urlFromText(value) {
  return base64urlFromBytes(new TextEncoder().encode(value));
}

function bytesFromBase64(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function textFromBase64url(value) {
  const normalized = String(value).replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const bytes = bytesFromBase64(padded);
  return new TextDecoder().decode(bytes);
}

async function hmacSign(payload, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return base64urlFromBytes(new Uint8Array(signature));
}

function timingSafeEqual(left, right) {
  const a = String(left);
  const b = String(right);
  if (a.length !== b.length) return false;
  let result = 0;
  for (let index = 0; index < a.length; index += 1) result |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return result === 0;
}

async function createToken(env, user) {
  const payload = base64urlFromText(
    JSON.stringify({
      sub: user.id,
      email: user.email,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
    }),
  );
  const signature = await hmacSign(payload, env.API_SECRET_KEY || env.OWNER_PASSWORD_HASH || "");
  return `${payload}.${signature}`;
}

async function verifyToken(env, value) {
  if (!value || !env.API_SECRET_KEY) return null;
  const token = String(value).replace(/^Bearer\s+/i, "");
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = await hmacSign(payload, env.API_SECRET_KEY);
  if (!timingSafeEqual(signature, expected)) return null;
  try {
    const parsed = JSON.parse(textFromBase64url(payload));
    if (Number(parsed.exp) <= Math.floor(Date.now() / 1000)) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(value)));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function verifyPassword(password, storedHash) {
  if (/^[a-f0-9]{64}$/i.test(String(storedHash || ""))) {
    return timingSafeEqual(await sha256Hex(password), storedHash);
  }

  const parts = String(storedHash || "").split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2_sha256") return false;
  const rounds = Number(parts[1]);
  if (!Number.isInteger(rounds) || rounds < 100_000) return false;
  const salt = bytesFromBase64(parts[2]);
  const expected = parts[3];
  const keyMaterial = await crypto.subtle.importKey("raw", new TextEncoder().encode(String(password)), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: rounds, hash: "SHA-256" }, keyMaterial, 256);
  return timingSafeEqual(base64urlFromBytes(new Uint8Array(bits)), expected);
}

function ownerUser(env) {
  return {
    id: "owner",
    email: env.OWNER_EMAIL || "arindahillary222@gmail.com",
    full_name: "Hillary Arindamukama",
    role: "owner",
    is_active: true,
    last_login_at: null,
  };
}

function sanitizeProductId(value) {
  const productId = String(value || "");
  return /^[a-zA-Z0-9_-]{2,90}$/.test(productId) ? productId : "";
}

function sanitizeIndex(value) {
  const index = Number(value);
  return Number.isInteger(index) && index >= 0 && index <= 9 ? index : -1;
}

function parseDataUrl(dataUrl) {
  const match = String(dataUrl || "").match(/^data:(image\/(?:jpeg|png|webp));base64,([a-zA-Z0-9+/=]+)$/);
  if (!match) return null;
  const contentType = match[1];
  const bytes = bytesFromBase64(match[2]);
  if (!ALLOWED_CONTENT_TYPES.has(contentType) || bytes.byteLength > MAX_UPLOAD_BYTES) return null;
  return { contentType, bytes };
}

function extensionFor(contentType) {
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  return "jpg";
}

function manifestToClient(manifest, request) {
  const origin = new URL(request.url).origin;
  const photos = {};
  Object.entries(manifest.photos || {}).forEach(([productId, slots]) => {
    photos[productId] = {};
    Object.entries(slots || {}).forEach(([index, slot]) => {
      photos[productId][index] = {
        src: `${origin}/product-photos?productId=${encodeURIComponent(productId)}&index=${encodeURIComponent(index)}&v=${encodeURIComponent(slot.version || slot.updatedAt || "")}`,
        label: slot.label,
        fileName: slot.fileName,
        updatedAt: slot.updatedAt,
      };
    });
  });
  return photos;
}

async function readManifest(env) {
  const manifest = await env.PRODUCT_PHOTOS.get(MANIFEST_KEY, { type: "json" });
  return manifest && typeof manifest === "object" ? manifest : { photos: {} };
}

async function writeManifest(env, manifest) {
  await env.PRODUCT_PHOTOS.put(MANIFEST_KEY, JSON.stringify(manifest), {
    metadata: { contentType: "application/json", updatedAt: new Date().toISOString() },
  });
}

async function handleApi(request, env, pathname) {
  if (pathname === "/health" || pathname === "/api/v1/health") {
    return json(request, env, 200, {
      ok: true,
      status: "ok",
      service: env.APP_NAME || "Mbarara Integrated Concrete Products Factory API",
    });
  }

  if (pathname === "/api/v1/auth/bootstrap-owner" && request.method === "POST") {
    return json(request, env, 409, { detail: "Owner account is configured through Cloudflare encrypted secrets." });
  }

  if (pathname === "/api/v1/auth/login" && request.method === "POST") {
    const body = await request.json().catch(() => ({}));
    const user = ownerUser(env);
    const emailMatches = String(body.email || "").toLowerCase() === user.email.toLowerCase();
    const passwordMatches = await verifyPassword(body.password || "", env.OWNER_PASSWORD_SHA256 || env.OWNER_PASSWORD_HASH || "");
    if (!emailMatches || !passwordMatches) return json(request, env, 401, { detail: "Invalid email or password." });
    return json(request, env, 200, {
      access_token: await createToken(env, user),
      token_type: "bearer",
      expires_in_seconds: TOKEN_TTL_SECONDS,
      user,
    });
  }

  const currentUser = await verifyToken(env, request.headers.get("Authorization"));
  if (!currentUser) return json(request, env, 401, { detail: "Authentication required." });

  if (pathname === "/api/v1/auth/me" && request.method === "GET") return json(request, env, 200, ownerUser(env));

  if (pathname === "/api/v1/system/software-core" && request.method === "GET") {
    return json(request, env, 200, {
      app_name: env.APP_NAME || "Mbarara Integrated Concrete Products Factory API",
      environment: env.ENVIRONMENT || "production",
      database_engine: "Cloudflare Workers KV for public owner-photo storage; local FastAPI/PostgreSQL remains the full ERP backend foundation",
      security_model: "Owner bearer tokens with PBKDF2 password verification and HMAC token signatures",
      protected_modules: ["public catalogue photo uploads", "owner login", "software core verification"],
      currency_policy: "UGX remains the accounting and settlement currency",
      owner_control: "Only authenticated owner sessions can upload, replace, or delete public product catalogue photos",
    });
  }

  return json(request, env, 404, { detail: "Not Found" });
}

async function handleProductPhotos(request, env) {
  if (request.method === "GET") {
    const url = new URL(request.url);
    const productId = sanitizeProductId(url.searchParams.get("productId"));
    const index = sanitizeIndex(url.searchParams.get("index"));
    const manifest = await readManifest(env);
    if (!productId || index < 0) return json(request, env, 200, { ok: true, photos: manifestToClient(manifest, request) });

    const slot = manifest.photos?.[productId]?.[index];
    if (!slot?.key) return json(request, env, 404, { ok: false, error: "Photo not found." });
    const data = await env.PRODUCT_PHOTOS.get(slot.key, { type: "arrayBuffer" });
    if (!data) return json(request, env, 404, { ok: false, error: "Photo data not found." });
    return new Response(data, {
      status: 200,
      headers: {
        ...corsHeaders(request, env),
        "content-type": slot.contentType || "image/jpeg",
        "cache-control": "public, max-age=31536000, immutable",
        "x-content-type-options": "nosniff",
      },
    });
  }

  if (request.method !== "POST") return json(request, env, 405, { ok: false, error: "Method not allowed." });
  const body = await request.json().catch(() => ({}));

  if (body.action === "login") {
    const expectedHash = env.OWNER_UPLOAD_PASSWORD_HASH || "";
    const actualHash = await sha256Hex(body.passphrase || "");
    if (!expectedHash || !timingSafeEqual(actualHash, expectedHash)) {
      return json(request, env, 401, { ok: false, error: "Invalid owner passphrase." });
    }
    return json(request, env, 200, { ok: true, token: await createToken(env, ownerUser(env)), expiresInSeconds: TOKEN_TTL_SECONDS });
  }

  const currentUser = await verifyToken(env, request.headers.get("Authorization") || body.token);
  if (!currentUser) return json(request, env, 401, { ok: false, error: "Owner session required." });

  const productId = sanitizeProductId(body.productId);
  const index = sanitizeIndex(body.index);
  if (!productId || index < 0) return json(request, env, 400, { ok: false, error: "Invalid product photo slot." });

  const manifest = await readManifest(env);

  if (body.action === "delete") {
    const previous = manifest.photos?.[productId]?.[index];
    if (previous?.key) await env.PRODUCT_PHOTOS.delete(previous.key).catch(() => undefined);
    if (manifest.photos?.[productId]) {
      delete manifest.photos[productId][index];
      if (Object.keys(manifest.photos[productId]).length === 0) delete manifest.photos[productId];
    }
    await writeManifest(env, manifest);
    return json(request, env, 200, { ok: true, photos: manifestToClient(manifest, request) });
  }

  if (body.action !== "upload") return json(request, env, 400, { ok: false, error: "Unknown action." });
  const parsed = parseDataUrl(body.dataUrl);
  if (!parsed) return json(request, env, 400, { ok: false, error: "Invalid image upload request." });

  const previous = manifest.photos?.[productId]?.[index];
  if (previous?.key) await env.PRODUCT_PHOTOS.delete(previous.key).catch(() => undefined);

  const updatedAt = new Date().toISOString();
  const versionBytes = crypto.getRandomValues(new Uint8Array(8));
  const version = Array.from(versionBytes).map((byte) => byte.toString(16).padStart(2, "0")).join("");
  const key = `products/${productId}/${index}-${version}.${extensionFor(parsed.contentType)}`;
  await env.PRODUCT_PHOTOS.put(key, parsed.bytes.buffer, {
    metadata: { contentType: parsed.contentType, fileName: String(body.fileName || "product-photo"), productId, index, updatedAt },
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
  await writeManifest(env, manifest);
  return json(request, env, 200, { ok: true, photos: manifestToClient(manifest, request) });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    const url = new URL(request.url);
    try {
      if (url.pathname === "/product-photos") return handleProductPhotos(request, env);
      if (url.pathname === "/" || url.pathname.startsWith("/api/") || url.pathname === "/health") {
        return handleApi(request, env, url.pathname);
      }
      return json(request, env, 404, { detail: "Not Found" });
    } catch (error) {
      return json(request, env, 500, { ok: false, error: error instanceof Error ? error.message : "Unexpected server error." });
    }
  },
};
