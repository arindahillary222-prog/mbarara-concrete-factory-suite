export type DisplayLanguageCode = "en" | "en_us" | "en_gb" | "de" | "zh" | "hi" | "fr" | "sw" | "ar" | "es";

export interface DisplayLanguageOption {
  code: DisplayLanguageCode;
  label: string;
  nativeLabel: string;
  locale: string;
  currency: "UGX" | "USD" | "GBP" | "EUR" | "CNY" | "INR" | "KES" | "AED";
  rateFromUgx: number;
  direction: "ltr" | "rtl";
  summary: string;
}

export const displayLanguageStorageKey = "mbarara-display-language-v2";

export const displayLanguageOptions: DisplayLanguageOption[] = [
  { code: "en", label: "English", nativeLabel: "Uganda", locale: "en-UG", currency: "UGX", rateFromUgx: 1, direction: "ltr", summary: "Default Uganda English display with UGX values." },
  { code: "en_us", label: "English", nativeLabel: "United States", locale: "en-US", currency: "USD", rateFromUgx: 0.000272, direction: "ltr", summary: "English display with approximate US dollar values." },
  { code: "en_gb", label: "English", nativeLabel: "United Kingdom", locale: "en-GB", currency: "GBP", rateFromUgx: 0.000203, direction: "ltr", summary: "English display with approximate British pound values." },
  { code: "de", label: "German", nativeLabel: "Deutsch", locale: "de-DE", currency: "EUR", rateFromUgx: 0.000238, direction: "ltr", summary: "Deutsche Anzeige mit ungefaehren Euro-Werten." },
  { code: "zh", label: "Chinese", nativeLabel: "中文", locale: "zh-CN", currency: "CNY", rateFromUgx: 0.00195, direction: "ltr", summary: "中文显示，金额约换算为人民币。" },
  { code: "hi", label: "Indian", nativeLabel: "Hindi / India", locale: "hi-IN", currency: "INR", rateFromUgx: 0.0235, direction: "ltr", summary: "Indian reader display with approximate rupee values." },
  { code: "fr", label: "French", nativeLabel: "Francais", locale: "fr-FR", currency: "EUR", rateFromUgx: 0.000238, direction: "ltr", summary: "Affichage francais avec des montants approximatifs en euros." },
  { code: "sw", label: "Kiswahili", nativeLabel: "Kiswahili", locale: "sw-KE", currency: "KES", rateFromUgx: 0.0351, direction: "ltr", summary: "Muonekano wa Kiswahili kwa makadirio ya thamani kwa shilingi za Kenya." },
  { code: "ar", label: "Arabic", nativeLabel: "Arabic", locale: "ar-AE", currency: "AED", rateFromUgx: 0.001, direction: "rtl", summary: "Arabic display with approximate UAE dirham values." },
  { code: "es", label: "Spanish", nativeLabel: "Espanol", locale: "es-ES", currency: "EUR", rateFromUgx: 0.000238, direction: "ltr", summary: "Pantalla en espanol con importes aproximados en euros." },
];

const englishNav = {
  website: "Public Website",
  dashboard: "Dashboard",
  financials: "Financials",
  inventory: "Inventory",
  production: "Production",
  quality: "QC Lab",
  erp: "ERP",
  market: "Market Intel",
  database: "PostgreSQL",
  report: "Master PDF",
};

