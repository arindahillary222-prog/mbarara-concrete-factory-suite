import { useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Boxes,
  Building2,
  Calculator,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Filter,
  Images,
  Mail,
  MapPin,
  MessageCircle,
  PackageCheck,
  Phone,
  QrCode,
  ShieldCheck,
  ShoppingCart,
  SlidersHorizontal,
  Smartphone,
  Truck,
  UploadCloud,
} from "lucide-react";
import { companyProfile, contactLinks, IS_UNBS_CERTIFIED } from "../config/site";
import type { AppState, Product } from "../types";

type ProductCategory = Product["category"];
type ProductUnit = Product["unit"] | "m2" | "unit";

interface WebsiteProduct {
  id: string;
  code: string;
  name: string;
  category: ProductCategory;
  unit: ProductUnit;
  priceUgx: number;
  description: string;
  image: string;
  availableStock: number;
  curingStatus: "Released for Sale" | "In Curing / Quality Testing" | "Quotation Required";
  approvalState: "Internal Pass" | "Pending Review" | "Quotation Required";
  weightKgPerUnit: number;
  deliveryThresholdQty: number;
}

interface BasketItem {
  product: WebsiteProduct;
  quantity: number;
  concreteClass?: string;
}

const formatUgx = new Intl.NumberFormat("en-UG", {
  style: "currency",
  currency: "UGX",
  maximumFractionDigits: 0,
});

const productCodes: Record<string, string> = {
  "4-inch hollow blocks": "B075",
  "6-inch hollow blocks": "B100",
  "8-inch hollow blocks": "B150",
  "solid blocks": "SB100",
  "solid concrete blocks": "SB100",
  "zig-zag pavers": "PZZ",
  "double-T pavers": "PDT",
  "hexagonal pavers": "PHX",
  "cobblestone pavers": "PCB",
  "grass/permeable pavers": "PGR",
  "60 mm pavers": "P60",
  "80 mm pavers": "P80",
  kerbstones: "KERB",
  "drainage channels": "DCH",
  culverts: "CUL",
  "ready-mix concrete": "RMC",
};

const imageByCategory: Record<string, string> = {
  blocks: "/assets/images/product-blocks.jpg",
  pavers: "/assets/images/product-pavers.jpg",
  kerbstones: "/assets/images/product-kerbstones.jpg",
  "drainage channels": "/assets/images/product-drainage.jpg",
  culverts: "/assets/images/product-culverts.jpg",
  "ready-mix concrete": "/assets/images/product-ready-mix.jpg",
};

const catalogueViewCount = 10;

function slugifyAsset(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function catalogueImagesForProduct(product: WebsiteProduct) {
  const slug = slugifyAsset(product.name);
  return Array.from({ length: catalogueViewCount }, (_, index) => ({
    id: `${product.id}-catalogue-${index + 1}`,
    src: `/assets/catalogue/${slug}-${String(index + 1).padStart(2, "0")}.svg`,
    label: `${product.name} catalogue view ${index + 1}`,
  }));
}

const additionalProducts: WebsiteProduct[] = [
  {
    id: "web-zig-zag-pavers",
    code: "PZZ",
    name: "zig-zag pavers",
    category: "pavers",
    unit: "m2",
    priceUgx: 65000,
    description: "Interlocking surface system for compounds, walkways, hotels, schools, fuel stations, and estate access lanes.",
    image: "/assets/images/product-pavers.jpg",
    availableStock: 420,
    curingStatus: "Released for Sale",
    approvalState: "Internal Pass",
    weightKgPerUnit: 145,
    deliveryThresholdQty: 80,
  },
  {
    id: "web-double-t-pavers",
    code: "PDT",
    name: "double-T pavers",
    category: "pavers",
    unit: "m2",
    priceUgx: 70000,
    description: "Heavy interlock paving format for high-traffic construction projects and commercial yards.",
    image: "/assets/images/product-pavers.jpg",
    availableStock: 300,
    curingStatus: "Released for Sale",
    approvalState: "Internal Pass",
    weightKgPerUnit: 155,
    deliveryThresholdQty: 75,
  },
  {
    id: "web-hexagonal-pavers",
    code: "PHX",
    name: "hexagonal pavers",
    category: "pavers",
    unit: "m2",
    priceUgx: 68000,
    description: "Premium decorative paving format for landscape edges, hospitality, residential, and institutional projects.",
    image: "/assets/images/product-pavers.jpg",
    availableStock: 240,
    curingStatus: "Released for Sale",
    approvalState: "Internal Pass",
    weightKgPerUnit: 145,
    deliveryThresholdQty: 80,
  },
];

function publicAsset(path: string) {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
}

function GlobalDeliveryBanner() {
  return (
    <div className="bg-amber-500 text-slate-950 font-bold text-center py-2 text-sm tracking-wide shadow-md flex justify-center items-center gap-2 px-4">
      <span aria-hidden="true">🚚</span>
      <span>
        FREE SITE DELIVERY | Complimentary Fleet Transportation Directly To Your Construction Site Across the Mbarara Region
        (On Qualifying Bulk Orders).
      </span>
    </div>
  );
}

function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-4 py-4 lg:px-6">
        <a href="#" className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-md bg-slate-950 text-amber-400">
            <Building2 size={24} />
          </span>
          <span>
            <span className="block text-base font-extrabold text-slate-950">{companyProfile.name}</span>
            <span className="block text-xs font-bold uppercase tracking-[0.14em] text-amber-600">Factory-direct concrete supply</span>
          </span>
        </a>
        <nav className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-700">
          <a href="#products" className="rounded-md px-3 py-2 hover:bg-slate-100">Products</a>
          <a href="#catalogue-gallery" className="rounded-md px-3 py-2 hover:bg-slate-100">Catalogue</a>
          <a href="#payments" className="rounded-md px-3 py-2 hover:bg-slate-100">Payments</a>
          <a href="#qr" className="rounded-md px-3 py-2 hover:bg-slate-100">QR Code</a>
          <a href="#founder" className="rounded-md px-3 py-2 hover:bg-slate-100">Founder</a>
          <a href="#inquiry" className="rounded-md bg-slate-950 px-4 py-2 text-white hover:bg-slate-800">Contact</a>
        </nav>
      </div>
    </header>
  );
}

