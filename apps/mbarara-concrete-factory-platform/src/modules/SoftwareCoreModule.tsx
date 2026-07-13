import React, { useState } from "react";
import { CheckCircle2, LockKeyhole, Server, ShieldCheck } from "lucide-react";
import { MetricCard } from "../components/common/MetricCard";
import { Panel } from "../components/common/Panel";
import { apiRequest, clearApiToken, getApiBaseUrl, getApiToken, saveApiBaseUrl, saveApiToken } from "../lib/apiClient";

interface HealthResponse {
  status: string;
  service: string;
}

interface LoginResponse {
  access_token: string;
  user: {
    email: string;
    full_name: string;
    role: string;
  };
}

interface SoftwareStatusResponse {
  app_name: string;
  environment: string;
  database_engine: string;
  security_model: string;
  protected_modules: string[];
  currency_policy: string;
  owner_control: string;
}

export function SoftwareCoreModule() {
  const [apiBaseUrl, setApiBaseUrl] = useState(getApiBaseUrl());
  const [email, setEmail] = useState("arindahillary222@gmail.com");
  const [password, setPassword] = useState("");
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [softwareStatus, setSoftwareStatus] = useState<SoftwareStatusResponse | null>(null);
  const [loginUser, setLoginUser] = useState<LoginResponse["user"] | null>(null);
  const [message, setMessage] = useState("");
  const hasToken = Boolean(getApiToken());

  function saveConnection() {
    saveApiBaseUrl(apiBaseUrl);
    setMessage("API connection saved on this device.");
  }

  async function checkHealth() {
    try {
      saveApiBaseUrl(apiBaseUrl);
      const result = await apiRequest<HealthResponse>("/health");
      setHealth(result);
      setMessage("API health check passed.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "API health check failed.");
    }
  }

  async function login() {
    try {
      saveApiBaseUrl(apiBaseUrl);
      const result = await apiRequest<LoginResponse>("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      saveApiToken(result.access_token);
      setLoginUser(result.user);
      setMessage(`Signed in as ${result.user.full_name}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Owner login failed.");
    }
  }

  async function verifyProtectedCore() {
    try {
      const result = await apiRequest<SoftwareStatusResponse>("/api/v1/system/software-core");
      setSoftwareStatus(result);
      setMessage("Protected software-core endpoint verified.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Protected software-core check failed.");
    }
  }

  function logout() {
    clearApiToken();
    setLoginUser(null);
    setSoftwareStatus(null);
    setMessage("Access token removed from this browser.");
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="API foundation" value={health?.status === "ok" ? "Online" : "Check"} tone="navy" icon={<Server size={20} />} />
        <MetricCard label="Owner security" value={hasToken || loginUser ? "Token ready" : "Login needed"} tone="green" icon={<ShieldCheck size={20} />} />
        <MetricCard label="Accounting currency" value="UGX only" tone="blue" icon={<LockKeyhole size={20} />} />
      </div>

      <Panel title="Standard Software Core">
        <div className="grid gap-4 text-sm leading-6 text-slate-700 lg:grid-cols-2">
          <div className="space-y-3">
            <label className="grid gap-1 font-semibold text-slate-700">
              Backend API URL
              <input
                value={apiBaseUrl}
                onChange={(event) => setApiBaseUrl(event.target.value)}
                className="rounded-md border border-slate-300 px-3 py-2 font-normal"
                placeholder="http://127.0.0.1:8000"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={saveConnection} className="rounded-md bg-slate-900 px-4 py-2 font-semibold text-white">
                Save API URL
              </button>
              <button type="button" onClick={checkHealth} className="rounded-md bg-factory-blue px-4 py-2 font-semibold text-white">
                Check API Health
              </button>
            </div>
            {health && (
              <p className="rounded-md bg-emerald-50 p-3 font-semibold text-emerald-800">
                {health.service}: {health.status}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <label className="grid gap-1 font-semibold text-slate-700">
              Owner/staff email
              <input value={email} onChange={(event) => setEmail(event.target.value)} className="rounded-md border border-slate-300 px-3 py-2 font-normal" />
            </label>
            <label className="grid gap-1 font-semibold text-slate-700">
              Password
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                className="rounded-md border border-slate-300 px-3 py-2 font-normal"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={login} className="rounded-md bg-factory-green px-4 py-2 font-semibold text-white">
                Login
              </button>
              <button type="button" onClick={verifyProtectedCore} className="rounded-md bg-factory-navy px-4 py-2 font-semibold text-white">
                Verify Protected Core
              </button>
              <button type="button" onClick={logout} className="rounded-md border border-slate-300 px-4 py-2 font-semibold text-slate-700">
                Clear Token
              </button>
            </div>
          </div>
        </div>
        {message && <p className="mt-4 rounded-md bg-slate-50 p-3 text-sm font-semibold text-slate-700">{message}</p>}
      </Panel>

      {softwareStatus && (
        <Panel title="Protected Software Status" action={<CheckCircle2 className="text-factory-green" size={20} />}>
          <div className="grid gap-3 text-sm leading-6 text-slate-700 lg:grid-cols-2">
            <p><span className="font-semibold text-factory-navy">App:</span> {softwareStatus.app_name}</p>
            <p><span className="font-semibold text-factory-navy">Environment:</span> {softwareStatus.environment}</p>
            <p><span className="font-semibold text-factory-navy">Database:</span> {softwareStatus.database_engine}</p>
            <p><span className="font-semibold text-factory-navy">Currency:</span> {softwareStatus.currency_policy}</p>
            <p className="lg:col-span-2"><span className="font-semibold text-factory-navy">Security:</span> {softwareStatus.security_model}</p>
            <p className="lg:col-span-2"><span className="font-semibold text-factory-navy">Owner control:</span> {softwareStatus.owner_control}</p>
            <p className="lg:col-span-2">
              <span className="font-semibold text-factory-navy">Protected modules:</span> {softwareStatus.protected_modules.join(", ")}
            </p>
          </div>
        </Panel>
      )}
    </>
  );
}