export const languageCopy: Record<DisplayLanguageCode, { languageCurrency: string; baseAccounting: string; fxWarning: string; deliveryBanner: string; nav: Record<string, string> }> = {
  en: { languageCurrency: "Language and display currency", baseAccounting: "Default Uganda display uses UGX", fxWarning: "Switch to USD or GBP only for reader estimates; final settlement remains UGX.", deliveryBanner: "FREE SITE DELIVERY | Complimentary fleet transportation direct to your construction site across the Mbarara region.", nav: englishNav },
  en_us: { languageCurrency: "Language and display currency", baseAccounting: "Base accounting remains UGX", fxWarning: "Converted USD values are estimates for reader understanding, not bank quotations.", deliveryBanner: "FREE SITE DELIVERY | Complimentary fleet transportation direct to your construction site across the Mbarara region.", nav: englishNav },
  en_gb: { languageCurrency: "Language and display currency", baseAccounting: "Base accounting remains UGX", fxWarning: "Converted GBP values are estimates for reader understanding, not bank quotations.", deliveryBanner: "FREE SITE DELIVERY | Complimentary fleet transportation direct to your construction site across the Mbarara region.", nav: englishNav },
  de: { languageCurrency: "Sprache und Waehrung", baseAccounting: "Die Basisrechnung bleibt UGX", fxWarning: "Umgerechnete Werte sind Schaetzungen und keine Bankkurse.", deliveryBanner: "KOSTENLOSE BAUSTELLENLIEFERUNG | Flottentransport direkt zur Baustelle in der Region Mbarara.", nav: { website: "Oeffentliche Website", dashboard: "Uebersicht", financials: "Finanzen", inventory: "Lager", production: "Produktion", quality: "QS Labor", erp: "ERP", market: "Marktinfo", database: "PostgreSQL", report: "Master PDF" } },
  zh: { languageCurrency: "Language and currency", baseAccounting: "Base accounting remains UGX", fxWarning: "Converted values are estimates for reader understanding, not bank quotations.", deliveryBanner: "FREE SITE DELIVERY | Complimentary fleet transportation direct to your construction site across the Mbarara region.", nav: englishNav },
  hi: { languageCurrency: "Language and currency", baseAccounting: "Base accounting remains UGX", fxWarning: "Converted values are estimates for reader understanding, not bank quotations.", deliveryBanner: "FREE SITE DELIVERY | Complimentary fleet transportation direct to your construction site across the Mbarara region.", nav: englishNav },
  fr: { languageCurrency: "Langue et devise", baseAccounting: "La comptabilite de base reste en UGX", fxWarning: "Les montants convertis sont des estimations, pas des taux bancaires.", deliveryBanner: "LIVRAISON GRATUITE SUR CHANTIER | Transport direct vers votre chantier dans la region de Mbarara.", nav: { website: "Site public", dashboard: "Tableau de bord", financials: "Finances", inventory: "Stock", production: "Production", quality: "Labo QC", erp: "ERP", market: "Marche", database: "PostgreSQL", report: "PDF maitre" } },
  sw: { languageCurrency: "Lugha na sarafu", baseAccounting: "Hesabu kuu bado ni UGX", fxWarning: "Thamani zilizobadilishwa ni makadirio, si bei rasmi za benki.", deliveryBanner: "USAFIRISHAJI WA BURE | Usafirishaji moja kwa moja kwenye eneo la ujenzi mkoa wa Mbarara.", nav: { website: "Tovuti ya Umma", dashboard: "Dashibodi", financials: "Fedha", inventory: "Stoo", production: "Uzalishaji", quality: "Maabara QC", erp: "ERP", market: "Soko", database: "PostgreSQL", report: "PDF Kuu" } },
  ar: { languageCurrency: "Language and currency", baseAccounting: "Base accounting remains UGX", fxWarning: "Converted values are estimates for reader understanding, not bank quotations.", deliveryBanner: "FREE SITE DELIVERY | Complimentary fleet transportation direct to your construction site across the Mbarara region.", nav: englishNav },
  es: { languageCurrency: "Idioma y moneda", baseAccounting: "La contabilidad base sigue en UGX", fxWarning: "Los valores convertidos son estimaciones, no cotizaciones bancarias.", deliveryBanner: "ENTREGA GRATUITA EN OBRA | Transporte directo a su obra en la region de Mbarara.", nav: { website: "Sitio publico", dashboard: "Panel", financials: "Finanzas", inventory: "Inventario", production: "Produccion", quality: "Lab QC", erp: "ERP", market: "Mercado", database: "PostgreSQL", report: "PDF maestro" } },
};

export function getDisplayLanguageCode(): DisplayLanguageCode {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem(displayLanguageStorageKey);
  return displayLanguageOptions.some((option) => option.code === stored) ? (stored as DisplayLanguageCode) : "en";
}

export function getDisplayLanguageConfig(code: DisplayLanguageCode = getDisplayLanguageCode()) {
  return displayLanguageOptions.find((option) => option.code === code) ?? displayLanguageOptions[0];
}

export function saveDisplayLanguageCode(code: DisplayLanguageCode) {
  if (typeof window !== "undefined") window.localStorage.setItem(displayLanguageStorageKey, code);
}

export function applyDocumentLanguage(code: DisplayLanguageCode) {
  if (typeof document === "undefined") return;
  const config = getDisplayLanguageConfig(code);
  document.documentElement.lang = config.locale;
  document.documentElement.dir = config.direction;
}

export function formatBaseUGX(value: number, compact = false) {
  return `UGX ${new Intl.NumberFormat("en-UG", { maximumFractionDigits: 0, notation: compact ? "compact" : "standard" }).format(Number.isFinite(value) ? value : 0)}`;
}

export function formatDisplayMoney(valueUgx: number, compact = false, code: DisplayLanguageCode = getDisplayLanguageCode()) {
  const config = getDisplayLanguageConfig(code);
  if (config.currency === "UGX") return formatBaseUGX(valueUgx, compact);
  const converted = (Number.isFinite(valueUgx) ? valueUgx : 0) * config.rateFromUgx;
  return new Intl.NumberFormat(config.locale, {
    style: "currency",
    currency: config.currency,
    currencyDisplay: "code",
    maximumFractionDigits: compact || Math.abs(converted) >= 100 ? 0 : 2,
    notation: compact ? "compact" : "standard",
  }).format(converted);
}

export function exchangeRateNote(code: DisplayLanguageCode = getDisplayLanguageCode()) {
  const config = getDisplayLanguageConfig(code);
  if (config.currency === "UGX") return "Default display: UGX";
  return `1 ${config.currency} ≈ ${formatBaseUGX(1 / config.rateFromUgx)}`;
}
