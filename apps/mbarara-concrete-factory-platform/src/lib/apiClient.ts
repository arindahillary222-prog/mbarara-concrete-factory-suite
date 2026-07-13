const apiBaseUrlStorageKey = "mbarara-api-base-url-v1";
const apiTokenStorageKey = "mbarara-api-access-token-v1";
const defaultApiBaseUrl = "https://mbarara-concrete-api.arindahillary222.workers.dev";

export function getApiBaseUrl() {
  if (typeof window === "undefined") return defaultApiBaseUrl;
  return window.localStorage.getItem(apiBaseUrlStorageKey) || defaultApiBaseUrl;
}

export function saveApiBaseUrl(value: string) {
  if (typeof window !== "undefined") window.localStorage.setItem(apiBaseUrlStorageKey, value.replace(/\/+$/, ""));
}

export function getApiToken() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(apiTokenStorageKey) || "";
}

export function saveApiToken(value: string) {
  if (typeof window !== "undefined") window.localStorage.setItem(apiTokenStorageKey, value);
}

export function clearApiToken() {
  if (typeof window !== "undefined") window.localStorage.removeItem(apiTokenStorageKey);
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getApiToken();
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}