function toWebsiteProduct(product: Product): WebsiteProduct {
  const isDeferred = product.targetDailyVolume <= 0 || product.confidenceLevel === "Quotation Required";
  const unit: ProductUnit = product.unit === "m3" ? "m3" : "unit";
  const weightMap: Record<string, number> = {
    "4-inch hollow blocks": 9,
    "6-inch hollow blocks": 13,
    "8-inch hollow blocks": 18,
    "solid blocks": 22,
    "60 mm pavers": 135,
    "80 mm pavers": 170,
    kerbstones: 55,
    "drainage channels": 95,
    culverts: 420,
    "ready-mix concrete": 2400,
  };

  return {
    id: product.id,
    code: productCodes[product.name] ?? product.id.slice(0, 5).toUpperCase(),
    name: product.name,
    category: product.category,
    unit: product.category === "pavers" ? "m2" : unit,
    priceUgx:
      product.category === "pavers" && product.unit === "piece"
        ? product.plannedPriceUgx * 28
        : product.plannedPriceUgx,
    description: product.assumptionLabel.replace("Assumption: ", ""),
    image:
      imageByCategory[product.name] ??
      imageByCategory[product.category] ??
      "/assets/images/product-blocks.jpg",
    availableStock: isDeferred ? 0 : Math.max(product.targetDailyVolume * 8, 120),
    curingStatus: isDeferred ? "Quotation Required" : "Released for Sale",
    approvalState: isDeferred ? "Quotation Required" : "Internal Pass",
    weightKgPerUnit: weightMap[product.name] ?? (product.category === "pavers" ? 145 : 25),
    deliveryThresholdQty: product.category === "blocks" ? 1000 : product.category === "pavers" ? 80 : 20,
  };
}

