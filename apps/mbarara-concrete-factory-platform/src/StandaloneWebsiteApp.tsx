import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { initialState } from "./data/seedData";
import {
  applyDocumentLanguage,
  displayLanguageOptions,
  exchangeRateNote,
  getDisplayLanguageCode,
  getDisplayLanguageConfig,
  languageCopy,
  saveDisplayLanguageCode,
  type DisplayLanguageCode,
} from "./lib/localization";
import { useLocalStorageState } from "./lib/useLocalStorage";
import { PublicWebsiteModule } from "./modules/PublicWebsiteModule";
import type { AppState } from "./types";

const storageKey = "mbarara-concrete-factory-platform-state-v4-conservative-diesel";

function StandaloneWebsiteApp() {
  const [displayLanguage, setDisplayLanguage] = useState<DisplayLanguageCode>(() => getDisplayLanguageCode());
  const [state] = useLocalStorageState<AppState>(storageKey, initialState);
  const copy = languageCopy[displayLanguage] ?? languageCopy.en;
  const selectedLanguage = getDisplayLanguageConfig(displayLanguage);

  useEffect(() => {
    applyDocumentLanguage(displayLanguage);
  }, [displayLanguage]);

  function handleDisplayLanguageChange(language: DisplayLanguageCode) {
    saveDisplayLanguageCode(language);
    setDisplayLanguage(language);
  }

  return (
    <div className="min-h-screen max-w-full overflow-x-hidden bg-factory-paper">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-3 py-4 sm:px-4 lg:px-6">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-factory-green">UGX-base public sales website</p>
            <h1 className="mt-1 break-words text-xl font-semibold tracking-normal text-factory-navy">
              Mbarara Integrated Concrete Products Factory
            </h1>
          </div>
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-3">
            <label className="grid min-w-[230px] gap-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm">
              <span>{copy.languageCurrency}</span>
              <select
                value={displayLanguage}
                onChange={(event) => handleDisplayLanguageChange(event.target.value as DisplayLanguageCode)}
                className="w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-sm font-bold text-slate-900"
              >
                {displayLanguageOptions.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.label} / {option.nativeLabel} - {option.currency}
                  </option>
                ))}
              </select>
            </label>
            <div className="max-w-sm rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold leading-5 text-slate-800">
              <p>{selectedLanguage.summary}</p>
              <p>{copy.baseAccounting}. {exchangeRateNote(displayLanguage)}.</p>
              <p>{copy.fxWarning}</p>
            </div>
          </div>
        </div>
      </header>
      <PublicWebsiteModule state={state} displayLanguage={displayLanguage} />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<StandaloneWebsiteApp />);
