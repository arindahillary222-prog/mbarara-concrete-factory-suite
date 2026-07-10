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
  Download,
  Filter,
  FileText,
  Images,
  Mail,
  MapPin,
  MessageCircle,
  PackageCheck,
  Phone,
  PlayCircle,
  Presentation,
  QrCode,
  ShieldCheck,
  ShoppingCart,
  SlidersHorizontal,
  Smartphone,
  Truck,
  UploadCloud,
} from "lucide-react";
import { companyProfile, contactLinks, IS_UNBS_CERTIFIED } from "../config/site";
import { computeErp } from "../lib/calculations";
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

interface CatalogueImage {
  id: string;
  src: string;
  fallbackSrc?: string;
  label: string;
  sourceStatus: "Uploaded product photo" | "Awaiting upload" | "Catalogue fallback";
  matchNote?: string;
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
  blocks: "/assets/images/product-blocks.png",
  pavers: "/assets/images/product-pavers.png",
  kerbstones: "/assets/images/product-kerbstones.png",
  "drainage channels": "/assets/images/product-drainage.png",
  culverts: "/assets/images/product-culverts.png",
  "ready-mix concrete": "/assets/images/product-ready-mix.png",
};

const catalogueViewCount = 10;

const fundingDownloads = [
  {
    title: "Complete Funding Pack",
    detail: "ZIP bundle with the pitch deck, one-page summary, UGX 130M budget, data file, script, and 3-minute video.",
    href: "/funding-pack/Mbarara_Concrete_Factory_COMPLETE_Funding_Pack.zip",
    icon: Download,
  },
  {
    title: "10-Slide Pitch Deck",
    detail: "Investor deck in editable PowerPoint format plus a PDF copy for easy sharing.",
    href: "/funding-pack/Mbarara_Concrete_Factory_Investor_Pitch_Deck.pptx",
    icon: Presentation,
  },
  {
    title: "Pitch Deck PDF",
    detail: "PDF version of the 10-slide funding presentation.",
    href: "/funding-pack/Mbarara_Concrete_Factory_Investor_Pitch_Deck.pdf",
    icon: FileText,
  },
  {
    title: "One-Page Summary",
    detail: "Concise founder story, Phase 1 plan, financial snapshot, links, and disclaimer.",
    href: "/funding-pack/Mbarara_Concrete_Factory_One_Page_Funding_Summary.pdf",
    icon: FileText,
  },
  {
    title: "UGX 130M Phase 1 Budget",
    detail: "Exact starter budget: UGX 128M essential startup cost plus UGX 2M protected buffer.",
    href: "/funding-pack/Mbarara_Concrete_Factory_UGX_130M_Phase_1_Budget.pdf",
    icon: ClipboardList,
  },
  {
    title: "3-Minute Funding Video",
    detail: "US English narrated video explaining the project, model, risks, and funding ask.",
    href: "/funding-pack/Mbarara_Concrete_Factory_3_Minute_Funding_Pitch.mp4",
    icon: PlayCircle,
  },
  {
    title: "Master PDF Report",
    detail: "Full project report covering the financial simulator, ERP, inventory, QC, market intelligence, risks, and roadmap.",
    href: "/Mbarara_Integrated_Concrete_Factory_Master_Report.pdf",
    icon: FileText,
  },
];