function BasketSummary({ items }: { items: BasketItem[] }) {
  const total = items.reduce((sum, item) => sum + item.quantity * item.product.priceUgx, 0);
  const totalWeight = items.reduce((sum, item) => sum + item.quantity * item.product.weightKgPerUnit, 0);
  const deliveryThresholdKg = 10000;
  const progress = Math.min(100, (totalWeight / deliveryThresholdKg) * 100);
  const remainingKg = Math.max(0, deliveryThresholdKg - totalWeight);
  const truckNotice =
    totalWeight >= 30000
      ? "30-tonne tipper planning required."
      : totalWeight >= 10000
        ? "Free factory tipper delivery bracket unlocked."
        : "Build basket weight to unlock free site delivery.";

  const orderText = encodeURIComponent(
    [
      `Hello ${companyProfile.name}, I would like to request a quotation/order.`,
      "",
      ...items.map(
        (item) =>
          `${item.product.code} - ${item.product.name}: ${item.quantity} ${item.product.unit} at ${formatUgx.format(
            item.product.priceUgx,
          )}`,
      ),
      "",
      `Estimated total: ${formatUgx.format(total)}`,
      `Estimated weight: ${(totalWeight / 1000).toFixed(2)} tonnes`,
      "Please confirm availability, delivery date, and payment terms.",
    ].join("\n"),
  );

  return (
    <aside className="sticky top-4 rounded-lg border border-slate-800 bg-slate-950 p-5 text-white shadow-xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-400">Live Basket</p>
          <h3 className="mt-1 text-xl font-extrabold">Quote & Delivery Planner</h3>
        </div>
        <ShoppingCart className="text-amber-400" size={28} />
      </div>

      <div className="mt-5 space-y-3">
        {items.length === 0 ? (
          <p className="rounded-md border border-slate-700 bg-slate-900 p-3 text-sm text-slate-300">
            Add products to build a quotation and send it directly by WhatsApp.
          </p>
        ) : (
          items.map((item) => (
            <div key={`${item.product.id}-${item.concreteClass ?? "standard"}`} className="rounded-md bg-white/8 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold">{item.product.name}</p>
                  <p className="text-xs text-slate-300">
                    {item.quantity} {item.product.unit}
                    {item.concreteClass ? ` | ${item.concreteClass}` : ""}
                  </p>
                </div>
                <p className="text-sm font-bold text-amber-300">
                  {formatUgx.format(item.quantity * item.product.priceUgx)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-5 rounded-md border border-amber-400/30 bg-amber-400/10 p-4">
        <div className="flex items-center justify-between text-sm font-bold">
          <span>Delivery progress</span>
          <span>{progress.toFixed(0)}%</span>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-800">
          <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-3 text-sm text-slate-200">
          {remainingKg > 0
            ? `Add approximately ${(remainingKg / 13).toFixed(0)} more 6-inch blocks to unlock 100% Free Factory Tipper Delivery.`
            : truckNotice}
        </p>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-md bg-white/8 p-3">
          <dt className="text-slate-400">Basket value</dt>
          <dd className="mt-1 font-extrabold text-amber-300">{formatUgx.format(total)}</dd>
        </div>
        <div className="rounded-md bg-white/8 p-3">
          <dt className="text-slate-400">Weight</dt>
          <dd className="mt-1 font-extrabold">{(totalWeight / 1000).toFixed(2)} t</dd>
        </div>
      </dl>

      <div className="mt-5 grid gap-2">
        <a
          href={`${contactLinks.whatsappUganda}?text=${orderText}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-md bg-amber-400 px-4 py-3 text-sm font-extrabold text-slate-950 hover:bg-amber-300"
        >
          <MessageCircle size={18} />
          Send order on WhatsApp
        </a>
        <a
          href={`mailto:${companyProfile.email}?subject=${encodeURIComponent("Concrete product inquiry")}&body=${orderText}`}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-600 px-4 py-3 text-sm font-bold text-white hover:bg-white/10"
        >
          <Mail size={18} />
          Email quotation request
        </a>
      </div>
    </aside>
  );
}

function LogisticsCapability({ basketWeightKg }: { basketWeightKg: number }) {
  const thresholdKg = 10000;
  const progress = Math.min(100, (basketWeightKg / thresholdKg) * 100);
  const remainingBlocks = Math.max(0, Math.ceil((thresholdKg - basketWeightKg) / 13));

  return (
    <section className="grid gap-5 rounded-lg bg-slate-950 p-5 text-white shadow-xl lg:grid-cols-2 lg:p-8">
      <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-amber-400 p-3 text-slate-950">
            <Truck size={28} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-400">Fleet capability</p>
            <h2 className="text-2xl font-extrabold">Our Dedicated Heavy Fleet Services</h2>
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            ["Zero Haulier Fees", "Bulk orders qualify for factory-managed delivery."],
            ["Direct-to-Site Crane/Tipper Delivery", "Dispatch planning for Mbarara regional projects."],
            ["Real-Time Site-Arrival Dispatch", "Clear coordination before truck release."],
          ].map(([title, body]) => (
            <div key={title} className="rounded-md bg-white p-4 text-slate-950">
              <p className="text-lg font-extrabold">{title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-amber-400/40 bg-amber-400/10 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-300">Dynamic cart progress</p>
            <h3 className="mt-1 text-2xl font-extrabold">Free Delivery Unlock Meter</h3>
          </div>
          <Calculator className="text-amber-300" size={30} />
        </div>
        <div className="mt-8">
          <div className="flex items-center justify-between text-sm font-bold">
            <span>{(basketWeightKg / 1000).toFixed(2)} tonnes loaded</span>
            <span>{progress.toFixed(0)}%</span>
          </div>
          <div className="mt-3 h-4 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-4 text-base font-semibold leading-7">
            {progress >= 100
              ? "Free Factory Tipper Delivery unlocked for qualifying site radius."
              : `Add ${remainingBlocks} more blocks to unlock 100% Free Factory Tipper Delivery!`}
          </p>
        </div>
      </div>
    </section>
  );
}

function MobileMoneyAndQr({ basketTotal, deliveryCost }: { basketTotal: number; deliveryCost: number }) {
  const payableTotal = basketTotal + deliveryCost;

  return (
    <section id="payments" className="grid gap-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[1.15fr_0.85fr]">
      <div>
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-slate-950 p-3 text-amber-400">
            <CreditCard size={28} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-600">Mobile Money Payments</p>
            <h2 className="text-3xl font-extrabold text-slate-950">Pay by MTN Mobile Money or Airtel Money</h2>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-5">
            <div className="flex items-center gap-3">
              <img
                src={publicAsset("/assets/logos/mtn-mobile-money.svg")}
                alt="MTN Mobile Money logo"
                className="h-14 w-28 rounded-md border border-yellow-300 bg-yellow-300 object-contain p-1 shadow-sm"
              />
              <div>
                <p className="text-sm font-black uppercase text-slate-950">MTN Mobile Money</p>
                <p className="text-2xl font-extrabold text-slate-950">{companyProfile.mtnMobileMoney}</p>
              </div>
            </div>
            <p className="mt-4 text-sm font-semibold leading-6 text-slate-700">
              Use this number only after the factory confirms product availability, delivery date, and final invoice amount.
            </p>
          </div>

          <div className="rounded-lg border border-red-200 bg-red-50 p-5">
            <div className="flex items-center gap-3">
              <img
                src={publicAsset("/assets/logos/airtel-money.svg")}
                alt="Airtel Money logo"
                className="h-14 w-28 rounded-md border border-red-200 bg-red-600 object-contain p-1 shadow-sm"
              />
              <div>
                <p className="text-sm font-black uppercase text-slate-950">Airtel Money</p>
                <p className="text-xl font-extrabold text-slate-950">Accepted after confirmation</p>
              </div>
            </div>
            <p className="mt-4 text-sm font-semibold leading-6 text-slate-700">{companyProfile.airtelMoneyNote}</p>
          </div>
        </div>

        <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Current basket payment guide</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div className="rounded-md bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase text-slate-500">Products</p>
              <p className="mt-1 text-lg font-extrabold text-slate-950">{formatUgx.format(basketTotal)}</p>
            </div>
            <div className="rounded-md bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase text-slate-500">Delivery</p>
              <p className="mt-1 text-lg font-extrabold text-slate-950">{formatUgx.format(deliveryCost)}</p>
            </div>
            <div className="rounded-md bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase text-slate-500">Estimated payable</p>
              <p className="mt-1 text-lg font-extrabold text-amber-700">{formatUgx.format(payableTotal)}</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Payments must match a confirmed invoice. This protects buyers from sending money before stock, delivery radius,
            and truck allocation are confirmed.
          </p>
        </div>
      </div>

      <div id="qr" className="rounded-lg bg-slate-950 p-5 text-white">
        <div className="flex items-center gap-3">
          <QrCode className="text-amber-400" size={30} />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-400">Scan and share</p>
            <h3 className="text-2xl font-extrabold">Website QR Code</h3>
          </div>
        </div>
        <div className="mt-5 rounded-lg bg-white p-4">
          <img
            src={publicAsset(companyProfile.qrCodePath)}
            alt="QR code for Mbarara Integrated Concrete Products Factory website"
            className="mx-auto w-full max-w-xs"
          />
        </div>
        <p className="mt-4 text-sm font-semibold leading-6 text-slate-300">
          Scan to open the permanent public website with products, catalogue visuals, inquiry form, Mobile Money details,
          WhatsApp links, PDF report, and videos.
        </p>
        <p className="mt-3 break-words text-sm font-semibold leading-6 text-amber-200">{companyProfile.publicWebsiteUrl}</p>
        <a
          href={companyProfile.publicWebsiteUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-amber-400 px-4 py-3 text-sm font-extrabold text-slate-950 hover:bg-amber-300"
        >
          Open public website
          <ArrowRight size={17} />
        </a>
      </div>
    </section>
  );
}

function QuantityPlanner({
  selected,
  onAdd,
}: {
  selected: WebsiteProduct;
  onAdd: (item: BasketItem) => void;
}) {
  const [unitQty, setUnitQty] = useState("500");
  const [length, setLength] = useState("10");
  const [width, setWidth] = useState("8");
  const [volume, setVolume] = useState("4.5");
  const [concreteClass, setConcreteClass] = useState("Class 25");
  const [error, setError] = useState("");

  function addItem() {
    let quantity = 0;
    if (selected.unit === "m2") {
      quantity = Number(length) * Number(width);
      if (!Number.isFinite(quantity) || quantity <= 0) {
        setError("Enter a valid length and width for the paving area.");
        return;
      }
    } else if (selected.unit === "m3") {
      quantity = Number(volume);
      if (!Number.isFinite(quantity) || quantity <= 0) {
        setError("Enter a valid ready-mix volume.");
        return;
      }
    } else {
      quantity = Number(unitQty);
      if (!Number.isInteger(quantity) || quantity <= 0) {
        setError("Blocks, kerbs, drainage channels, and culverts require whole-number quantities.");
        return;
      }
    }
    setError("");
    onAdd({ product: selected, quantity, concreteClass: selected.unit === "m3" ? concreteClass : undefined });
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-600">Material calculator</p>
          <h3 className="mt-1 text-xl font-extrabold text-slate-950">{selected.name}</h3>
          <p className="mt-1 text-sm text-slate-600">
            {selected.code} | {formatUgx.format(selected.priceUgx)} per {selected.unit}
          </p>
        </div>
        <span className="rounded-md bg-slate-100 px-3 py-2 text-xs font-bold uppercase text-slate-700">
          {selected.unit}
        </span>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {selected.unit === "m2" ? (
          <>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Length in metres
              <input
                value={length}
                onChange={(event) => setLength(event.target.value)}
                type="number"
                min="0"
                step="0.1"
                className="rounded-md border border-slate-300 px-3 py-3"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Width in metres
              <input
                value={width}
                onChange={(event) => setWidth(event.target.value)}
                type="number"
                min="0"
                step="0.1"
                className="rounded-md border border-slate-300 px-3 py-3"
              />
            </label>
            <div className="rounded-md bg-slate-100 p-4">
              <p className="text-xs font-bold uppercase text-slate-500">Auto area</p>
              <p className="mt-1 text-2xl font-extrabold text-slate-950">
                {(Number(length) * Number(width) || 0).toFixed(1)} m2
              </p>
            </div>
          </>
        ) : selected.unit === "m3" ? (
          <>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Concrete class
              <select
                value={concreteClass}
                onChange={(event) => setConcreteClass(event.target.value)}
                className="rounded-md border border-slate-300 px-3 py-3"
              >
                <option>Class 20</option>
                <option>Class 25</option>
                <option>Class 30</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Volume in m3
              <input
                value={volume}
                onChange={(event) => setVolume(event.target.value)}
                type="number"
                min="0"
                step="0.1"
                className="rounded-md border border-slate-300 px-3 py-3"
              />
            </label>
            <div className="rounded-md bg-slate-100 p-4">
              <p className="text-xs font-bold uppercase text-slate-500">Estimated mass</p>
              <p className="mt-1 text-2xl font-extrabold text-slate-950">
                {((Number(volume) * selected.weightKgPerUnit || 0) / 1000).toFixed(2)} t
              </p>
            </div>
          </>
        ) : (
          <>
            <label className="grid gap-2 text-sm font-semibold text-slate-700 md:col-span-2">
              Quantity required
              <input
                value={unitQty}
                onChange={(event) => setUnitQty(event.target.value)}
                type="number"
                min="1"
                step="1"
                className="rounded-md border border-slate-300 px-3 py-3"
              />
            </label>
            <div className="rounded-md bg-slate-100 p-4">
              <p className="text-xs font-bold uppercase text-slate-500">Integer rule</p>
              <p className="mt-1 text-sm font-bold text-slate-950">Whole units only</p>
            </div>
          </>
        )}
      </div>

      {error ? <p className="mt-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm font-semibold text-slate-900">{error}</p> : null}

      <button
        type="button"
        onClick={addItem}
        disabled={selected.availableStock <= 0 || selected.curingStatus !== "Released for Sale"}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-3 text-sm font-extrabold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        <ShoppingCart size={18} />
        Add to quotation basket
      </button>
    </div>
  );
}

function ProductCatalogueGallery({
  products,
  selected,
  onSelect,
}: {
  products: WebsiteProduct[];
  selected: WebsiteProduct;
  onSelect: (product: WebsiteProduct) => void;
}) {
  const images = catalogueImagesForProduct(selected);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const mainImage = images[selectedImageIndex] ?? images[0];
  const otherImages = images.filter((_, index) => index !== selectedImageIndex);

  return (
    <section id="catalogue-gallery" className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-600">Full product catalogue</p>
          <h2 className="mt-1 text-3xl font-extrabold text-slate-950">One main product photo, with more views on demand</h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
            Select a product below to view one clean display image first, then open the dropdown for the other nine
            catalogue views. No third-party branded website photos are used here; replace catalogue visuals only with
            factory-owned or licence-cleared product photos.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-md bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700">
          <Images size={17} />
          {products.length * catalogueViewCount} visuals
        </div>
      </div>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
        {products.map((product) => (
          <button
            key={product.id}
            type="button"
            onClick={() => {
              onSelect(product);
              setSelectedImageIndex(0);
            }}
            className={`shrink-0 rounded-md border px-3 py-2 text-left text-sm font-bold ${
              selected.id === product.id
                ? "border-amber-400 bg-amber-50 text-slate-950"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <span className="block text-xs uppercase text-slate-500">{product.code}</span>
            {product.name}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <figure className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
          <img
            src={publicAsset(mainImage.src)}
            alt={mainImage.label}
            className="aspect-[4/3] w-full bg-slate-200 object-cover"
          />
          <figcaption className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 text-sm font-bold text-slate-700">
            <span>{selected.code} | {selected.name}</span>
            <span>Photo {selectedImageIndex + 1} of {catalogueViewCount}</span>
          </figcaption>
        </figure>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-600">Display control</p>
          <h3 className="mt-1 text-2xl font-extrabold text-slate-950">{selected.name}</h3>
          <label className="mt-5 grid gap-2 text-sm font-semibold text-slate-700">
            Choose display photo
            <select
              value={selectedImageIndex}
              onChange={(event) => setSelectedImageIndex(Number(event.target.value))}
              className="rounded-md border border-slate-300 bg-white px-3 py-3"
            >
              {images.map((image, index) => (
                <option key={image.id} value={index}>
                  Photo {index + 1} of {catalogueViewCount}
                </option>
              ))}
            </select>
          </label>

          <details className="mt-5 rounded-lg border border-slate-200 bg-white">
            <summary className="cursor-pointer px-4 py-3 text-sm font-extrabold text-slate-950">
              See more catalogue photos
            </summary>
            <div className="grid gap-3 border-t border-slate-200 p-4 sm:grid-cols-2">
              {otherImages.map((image) => {
                const imageIndex = images.findIndex((candidate) => candidate.id === image.id);
                return (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => setSelectedImageIndex(imageIndex)}
                    className="overflow-hidden rounded-md border border-slate-200 bg-slate-50 text-left hover:border-amber-400"
                  >
                    <img
                      src={publicAsset(image.src)}
                      alt={image.label}
                      loading="lazy"
                      className="aspect-[4/3] w-full bg-slate-200 object-cover"
                    />
                    <span className="block px-3 py-2 text-xs font-bold text-slate-600">
                      Photo {imageIndex + 1} of {catalogueViewCount}
                    </span>
                  </button>
                );
              })}
            </div>
          </details>

          <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-semibold leading-6 text-slate-800">
            Real buyer-facing photos should come from our factory, our customers with permission, or licensed suppliers.
            Do not use another company&apos;s branded images as product evidence.
          </p>
        </div>
      </div>
    </section>
  );
}

function ProductCard({
  product,
  onSelect,
  onViewGallery,
}: {
  product: WebsiteProduct;
  onSelect: (product: WebsiteProduct) => void;
  onViewGallery: (product: WebsiteProduct) => void;
}) {
  const locked = product.availableStock === 0 || product.curingStatus !== "Released for Sale" || product.approvalState !== "Internal Pass";

  return (
    <article className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-200">
        <img src={publicAsset(product.image)} alt={`${product.name} product visual`} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        <div className="absolute left-3 top-3 rounded-md bg-slate-950 px-3 py-2 text-xs font-extrabold text-amber-300">
          {product.code}
        </div>
        {locked ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/55 backdrop-blur-[2px]">
            <span className="rounded-md bg-white px-4 py-3 text-sm font-extrabold text-slate-950">
              {product.availableStock === 0 ? "Out of Stock" : "In Curing / Quality Testing"}
            </span>
          </div>
        ) : null}
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-extrabold text-slate-950">{product.name}</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">{product.description}</p>
          </div>
          <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold uppercase text-slate-600">
            {product.unit}
          </span>
        </div>
        <div className="mt-5 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Ex-works price</p>
            <p className="text-xl font-extrabold text-slate-950">{formatUgx.format(product.priceUgx)}</p>
          </div>
          <div className="grid gap-2">
            <button
              type="button"
              onClick={() => onSelect(product)}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-amber-400 px-4 py-3 text-sm font-extrabold text-slate-950 hover:bg-amber-300"
            >
              Configure
              <ArrowRight size={17} />
            </button>
            <button
              type="button"
              onClick={() => {
                onViewGallery(product);
                document.getElementById("catalogue-gallery")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              <Images size={17} />
              Photos
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export function PublicWebsiteModule({ state }: { state: AppState }) {
  const products = useMemo(() => {
    const mapped = state.products.map(toWebsiteProduct);
    return [...mapped, ...additionalProducts].sort((a, b) => a.name.localeCompare(b.name));
  }, [state.products]);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | ProductCategory>("all");
  const [unit, setUnit] = useState<"all" | ProductUnit>("all");
  const [availability, setAvailability] = useState<"all" | "available" | "quote">("all");
  const [selectedProduct, setSelectedProduct] = useState<WebsiteProduct>(products[0]);
  const [galleryProduct, setGalleryProduct] = useState<WebsiteProduct>(products[0]);
  const [basket, setBasket] = useState<BasketItem[]>([]);
  const [paymentMode, setPaymentMode] = useState<"direct" | "credit">("direct");
  const [inquirySent, setInquirySent] = useState(false);

  const filteredProducts = products.filter((product) => {
    const queryMatch = `${product.name} ${product.code} ${product.description}`.toLowerCase().includes(query.toLowerCase());
    const categoryMatch = category === "all" || product.category === category;
    const unitMatch = unit === "all" || product.unit === unit;
    const availabilityMatch =
      availability === "all" ||
      (availability === "available" && product.availableStock > 0 && product.curingStatus === "Released for Sale") ||
      (availability === "quote" && (product.availableStock === 0 || product.curingStatus !== "Released for Sale"));
    return queryMatch && categoryMatch && unitMatch && availabilityMatch;
  });

  const basketTotal = basket.reduce((sum, item) => sum + item.quantity * item.product.priceUgx, 0);
  const basketWeight = basket.reduce((sum, item) => sum + item.quantity * item.product.weightKgPerUnit, 0);
  const approvedCreditLimit = 80000000;
  const outstandingBalance = 14500000;
  const remainingCredit = approvedCreditLimit - outstandingBalance;
  const deliveryCost = basketWeight >= 10000 ? 0 : 180000;
  const creditBlocked = paymentMode === "credit" && basketTotal + deliveryCost > remainingCredit;

  return (
    <div className="min-h-screen bg-slate-50">
      <GlobalDeliveryBanner />
      <PublicHeader />
      <main className="mx-auto max-w-[1600px] space-y-8 px-4 py-5 lg:px-6">
      <section className="overflow-hidden rounded-lg bg-slate-950 text-white shadow-xl">
        <div className="grid min-h-[620px] lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col justify-center px-5 py-12 sm:px-8 lg:px-12">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-sm font-bold text-amber-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Live plant status: quoting and dispatch planning open
            </div>
            <h1 className="mt-7 max-w-4xl text-4xl font-black leading-tight tracking-normal sm:text-5xl lg:text-6xl">
              Factory-direct concrete products for serious construction across Western Uganda.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Order hollow blocks, solid blocks, pavers, kerbstones, drainage channels, culverts, and future ready-mix concrete
              from a disciplined Mbarara production platform built around UGX pricing, batch traceability, and direct site delivery.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#products"
                className="inline-flex items-center gap-2 rounded-md bg-amber-400 px-5 py-3 text-sm font-extrabold text-slate-950 hover:bg-amber-300"
              >
                View products and prices
                <ArrowRight size={18} />
              </a>
              <a
                href={`${contactLinks.whatsappUganda}?text=${encodeURIComponent("Hello, I want to inquire about concrete products from Mbarara Integrated Concrete Products Factory.")}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-md border border-white/20 px-5 py-3 text-sm font-bold text-white hover:bg-white/10"
              >
                <MessageCircle size={18} />
                Chat now
              </a>
            </div>
            <div className="mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
              {[
                ["UGX only", "Transparent local pricing"],
                ["Batch QC", "Internal crushing tests"],
                ["Fleet logistics", "Direct site delivery"],
              ].map(([title, body]) => (
                <div key={title} className="rounded-md border border-slate-800 bg-white/5 p-4">
                  <p className="font-extrabold text-amber-300">{title}</p>
                  <p className="mt-1 text-sm text-slate-300">{body}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative min-h-[420px]">
            <img
              src={publicAsset("/assets/images/factory-hero.jpg")}
              alt="Concrete products yard with truck and block stacks"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-transparent" />
          </div>
        </div>
      </section>

      <LogisticsCapability basketWeightKg={basketWeight} />

      <section id="products" className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-600">Product catalogue</p>
                <h2 className="text-3xl font-extrabold text-slate-950">Products, prices, filters, and quotation basket</h2>
              </div>
              <div className="inline-flex items-center gap-2 rounded-md bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700">
                <Filter size={17} />
                {filteredProducts.length} products shown
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-5">
              <label className="grid gap-2 text-sm font-semibold text-slate-700 md:col-span-2">
                Search product
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search blocks, pavers, kerbs..."
                  className="rounded-md border border-slate-300 px-3 py-3"
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Category
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value as "all" | ProductCategory)}
                  className="rounded-md border border-slate-300 px-3 py-3"
                >
                  <option value="all">All categories</option>
                  <option value="blocks">Blocks</option>
                  <option value="pavers">Pavers</option>
                  <option value="precast">Precast</option>
                  <option value="ready-mix">Ready-mix</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Availability
                <select
                  value={availability}
                  onChange={(event) => setAvailability(event.target.value as "all" | "available" | "quote")}
                  className="rounded-md border border-slate-300 px-3 py-3"
                >
                  <option value="all">All statuses</option>
                  <option value="available">Ready to quote</option>
                  <option value="quote">Quotation required</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Unit
                <select
                  value={unit}
                  onChange={(event) => setUnit(event.target.value as "all" | ProductUnit)}
                  className="rounded-md border border-slate-300 px-3 py-3"
                >
                  <option value="all">All units</option>
                  <option value="unit">Unit</option>
                  <option value="m2">m2</option>
                  <option value="m3">m3</option>
                </select>
              </label>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={setSelectedProduct}
                onViewGallery={setGalleryProduct}
              />
            ))}
          </div>

          <ProductCatalogueGallery products={products} selected={galleryProduct} onSelect={setGalleryProduct} />

          <QuantityPlanner
            selected={selectedProduct}
            onAdd={(item) => setBasket((current) => [...current, item])}
          />
        </div>

        <BasketSummary items={basket} />
      </section>

      <section className="grid gap-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-600">Checkout safeguard</p>
          <h2 className="mt-1 text-3xl font-extrabold text-slate-950">Choose payment route</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Public buyers can submit an order inquiry by WhatsApp or email. Verified contractors can request credit-account fulfilment
            subject to balance and approved credit limit checks.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setPaymentMode("direct")}
              className={`rounded-md border p-4 text-left ${paymentMode === "direct" ? "border-amber-400 bg-amber-50" : "border-slate-200"}`}
            >
              <p className="font-extrabold text-slate-950">Direct Payment</p>
              <p className="mt-1 text-sm text-slate-600">Mobile Money / Cash / bank confirmation.</p>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMode("credit")}
              className={`rounded-md border p-4 text-left ${paymentMode === "credit" ? "border-amber-400 bg-amber-50" : "border-slate-200"}`}
            >
              <p className="font-extrabold text-slate-950">Contractor Credit Account</p>
              <p className="mt-1 text-sm text-slate-600">For verified customers with approved limits.</p>
            </button>
          </div>
        </div>
        <div className={`rounded-lg border p-5 ${creditBlocked ? "border-amber-500 bg-amber-50" : "border-slate-200 bg-slate-50"}`}>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["Approved Credit Limit", approvedCreditLimit],
              ["Current Outstanding Balance", outstandingBalance],
              ["Remaining Available Credit", remainingCredit],
            ].map(([label, value]) => (
              <div key={label} className="rounded-md bg-white p-4 shadow-sm">
                <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
                <p className={`mt-2 text-lg font-extrabold ${label === "Current Outstanding Balance" ? "text-red-600" : "text-slate-950"}`}>
                  {formatUgx.format(value as number)}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm font-semibold text-slate-700">
            Cart plus delivery: {formatUgx.format(basketTotal + deliveryCost)}
          </p>
          {creditBlocked ? (
            <p className="mt-3 rounded-md border border-amber-400 bg-white p-3 text-sm font-bold text-slate-950">
              Credit boundary reached. Please make a payment on the outstanding balance or contact the finance desk before checkout.
            </p>
          ) : (
            <p className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-800">
              Payment route is currently acceptable for inquiry submission.
            </p>
          )}
        </div>
      </section>

      <MobileMoneyAndQr basketTotal={basketTotal} deliveryCost={deliveryCost} />

      <section className="rounded-lg bg-slate-950 p-5 text-white shadow-xl">
        <div className="grid gap-5 lg:grid-cols-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-400">Verified contractor portal preview</p>
            <h2 className="mt-1 text-3xl font-extrabold">B2B ledger, order tracking, and blueprint requests</h2>
          </div>
          <div className="lg:col-span-2">
            <div className="grid gap-3 md:grid-cols-5">
              {["Draft", "Approved", "Fulfilling", "Out for Delivery", "Completed"].map((step, index) => (
                <div key={step} className="rounded-md border border-slate-800 bg-white/5 p-3">
                  <div className={`mb-3 h-2 rounded-full ${index <= 3 ? "bg-amber-400" : "bg-slate-700"}`} />
                  <p className="text-sm font-bold">{step}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-lg border border-dashed border-amber-400/60 bg-amber-400/10 p-6">
              <div className="flex flex-wrap items-center gap-4">
                <UploadCloud className="text-amber-300" size={34} />
                <div>
                  <p className="font-extrabold">Institutional Material Estimation Portal</p>
                  <p className="mt-1 text-sm text-slate-300">
                    Drag-and-drop zone concept for PDF, CAD, and DWG blueprint requests up to 50MB.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-3">
        {[
          [ShieldCheck, IS_UNBS_CERTIFIED ? "UNBS Verification Ready" : "Strict Internal Quality Controls & Batch Crushing Tests"],
          [ClipboardList, "Batch logs, curing records, and dispatch traceability"],
          [Building2, "Contractor, institution, hardware, and developer supply"],
        ].map(([Icon, title]) => (
          <div key={title as string} className="rounded-lg bg-slate-50 p-5">
            <Icon className="text-amber-500" size={30} />
            <p className="mt-4 text-lg font-extrabold text-slate-950">{title as string}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {IS_UNBS_CERTIFIED
                ? "Official certification display can be enabled later through the global feature flag."
                : "Laboratory quality certificates are compiled and issued upon final batch test verification."}
            </p>
          </div>
        ))}
      </section>

      <section id="founder" className="rounded-lg bg-white p-5 shadow-sm">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div className="rounded-lg bg-slate-100 p-4">
            <img
              src={publicAsset(companyProfile.founderPortraitPath)}
              alt={`${companyProfile.directorName}, ${companyProfile.directorTitle}`}
              className="mx-auto w-full max-w-sm aspect-[9/16] object-contain object-top shadow-lg rounded-xl border border-slate-800 bg-slate-100"
            />
          </div>
          <div>
            <p className="text-amber-500 tracking-widest text-xs font-bold uppercase">FOUNDER & MANAGING DIRECTOR</p>
            <h2 className="mb-2 mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">{companyProfile.directorName}</h2>
            <p className="text-sm font-bold text-slate-500">{companyProfile.directorTitle}</p>
            <blockquote className="mt-6 rounded-lg border-l-4 border-amber-400 bg-slate-950 p-6 text-lg font-semibold leading-8 text-white shadow-lg">
              "Our commitment is to build a factory known for structural durability, disciplined curing, laboratory crushing tests,
              and reliable industrial supply across Mbarara, Western Uganda, and the wider East African growth corridor."
            </blockquote>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={contactLinks.email} className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-4 py-3 text-sm font-bold text-white">
                <Mail size={18} />
                {companyProfile.email}
              </a>
              <a
                href={contactLinks.whatsappUganda}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-md bg-amber-400 px-4 py-3 text-sm font-extrabold text-slate-950"
              >
                <Phone size={18} />
                WhatsApp Uganda
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="inquiry" className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-600">Send inquiry</p>
            <h2 className="mt-1 text-3xl font-extrabold text-slate-950">Ask for price confirmation, delivery, or project supply</h2>
            <div className="mt-5 space-y-3 text-sm font-semibold text-slate-700">
              <p className="flex items-center gap-2">
                <MapPin size={18} className="text-amber-500" />
                {companyProfile.primaryLocation}
              </p>
              <p className="flex items-center gap-2">
                <Mail size={18} className="text-amber-500" />
                {companyProfile.email}
              </p>
              <p className="flex items-center gap-2">
                <MessageCircle size={18} className="text-amber-500" />
                {companyProfile.whatsappGermany} | {companyProfile.whatsappUganda}
              </p>
            </div>
          </div>
          <form
            name="product-inquiry"
            method="POST"
            data-netlify="true"
            onSubmit={(event) => {
              event.preventDefault();
              setInquirySent(true);
            }}
            className="grid gap-3"
          >
            <input type="hidden" name="form-name" value="product-inquiry" />
            <div className="grid gap-3 sm:grid-cols-2">
              <input name="name" required placeholder="Your name / company" className="rounded-md border border-slate-300 px-3 py-3" />
              <input name="phone" required placeholder="Phone / WhatsApp" className="rounded-md border border-slate-300 px-3 py-3" />
            </div>
            <input name="location" placeholder="Project location" className="rounded-md border border-slate-300 px-3 py-3" />
            <textarea name="message" rows={5} placeholder="Tell us product, quantity, delivery location, and timing..." className="rounded-md border border-slate-300 px-3 py-3" />
            <div className="flex flex-wrap gap-3">
              <button type="submit" className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-5 py-3 text-sm font-extrabold text-white">
                <PackageCheck size={18} />
                Submit inquiry
              </button>
              <a
                href={`${contactLinks.whatsappGermany}?text=${encodeURIComponent("Hello, I want to inquire about Mbarara concrete products.")}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-md bg-amber-400 px-5 py-3 text-sm font-extrabold text-slate-950"
              >
                <MessageCircle size={18} />
                Chat now
              </a>
            </div>
            {inquirySent ? (
              <p className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-800">
                Inquiry captured on this page. For fastest response, also use WhatsApp chat now.
              </p>
            ) : null}
          </form>
        </div>
      </section>

      <footer className="rounded-lg bg-slate-950 p-6 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-lg font-extrabold">{companyProfile.name}</p>
            <p className="mt-1 text-sm text-slate-400">UGX pricing only. Market prices, Mobile Money payments, and bulk delivery terms must be confirmed before final order.</p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <a href={contactLinks.email} className="rounded-md border border-slate-700 px-3 py-2 hover:bg-white/10">Email</a>
            <a href={contactLinks.whatsappUganda} target="_blank" rel="noreferrer" className="rounded-md border border-slate-700 px-3 py-2 hover:bg-white/10">WhatsApp UG</a>
            <a href={contactLinks.whatsappGermany} target="_blank" rel="noreferrer" className="rounded-md border border-slate-700 px-3 py-2 hover:bg-white/10">WhatsApp DE</a>
          </div>
        </div>
      </footer>
      </main>
    </div>
  );
}
