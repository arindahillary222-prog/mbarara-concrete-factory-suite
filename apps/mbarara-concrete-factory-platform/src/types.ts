export type ConfidenceLevel = "Verified" | "Estimated" | "Quotation Required" | "Needs verification";
export type VerificationStatus = "Verified" | "Pending" | "Needs field check";
export type ThreatLevel = "low" | "medium" | "high";
export type BusinessType =
  | "small block yard"
  | "paver maker"
  | "precast supplier"
  | "quarry supplier"
  | "ready-mix supplier"
  | "cement distributor";

export interface SourceMeta {
  sourceType: "website" | "Facebook" | "phone call" | "field visit" | "quotation" | "marketplace" | "government record";
  sourceUrlOrContact: string;
  dateChecked: string;
  confidenceLevel: ConfidenceLevel;
  verificationStatus: VerificationStatus;
}

export interface Product {
  id: string;
  name: string;
  category: "blocks" | "pavers" | "precast" | "ready-mix";
  unit: "piece" | "linear metre" | "m3";
  plannedPriceUgx: number;
  targetDailyVolume: number;
  mixRatio: string;
  confidenceLevel: ConfidenceLevel;
  assumptionLabel: string;
}

export interface Supplier {
  id: string;
  name: string;
  category: "cement" | "aggregate" | "sand" | "diesel" | "water" | "spares" | "logistics";
  district: string;
  phone: string;
  openingBalanceUgx: number;
  confidenceLevel: ConfidenceLevel;
}

export interface Customer {
  id: string;
  name: string;
  customerType:
    | "contractors"
    | "hardware stores"
    | "property developers"
    | "schools"
    | "hospitals"
    | "churches"
    | "NGOs"
    | "government projects"
    | "fuel stations"
    | "hotels"
    | "residential builders";
  location: string;
  likelyProductsNeeded: string[];
  estimatedMonthlyDemand: number;
  buyingPower: "low" | "medium" | "high";
  paymentReliability: "low" | "medium" | "high";
  decisionMakerContact: string;
  notes: string;
  confidenceLevel: ConfidenceLevel;
}

export interface ProductionBatch {
  id: string;
  batchId: string;
  date: string;
  productId: string;
  operator: string;
  quantityProduced: number;
  rejectedProducts: number;
  cementBagsUsed: number;
  stoneDustTonnesUsed: number;
  sandTonnesUsed: number;
  aggregateTonnesUsed: number;
  waterM3Used: number;
  machineHours: number;
  mixRatio: string;
  curingStartDate: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  unit: "bags" | "tonnes" | "litres" | "m3" | "units";
  supplierId: string;
  openingQty: number;
  unitCostUgx: number;
  reorderLevel: number;
  dailyConsumption: number;
}

export interface InventoryTransaction {
  id: string;
  date: string;
  itemId: string;
  type: "add" | "issue";
  quantity: number;
  supplierId?: string;
  batchId?: string;
  deliveryTruckNumber?: string;
  costUgx?: number;
  notes: string;
}

export interface Sale {
  id: string;
  date: string;
  customerId: string;
  productId: string;
  quantity: number;
  unitPriceUgx: number;
  deliveryCostUgx: number;
  paidAmountUgx: number;
}

export interface Expense {
  id: string;
  date: string;
  category: "Payroll" | "Utilities" | "Maintenance" | "Security" | "Rent" | "Office" | "Transport" | "Other";
  description: string;
  supplierId?: string;
  amountUgx: number;
  paidAmountUgx: number;
}

export interface QualityTest {
  id: string;
  batchId: string;
  date: string;
  productId: string;
  compressiveStrengthMpa: number;
  waterAbsorptionPct: number;
  densityKgM3: number;
  dimensionStatus: "Pass" | "Fail";
  visualDefects: number;
  approvalStatus: "Passed" | "Failed" | "Hold";
  notes: string;
}

export interface Competitor {
  competitorId: string;
  competitorName: string;
  location: string;
  district: string;
  region: string;
  gpsCoordinates: string;
  businessType: BusinessType;
  productsOffered: string[];
  estimatedProductPrices: Record<string, number | "Quotation required" | "Needs verification">;
  estimatedProductionCapacity: string;
  machineType: string;
  deliveryRadiusKm: number | "Needs verification";
  phoneContact: string;
  websiteSocialLink: string;
  strengths: string;
  weaknesses: string;
  threatLevel: ThreatLevel;
  notes: string;
  lastUpdatedDate: string;
  sourceUrl: string;
  sourceMeta: SourceMeta;
}

export interface MarketPrice {
  id: string;
  productName: string;
  supplierName: string;
  location: string;
  unit: string;
  priceUgx: number;
  deliveryIncluded: boolean;
  dateChecked: string;
  sourceUrl: string;
  confidenceLevel: "verified" | "estimated" | "quotation_required";
  sourceMeta: SourceMeta;
}

export interface MarketGapScore {
  productName: string;
  demandScore: number;
  competitionScore: number;
  marginScore: number;
  logisticsDifficulty: number;
  strategicValue: number;
}

export interface FinancialAssumptions {
  starterBudgetUgx: number;
  phaseOneStartupCostUgx: number;
  cementBagPriceUgx: number;
  stoneDustTonnePriceUgx: number;
  sandTonnePriceUgx: number;
  aggregateTonnePriceUgx: number;
  electricityCostPerKwhUgx: number;
  waterCostPerM3Ugx: number;
  dieselPricePerLitreUgx: number;
  labourCostPerMonthUgx: number;
  transportCostPerTruckUgx: number;
  workingDaysPerMonth: number;
  targetMonthlyProfitUgx: number;
}

export interface RiskItem {
  id: string;
  risk: string;
  category: "Market" | "Operations" | "Financial" | "Regulatory" | "Quality" | "Supply";
  likelihood: "Low" | "Medium" | "High";
  impact: "Low" | "Medium" | "High";
  mitigation: string;
}

export interface AppState {
  products: Product[];
  suppliers: Supplier[];
  customers: Customer[];
  productionBatches: ProductionBatch[];
  inventoryItems: InventoryItem[];
  inventoryTransactions: InventoryTransaction[];
  sales: Sale[];
  expenses: Expense[];
  qualityTests: QualityTest[];
  competitors: Competitor[];
  marketPrices: MarketPrice[];
  marketGapScores: MarketGapScore[];
  financialAssumptions: FinancialAssumptions;
  risks: RiskItem[];
}