function slugifyAsset(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const uploadedCataloguePhotoSlots: Record<string, Array<Omit<CatalogueImage, "id" | "fallbackSrc" | "sourceStatus">>> = {
  "60 mm pavers": [
    {
      src: "/assets/catalogue/60-mm-pavers-01.png",
      label: "Cassablanca Smart Paver (260x110x60mm) - Light Grey (29M2) SKU116",
      matchNote: "Matched to 60 mm pavers because the supplied title specifies a 60mm smart paver. Showing a clean generated category image until the exact owned photo file is added.",
    },
  ],
  "ready-mix concrete": [
    {
      src: "/assets/catalogue/ready-mix-concrete-01.png",
      label: "Ready-Mixed Concrete and Concrete Mixer Truck",
      matchNote: "Matched to ready-mix concrete because the title names ready-mixed concrete. Showing a clean generated category image until the exact owned photo file is added.",
    },
  ],
  "4-inch hollow blocks": [
    {
      src: "/assets/catalogue/4-inch-hollow-blocks-01.png",
      label: "Hollow Concrete Blocks 4 Inches (10x20x40cm / 100x200x400mm)",
      matchNote: "Matched to 4-inch hollow blocks because the supplied title names 4 inches / 100mm blocks. Showing a clean generated category image until the exact owned photo file is added.",
    },
    {
      src: "/assets/catalogue/4-inch-hollow-blocks-02.png",
      label: "Hollow Concrete Blocks 4 Inches (10cm / 100mm) - Single Block View",
      matchNote: "Matched to 4-inch hollow blocks because the supplied title names 4 inches / 100mm blocks. Showing a clean generated category image until the exact owned photo file is added.",
    },
  ],
  culverts: [
    {
      src: "/assets/catalogue/culverts-01.png",
      label: "Concrete Culvert",
      matchNote: "Matched to culverts because the supplied title names Concrete Culvert. Showing a clean generated category image until the exact owned photo file is added.",
    },
  ],
  "double-T pavers": [
    {
      src: "/assets/catalogue/double-t-pavers-01.png",
      label: "Double T Smart Paver (220x120x60mm) - Coral Red (31 Pcs/M2) SKU139",
      matchNote: "Matched to double-T pavers because the supplied title names Double T Smart Paver. Showing a clean generated category image until the exact owned photo file is added.",
    },
    {
      src: "/assets/catalogue/double-t-pavers-02.png",
      label: "Double T Smart Paver (220x120x60mm) - Light Grey (31 Pcs/M2) SKU117",
      matchNote: "Matched to double-T pavers because the supplied title names Double T Smart Paver. Showing a clean generated category image until the exact owned photo file is added.",
    },
  ],
  "drainage channels": [
    {
      src: "/assets/catalogue/drainage-channels-01.png",
      label: "Precast Concrete Drainage Channels - Slot Drainage",
      matchNote: "Matched to drainage channels because the supplied title names precast concrete drainage channels. Showing a clean generated category image until the exact owned photo file is added.",
    },
  ],
  "grass/permeable pavers": [
    {
      src: "/assets/catalogue/grass-permeable-pavers-01.png",
      label: "Grass Block Pavers (400x200x60mm) - Light Grey (13 Pcs/M2) SKU062",
      matchNote: "Matched to grass/permeable pavers because the supplied title names grass block pavers. Showing a clean generated category image until the exact owned photo file is added.",
    },
  ],
};

function generatedCatalogueImage(product: WebsiteProduct, index: number): CatalogueImage {
  const slug = slugifyAsset(product.name);
  return {
    id: `${product.id}-catalogue-${index + 1}`,
    src: `/assets/catalogue/${slug}-${String(index + 1).padStart(2, "0")}.png`,
    label: `${product.name} catalogue view ${index + 1}`,
    sourceStatus: "Catalogue fallback",
  };
}

function catalogueImagesForProduct(product: WebsiteProduct): CatalogueImage[] {
  const generated = Array.from({ length: catalogueViewCount }, (_, index) => generatedCatalogueImage(product, index));
  const uploadedSlots = uploadedCataloguePhotoSlots[product.name] ?? [];

  uploadedSlots.forEach((slot, index) => {
    if (index >= generated.length) return;
    generated[index] = {
      ...slot,
      id: `${product.id}-uploaded-photo-${index + 1}`,
      fallbackSrc: generated[index].src,
      sourceStatus: "Awaiting upload",
    };
  });

  return generated;
}

function FallbackImage({
  src,
  fallbackSrc,
  alt,
  className,
  loading,
}: {
  src: string;
  fallbackSrc?: string;
  alt: string;
  className: string;
  loading?: "lazy" | "eager";
}) {
  return (
    <img
      src={publicAsset(src)}
      alt={alt}
      loading={loading}
      className={className}
      onError={(event) => {
        if (!fallbackSrc) return;
        const fallback = publicAsset(fallbackSrc);
        if (event.currentTarget.src !== fallback) {
          event.currentTarget.src = fallback;
        }
      }}
    />
  );
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
    image: "/assets/images/product-pavers.png",
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
    image: "/assets/images/product-pavers.png",
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
    image: "/assets/images/product-pavers.png",
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
    <div className="flex w-full max-w-full items-center justify-center gap-2 bg-amber-500 px-3 py-2 text-center text-sm font-bold tracking-wide text-slate-950 shadow-md sm:px-4">
      <span aria-hidden="true">🚚</span>
      <span className="min-w-0 text-balance leading-5">
        FREE SITE DELIVERY | Complimentary Fleet Transportation Directly To Your Construction Site Across the Mbarara Region
        (On Qualifying Bulk Orders).
      </span>
    </div>
  );
}

function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 w-full max-w-full border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-3 py-4 sm:px-4 lg:px-6">
        <a href="#" className="flex min-w-0 flex-1 items-center gap-3 sm:flex-none">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-slate-950 text-amber-400">
            <Building2 size={24} />
          </span>
          <span className="min-w-0">
            <span className="block break-words text-base font-extrabold leading-snug text-slate-950">{companyProfile.name}</span>
            <span className="block break-words text-xs font-bold uppercase tracking-[0.12em] text-amber-600">
              Factory-direct concrete supply
            </span>
          </span>
        </a>
        <nav className="touch-scroll flex max-w-full flex-wrap items-center justify-start gap-2 overflow-x-auto pb-1 text-sm font-bold text-slate-700 sm:justify-end">
          <a href="#products" className="rounded-md px-3 py-2 hover:bg-slate-100">Products</a>
          <a href="#catalogue-gallery" className="rounded-md px-3 py-2 hover:bg-slate-100">Catalogue</a>
          <a href="#payments" className="rounded-md px-3 py-2 hover:bg-slate-100">Payments</a>
          <a href="#qr" className="rounded-md px-3 py-2 hover:bg-slate-100">QR Code</a>
          <a href="#funding-pack" className="rounded-md px-3 py-2 hover:bg-slate-100">Funding Pack</a>
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
      "/assets/images/product-blocks.png",
    availableStock: isDeferred ? 0 : Math.max(product.targetDailyVolume * 8, 120),
    curingStatus: isDeferred ? "Quotation Required" : "Released for Sale",
    approvalState: isDeferred ? "Quotation Required" : "Internal Pass",
    weightKgPerUnit: weightMap[product.name] ?? (product.category === "pavers" ? 145 : 25),
    deliveryThresholdQty: product.category === "blocks" ? 1000 : product.category === "pavers" ? 80 : 20,
  };
}

function buildWhatsAppCheckoutPayload({
  items,
  total,
  totalWeight,
  deliveryThresholdKg,
}: {
  items: BasketItem[];
  total: number;
  totalWeight: number;
  deliveryThresholdKg: number;
}) {
  const deliveryStatus =
    totalWeight >= deliveryThresholdKg
      ? "Free Factory Tipper Delivery bracket unlocked, subject to final radius and truck availability."
      : `Below free delivery bracket. Approx. ${((deliveryThresholdKg - totalWeight) / 1000).toFixed(2)} more tonnes needed.`;

  const productLines =
    items.length > 0
      ? items.map((item, index) => {
          const lineTotal = item.quantity * item.product.priceUgx;
          const lineWeight = item.quantity * item.product.weightKgPerUnit;
          return [
            `${index + 1}. ${item.product.code} - ${item.product.name}`,
            `   Quantity: ${item.quantity} ${item.product.unit}${item.concreteClass ? ` (${item.concreteClass})` : ""}`,
            `   Unit price: ${formatUgx.format(item.product.priceUgx)}`,
            `   Line total: ${formatUgx.format(lineTotal)}`,
            `   Estimated weight: ${(lineWeight / 1000).toFixed(2)} tonnes`,
          ].join("\n");
        })
      : ["No products selected yet."];

  return [
    `Hello ${companyProfile.name}, I would like to request a quotation/order from the website cart.`,
    "",
    "WHATSAPP CHECKOUT PAYLOAD",
    `Currency: UGX only`,
    `Customer name/company:`,
    `Project location:`,
    `Preferred delivery date:`,
    "",
    "Cart items:",
    ...productLines,
    "",
    `Estimated product total: ${formatUgx.format(total)}`,
    `Estimated basket weight: ${(totalWeight / 1000).toFixed(2)} tonnes`,
    `Delivery status: ${deliveryStatus}`,
    "",
    "Payment route requested:",
    `- MTN Mobile Money: ${companyProfile.mtnMobileMoney}`,
    "- Airtel Money: accepted after final order confirmation",
    "- Do not send money until stock, delivery radius, and invoice total are confirmed.",
    "",
    "Please confirm availability, curing/QC release status, delivery cost if any, final invoice amount, and payment instructions.",
  ].join("\n");
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

  const checkoutPayload = buildWhatsAppCheckoutPayload({ items, total, totalWeight, deliveryThresholdKg });
  const orderText = encodeURIComponent(checkoutPayload);

  return (
    <aside className="sticky top-4 w-full max-w-full rounded-lg border border-slate-800 bg-slate-950 p-5 text-white shadow-xl">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-400">Live Basket</p>
          <h3 className="mt-1 break-words text-xl font-extrabold">Quote & Delivery Planner</h3>
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
                <div className="min-w-0">
                  <p className="break-words text-sm font-bold">{item.product.name}</p>
                  <p className="text-xs text-slate-300">
                    {item.quantity} {item.product.unit}
                    {item.concreteClass ? ` | ${item.concreteClass}` : ""}
                  </p>
                </div>
                <p className="shrink-0 text-right text-sm font-bold text-amber-300">
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

      <dl className="mt-5 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <div className="rounded-md bg-white/8 p-3">
          <dt className="text-slate-400">Basket value</dt>
          <dd className="mt-1 break-words font-extrabold text-amber-300">{formatUgx.format(total)}</dd>
        </div>
        <div className="rounded-md bg-white/8 p-3">
          <dt className="text-slate-400">Weight</dt>
          <dd className="mt-1 font-extrabold">{(totalWeight / 1000).toFixed(2)} t</dd>
        </div>
      </dl>

      <div className="mt-5 grid gap-2">
        <a
          href={`${contactLinks.whatsappUganda}?text=${orderText}`}
          data-checkout-payload={checkoutPayload}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-md bg-amber-400 px-4 py-3 text-center text-sm font-extrabold text-slate-950 hover:bg-amber-300"
        >
          <MessageCircle size={18} />
          Send order on WhatsApp
        </a>
        <a
          href={`mailto:${companyProfile.email}?subject=${encodeURIComponent("Concrete product inquiry")}&body=${orderText}`}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-600 px-4 py-3 text-center text-sm font-bold text-white hover:bg-white/10"
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
    <section className="grid max-w-full gap-5 rounded-lg bg-slate-950 p-5 text-white shadow-xl lg:grid-cols-2 lg:p-8">
      <div className="min-w-0 rounded-lg border border-slate-800 bg-slate-900 p-6">
        <div className="flex items-center gap-3">
          <div className="shrink-0 rounded-md bg-amber-400 p-3 text-slate-950">
            <Truck size={28} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-400">Fleet capability</p>
            <h2 className="break-words text-2xl font-extrabold">Our Dedicated Heavy Fleet Services</h2>
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

      <div className="min-w-0 rounded-lg border border-amber-400/40 bg-amber-400/10 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-300">Dynamic cart progress</p>
            <h3 className="mt-1 break-words text-2xl font-extrabold">Free Delivery Unlock Meter</h3>
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
    <section id="payments" className="grid max-w-full gap-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <div className="shrink-0 rounded-md bg-slate-950 p-3 text-amber-400">
            <CreditCard size={28} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-600">Mobile Money Payments</p>
            <h2 className="break-words text-2xl font-extrabold text-slate-950 sm:text-3xl">Pay by MTN Mobile Money or Airtel Money</h2>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="overflow-hidden rounded-xl border-2 border-[#ffcc00] bg-[#fff8d6] shadow-sm">
            <div className="bg-[#ffcc00] px-5 py-3">
              <img
                src={publicAsset("/assets/logos/mtn-mobile-money.svg")}
                alt="MTN Mobile Money logo"
                className="h-20 w-full object-contain"
              />
            </div>
            <div className="p-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-600">Payment receiving number</p>
                <p className="mt-1 break-words text-2xl font-extrabold text-slate-950 sm:text-3xl">{companyProfile.mtnMobileMoney}</p>
              </div>
              <p className="mt-4 text-sm font-semibold leading-6 text-slate-700">
                Use this number only after the factory confirms product availability, delivery date, and final invoice amount.
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border-2 border-[#e60000] bg-red-50 shadow-sm">
            <div className="bg-[#e60000] px-5 py-3">
              <img
                src={publicAsset("/assets/logos/airtel-money.svg")}
                alt="Airtel Money logo"
                className="h-20 w-full object-contain"
              />
            </div>
            <div className="p-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-600">Airtel payment route</p>
                <p className="mt-1 break-words text-2xl font-extrabold text-slate-950">Accepted after confirmation</p>
              </div>
              <p className="mt-4 text-sm font-semibold leading-6 text-slate-700">{companyProfile.airtelMoneyNote}</p>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Current basket payment guide</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div className="rounded-md bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase text-slate-500">Products</p>
              <p className="mt-1 break-words text-lg font-extrabold text-slate-950">{formatUgx.format(basketTotal)}</p>
            </div>
            <div className="rounded-md bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase text-slate-500">Delivery</p>
              <p className="mt-1 break-words text-lg font-extrabold text-slate-950">{formatUgx.format(deliveryCost)}</p>
            </div>
            <div className="rounded-md bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase text-slate-500">Estimated payable</p>
              <p className="mt-1 break-words text-lg font-extrabold text-amber-700">{formatUgx.format(payableTotal)}</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Payments must match a confirmed invoice. This protects buyers from sending money before stock, delivery radius,
            and truck allocation are confirmed.
          </p>
        </div>
      </div>

      <div id="qr" className="min-w-0 rounded-lg bg-slate-950 p-5 text-white">
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
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-amber-400 px-4 py-3 text-center text-sm font-extrabold text-slate-950 hover:bg-amber-300"
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
    <section id="catalogue-gallery" className="max-w-full rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-600">Full product catalogue</p>
          <h2 className="mt-1 break-words text-2xl font-extrabold text-slate-950 sm:text-3xl">
            One main product photo, with more views on demand
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
            Select a product below to view one clean display image first, then open the dropdown for the other nine
            catalogue views. No third-party branded website photos are used here; replace catalogue visuals only with
            factory-owned, licence-cleared, product-only, factory-only, or company-approved local team photos.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-md bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700">
          <Images size={17} />
          {products.length * catalogueViewCount} visuals
        </div>
      </div>

      <div className="mt-5 flex max-w-full flex-wrap gap-2 pb-2">
        {products.map((product) => (
          <button
            key={product.id}
            type="button"
            onClick={() => {
              onSelect(product);
              setSelectedImageIndex(0);
            }}
            className={`min-w-[9rem] max-w-[14rem] flex-1 whitespace-normal break-words rounded-md border px-3 py-2 text-left text-sm font-bold sm:flex-none ${
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

      <div className="mt-5 grid max-w-full gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <figure className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
          <FallbackImage
            src={mainImage.src}
            fallbackSrc={mainImage.fallbackSrc}
            alt={mainImage.label}
            className="aspect-[4/3] w-full bg-slate-200 object-cover"
          />
          <figcaption className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 text-sm font-bold text-slate-700">
            <span className="min-w-0 break-words">{mainImage.label}</span>
            <span>Photo {selectedImageIndex + 1} of {catalogueViewCount}</span>
          </figcaption>
          {mainImage.matchNote ? (
            <p className="border-t border-slate-200 px-4 py-3 text-sm font-semibold leading-6 text-slate-600">
              {mainImage.matchNote}
            </p>
          ) : null}
        </figure>

        <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-600">Display control</p>
          <h3 className="mt-1 break-words text-2xl font-extrabold text-slate-950">{selected.name}</h3>
          <label className="mt-5 grid gap-2 text-sm font-semibold text-slate-700">
            Choose display photo
            <select
              value={selectedImageIndex}
              onChange={(event) => setSelectedImageIndex(Number(event.target.value))}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-3"
            >
              {images.map((image, index) => (
                <option key={image.id} value={index}>
                  Photo {index + 1}: {image.label}
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
                    <FallbackImage
                      src={image.src}
                      fallbackSrc={image.fallbackSrc}
                      alt={image.label}
                      loading="lazy"
                      className="aspect-[4/3] w-full bg-slate-200 object-cover"
                    />
                    <span className="block px-3 py-2 text-xs font-bold leading-5 text-slate-600">
                      Photo {imageIndex + 1}: {image.label}
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
    <article className="group relative max-w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-200">
        <FallbackImage
          src={product.image}
          fallbackSrc="/assets/images/product-blocks.png"
          alt={`${product.name} product visual`}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
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
          <div className="min-w-0">
            <h3 className="break-words text-lg font-extrabold text-slate-950">{product.name}</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">{product.description}</p>
          </div>
          <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold uppercase text-slate-600">
            {product.unit}
          </span>
        </div>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Ex-works price</p>
            <p className="break-words text-xl font-extrabold text-slate-950">{formatUgx.format(product.priceUgx)}</p>
          </div>
          <div className="grid min-w-[9rem] gap-2">
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
  const financials = useMemo(() => computeErp(state).financials, [state]);

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
    <div className="min-h-screen max-w-full overflow-x-hidden bg-slate-50">
      <GlobalDeliveryBanner />
      <PublicHeader />
      <main className="mx-auto max-w-7xl space-y-8 overflow-hidden px-3 py-5 sm:px-4 lg:px-6">
      <section className="overflow-hidden rounded-md bg-slate-950 text-white shadow-xl sm:rounded-lg">
        <div className="grid min-h-[auto] lg:min-h-[620px] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="flex min-w-0 flex-col justify-center px-5 py-12 sm:px-8 lg:px-12">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-sm font-bold text-amber-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Live plant status: quoting and dispatch planning open
            </div>
            <h1 className="mt-7 max-w-4xl break-words text-3xl font-black leading-tight tracking-normal sm:text-5xl lg:text-6xl">
              Factory-direct concrete products for serious construction across Western Uganda.
            </h1>
            <p className="drop-cap mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              Order hollow blocks, solid blocks, pavers, kerbstones, drainage channels, culverts, and future ready-mix concrete
              from a disciplined Mbarara production platform built around UGX pricing, batch traceability, and direct site delivery.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#products"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-amber-400 px-5 py-3 text-center text-sm font-extrabold text-slate-950 hover:bg-amber-300"
              >
                View products and prices
                <ArrowRight size={18} />
              </a>
              <a
                href={`${contactLinks.whatsappUganda}?text=${encodeURIComponent("Hello, I want to inquire about concrete products from Mbarara Integrated Concrete Products Factory.")}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-white/20 px-5 py-3 text-center text-sm font-bold text-white hover:bg-white/10"
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
          <div className="relative min-h-[320px] min-w-0 sm:min-h-[420px]">
            <FallbackImage
              src="/assets/images/mbarara-factory-yard.png"
              fallbackSrc="/assets/images/factory-hero.jpg"
              alt="Concrete products yard with truck and block stacks"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-transparent" />
          </div>
        </div>
      </section>

      <LogisticsCapability basketWeightKg={basketWeight} />

      <section id="products" className="grid max-w-full gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
        <div className="min-w-0 space-y-5">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-600">Product catalogue</p>
                <h2 className="break-words text-2xl font-extrabold text-slate-950 sm:text-3xl">Products, prices, filters, and quotation basket</h2>
              </div>
              <div className="inline-flex items-center gap-2 rounded-md bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700">
                <Filter size={17} />
                {filteredProducts.length} products shown
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <label className="grid gap-2 text-sm font-semibold text-slate-700 lg:col-span-2">
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

      <section className="grid max-w-full gap-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-600">Checkout safeguard</p>
          <h2 className="mt-1 break-words text-2xl font-extrabold text-slate-950 sm:text-3xl">Choose payment route</h2>
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
        <div className={`min-w-0 rounded-lg border p-5 ${creditBlocked ? "border-amber-500 bg-amber-50" : "border-slate-200 bg-slate-50"}`}>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["Approved Credit Limit", approvedCreditLimit],
              ["Current Outstanding Balance", outstandingBalance],
              ["Remaining Available Credit", remainingCredit],
            ].map(([label, value]) => (
              <div key={label} className="rounded-md bg-white p-4 shadow-sm">
                <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
                <p className={`mt-2 break-words text-lg font-extrabold ${label === "Current Outstanding Balance" ? "text-red-600" : "text-slate-950"}`}>
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
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
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

      <section id="funding-pack" className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)]">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-600">Investor funding pack</p>
            <h2 className="mt-1 break-words text-2xl font-extrabold text-slate-950 sm:text-3xl">
              Download the complete Phase 1 funding materials
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              The package uses the agreed lean-launch model: UGX 130,000,000 starter budget, UGX 128,000,000 essential
              Phase 1 startup cost, UGX 2,000,000 protected cash buffer, and a UGX 20,000,000 monthly profit target.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                ["Funding ask", "UGX 130M"],
                ["Phase 1 cost", "UGX 128M"],
                ["Cash buffer", "UGX 2M"],
                ["Model net profit", `${formatUgx.format(financials.netProfitUgx)}/month`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
                  <p className="mt-1 text-xl font-extrabold text-slate-950">{value}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-semibold leading-6 text-slate-800">
              Data confidence: current public model uses updated cement and diesel assumptions, but market prices, supplier
              quotes, machinery costs, and competitor records must be re-verified before investment decisions.
            </p>
          </div>
          <div className="grid min-w-0 gap-3 sm:grid-cols-2">
            {fundingDownloads.map((download) => {
              const Icon = download.icon;
              return (
                <a
                  key={download.href}
                  href={publicAsset(download.href)}
                  download
                  className="group min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-4 transition hover:border-amber-400 hover:bg-amber-50"
                >
                  <div className="flex items-start gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-slate-950 text-amber-400">
                      <Icon size={20} />
                    </span>
                    <span className="min-w-0">
                      <span className="block break-words text-sm font-extrabold text-slate-950">{download.title}</span>
                      <span className="mt-1 block break-words text-xs leading-5 text-slate-600">{download.detail}</span>
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      <section id="founder" className="rounded-lg bg-white p-5 shadow-sm">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-center">
          <div className="rounded-lg bg-slate-100 p-4">
            <img
              src={publicAsset(companyProfile.managingDirectorAssetPath)}
              alt={`${companyProfile.directorName}, ${companyProfile.directorTitle}`}
              className="mx-auto w-full max-w-sm aspect-[9/16] object-contain object-top shadow-lg rounded-xl border border-slate-800 bg-slate-100"
            />
          </div>
          <div className="min-w-0">
            <p className="text-amber-500 tracking-widest text-xs font-bold uppercase">FOUNDER & MANAGING DIRECTOR</p>
            <h2 className="mb-2 mt-2 break-words text-3xl font-extrabold text-slate-900 dark:text-white">{companyProfile.directorName}</h2>
            <p className="text-sm font-bold text-slate-500">{companyProfile.directorTitle}</p>
            <blockquote className="mt-6 rounded-lg border-l-4 border-amber-400 bg-slate-950 p-6 text-lg font-semibold leading-8 text-white shadow-lg">
              "Our commitment is to build a factory known for structural durability, disciplined curing, laboratory crushing tests,
              and reliable industrial supply across Mbarara, Western Uganda, and the wider East African growth corridor."
            </blockquote>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={contactLinks.email} className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-3 text-center text-sm font-bold text-white">
                <Mail size={18} />
                {companyProfile.email}
              </a>
              <a
                href={contactLinks.whatsappUganda}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-amber-400 px-4 py-3 text-center text-sm font-extrabold text-slate-950"
              >
                <Phone size={18} />
                WhatsApp Uganda
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="inquiry" className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-600">Send inquiry</p>
            <h2 className="mt-1 break-words text-2xl font-extrabold text-slate-950 sm:text-3xl">Ask for price confirmation, delivery, or project supply</h2>
            <div className="mt-5 space-y-3 text-sm font-semibold text-slate-700">
              <p className="flex items-center gap-2 break-words">
                <MapPin size={18} className="shrink-0 text-amber-500" />
                {companyProfile.primaryLocation}
              </p>
              <p className="flex items-center gap-2 break-words">
                <Mail size={18} className="shrink-0 text-amber-500" />
                {companyProfile.email}
              </p>
              <p className="flex items-center gap-2 break-words">
                <MessageCircle size={18} className="shrink-0 text-amber-500" />
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
              <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-5 py-3 text-center text-sm font-extrabold text-white">
                <PackageCheck size={18} />
                Submit inquiry
              </button>
              <a
                href={`${contactLinks.whatsappGermany}?text=${encodeURIComponent("Hello, I want to inquire about Mbarara concrete products.")}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-amber-400 px-5 py-3 text-center text-sm font-extrabold text-slate-950"
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
          <div className="min-w-0">
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
