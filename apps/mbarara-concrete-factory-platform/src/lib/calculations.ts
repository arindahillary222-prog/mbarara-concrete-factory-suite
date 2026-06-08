import type {
  AppState,
  Competitor,
  InventoryItem,
  MarketGapScore,
  Product,
  ProductionBatch,
  QualityTest,
  Sale,
} from "../types";

export const formatUGX = (value: number, compact = false) =>
  `UGX ${new Intl.NumberFormat("en-UG", {
    maximumFractionDigits: 0,
    notation: compact ? "compact" : "standard",
  }).format(Number.isFinite(value) ? value : 0)}`;

export const numberFormat = (value: number) =>
  new Intl.NumberFormat("en-UG", { maximumFractionDigits: 1 }).format(Number.isFinite(value) ? value : 0);

export function productById(products: Product[], id: string) {
  return products.find((product) => product.id === id);
}

export function customerName(state: AppState, id: string) {
  return state.customers.find((customer) => customer.id === id)?.name ?? id;
}

export function supplierName(state: AppState, id: string | undefined) {
  if (!id) return "Internal";
  return state.suppliers.find((supplier) => supplier.id === id)?.name ?? id;
}

export function productName(state: AppState, id: string) {
  return state.products.find((product) => product.id === id)?.name ?? id;
}

export function opportunityScore(score: MarketGapScore) {
  return score.demandScore + score.marginScore + score.strategicValue - (score.competitionScore + score.logisticsDifficulty);
}

function sumBy<T>(rows: T[], selector: (row: T) => number) {
  return rows.reduce((sum, row) => sum + selector(row), 0);
}

export function groupCount<T>(rows: T[], keySelector: (row: T) => string) {
  return rows.reduce<Record<string, number>>((acc, row) => {
    const key = keySelector(row);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

export function groupSum<T>(rows: T[], keySelector: (row: T) => string, valueSelector: (row: T) => number) {
  return rows.reduce<Record<string, number>>((acc, row) => {
    const key = keySelector(row);
    acc[key] = (acc[key] ?? 0) + valueSelector(row);
    return acc;
  }, {});
}

export function computeProductCost(state: AppState, product: Product) {
  const assumptions = state.financialAssumptions;
  const baseByCategory = {
    blocks: {
      cementBags: product.name.includes("8-inch") ? 0.045 : product.name.includes("solid") ? 0.05 : 0.032,
      stoneDustTonnes: product.name.includes("solid") ? 0.008 : 0.009,
      sandTonnes: product.name.includes("solid") ? 0.004 : 0,
      aggregateTonnes: 0,
      waterM3: 0.012,
      powerKwh: 0.04,
      dieselLitres: 0.01,
    },
    pavers: {
      cementBags: product.name.includes("80 mm") ? 0.04 : 0.032,
      stoneDustTonnes: 0,
      sandTonnes: 0.006,
      aggregateTonnes: 0.008,
      waterM3: 0.01,
      powerKwh: 0.05,
      dieselLitres: 0.012,
    },
    precast: {
      cementBags: product.name === "culverts" ? 1.65 : product.name === "drainage channels" ? 0.45 : 0.16,
      stoneDustTonnes: 0,
      sandTonnes: product.name === "culverts" ? 0.16 : product.name === "drainage channels" ? 0.05 : 0.02,
      aggregateTonnes: product.name === "culverts" ? 0.24 : product.name === "drainage channels" ? 0.08 : 0.035,
      waterM3: product.name === "culverts" ? 0.08 : product.name === "drainage channels" ? 0.035 : 0.015,
      powerKwh: product.name === "culverts" ? 1.8 : product.name === "drainage channels" ? 0.6 : 0.2,
      dieselLitres: product.name === "culverts" ? 0.45 : product.name === "drainage channels" ? 0.16 : 0.05,
    },
    "ready-mix": {
      cementBags: 7.2,
      stoneDustTonnes: 0,
      sandTonnes: 0.7,
      aggregateTonnes: 1.05,
      waterM3: 0.18,
      powerKwh: 4.2,
      dieselLitres: 2.4,
    },
  }[product.category];

  const materialCost =
    baseByCategory.cementBags * assumptions.cementBagPriceUgx +
    baseByCategory.stoneDustTonnes * assumptions.stoneDustTonnePriceUgx +
    baseByCategory.sandTonnes * assumptions.sandTonnePriceUgx +
    baseByCategory.aggregateTonnes * assumptions.aggregateTonnePriceUgx;
  const utilityCost =
    baseByCategory.waterM3 * assumptions.waterCostPerM3Ugx +
    baseByCategory.powerKwh * assumptions.electricityCostPerKwhUgx +
    baseByCategory.dieselLitres * assumptions.dieselPricePerLitreUgx;
  const labourPerUnit = assumptions.labourCostPerMonthUgx / Math.max(1, state.products.reduce((sum, row) => sum + row.targetDailyVolume, 0) * assumptions.workingDaysPerMonth);
  const unitCostUgx = materialCost + utilityCost + labourPerUnit;
  const marginUgx = product.plannedPriceUgx - unitCostUgx;
  const marginPct = product.plannedPriceUgx ? marginUgx / product.plannedPriceUgx : 0;

  return {
    productName: product.name,
    unitCostUgx,
    materialCost,
    utilityCost,
    labourPerUnit,
    plannedPriceUgx: product.plannedPriceUgx,
    marginUgx,
    marginPct,
  };
}

export function computeInventory(state: AppState) {
  return state.inventoryItems.map((item) => {
    const transactions = state.inventoryTransactions.filter((transaction) => transaction.itemId === item.id);
    const added = sumBy(transactions.filter((transaction) => transaction.type === "add"), (transaction) => transaction.quantity);
    const issued = sumBy(transactions.filter((transaction) => transaction.type === "issue"), (transaction) => transaction.quantity);
    const currentQty = item.openingQty + added - issued;
    const stockValueUgx = currentQty * item.unitCostUgx;
    const daysRemaining = item.dailyConsumption > 0 ? currentQty / item.dailyConsumption : 999;

    return {
      ...item,
      added,
      issued,
      currentQty,
      stockValueUgx,
      daysRemaining,
      lowStock: currentQty <= item.reorderLevel,
    };
  });
}

export function computeProductionRows(state: AppState) {
  return state.productionBatches.map((batch) => {
    const product = productById(state.products, batch.productId);
    const test = state.qualityTests.find((row) => row.batchId === batch.batchId);
    const goodUnits = Math.max(0, batch.quantityProduced - batch.rejectedProducts);
    const efficiency = batch.machineHours ? goodUnits / batch.machineHours : 0;
    const rejectionRate = batch.quantityProduced ? batch.rejectedProducts / batch.quantityProduced : 0;

    return {
      ...batch,
      productName: product?.name ?? batch.productId,
      qcStatus: test?.approvalStatus ?? "Hold",
      compressiveStrengthMpa: test?.compressiveStrengthMpa ?? 0,
      efficiency,
      rejectionRate,
      goodUnits,
    };
  });
}

export function computeQuality(state: AppState) {
  const passed = state.qualityTests.filter((test) => test.approvalStatus === "Passed").length;
  const failed = state.qualityTests.filter((test) => test.approvalStatus === "Failed").length;
  const hold = state.qualityTests.filter((test) => test.approvalStatus === "Hold").length;
  const rejectionRate = state.qualityTests.length ? failed / state.qualityTests.length : 0;
  const strengthByProduct = Object.entries(
    groupSum(state.qualityTests, (test) => productName(state, test.productId), (test) => test.compressiveStrengthMpa),
  ).map(([name, total]) => {
    const count = state.qualityTests.filter((test) => productName(state, test.productId) === name).length;
    return { name, strength: count ? total / count : 0 };
  });
  const defectTrends = state.qualityTests.map((test) => ({
    name: test.batchId,
    defects: test.visualDefects,
    absorption: test.waterAbsorptionPct,
  }));

  return { passed, failed, hold, rejectionRate, strengthByProduct, defectTrends };
}

export function computeSales(state: AppState) {
  return state.sales.map((sale) => {
    const total = sale.quantity * sale.unitPriceUgx + sale.deliveryCostUgx;
    return {
      ...sale,
      customerName: customerName(state, sale.customerId),
      productName: productName(state, sale.productId),
      total,
      balance: total - sale.paidAmountUgx,
    };
  });
}

export function computeExpenseRows(state: AppState) {
  return state.expenses.map((expense) => ({
    ...expense,
    supplierName: supplierName(state, expense.supplierId),
    balance: expense.amountUgx - expense.paidAmountUgx,
  }));
}

export function computeFinancials(state: AppState) {
  const productCosts = state.products.map((product) => computeProductCost(state, product));
  const salesRows = computeSales(state);
  const revenueUgx = sumBy(salesRows, (sale) => sale.total);
  const deliveryRevenueUgx = sumBy(salesRows, (sale) => sale.deliveryCostUgx);
  const productCostMap = new Map(productCosts.map((row) => [row.productName, row.unitCostUgx]));
  const materialAndProductionCostUgx = sumBy(salesRows, (sale) => sale.quantity * (productCostMap.get(sale.productName) ?? 0));
  const expensesUgx = sumBy(state.expenses, (expense) => expense.amountUgx);
  const grossProfitUgx = revenueUgx - materialAndProductionCostUgx;
  const netProfitUgx = grossProfitUgx - expensesUgx;
  const breakEvenRevenueUgx = expensesUgx / Math.max(0.01, grossProfitUgx / Math.max(1, revenueUgx));
  const capexEstimateUgx = state.financialAssumptions.phaseOneStartupCostUgx || state.financialAssumptions.starterBudgetUgx;
  const starterBudgetUgx = state.financialAssumptions.starterBudgetUgx;
  const phaseOneStartupCostUgx = state.financialAssumptions.phaseOneStartupCostUgx;
  const budgetSurplusUgx = starterBudgetUgx - phaseOneStartupCostUgx;
  const roiEstimate = capexEstimateUgx ? (netProfitUgx * 12) / capexEstimateUgx : 0;
  const monthlyProfitProjection = Array.from({ length: 12 }, (_, index) => {
    const scale = 0.74 + index * 0.045;
    return {
      month: `M${index + 1}`,
      revenue: revenueUgx * scale,
      netProfit: netProfitUgx * scale,
      target: state.financialAssumptions.targetMonthlyProfitUgx,
    };
  });
  const productRevenue = Object.entries(groupSum(salesRows, (sale) => sale.productName, (sale) => sale.total)).map(([name, revenue]) => ({
    name,
    revenue,
  }));
  const productProfit = salesRows.map((sale) => ({
    name: sale.productName,
    profit: sale.quantity * (sale.unitPriceUgx - (productCostMap.get(sale.productName) ?? 0)),
  }));

  return {
    productCosts,
    salesRows,
    revenueUgx,
    deliveryRevenueUgx,
    materialAndProductionCostUgx,
    expensesUgx,
    grossProfitUgx,
    netProfitUgx,
    breakEvenRevenueUgx,
    capexEstimateUgx,
    starterBudgetUgx,
    phaseOneStartupCostUgx,
    budgetSurplusUgx,
    budgetFeasible: budgetSurplusUgx >= 0,
    roiEstimate,
    monthlyProfitProjection,
    productRevenue,
    productProfit,
    targetReached: netProfitUgx >= state.financialAssumptions.targetMonthlyProfitUgx,
  };
}

export function computeMarket(state: AppState) {
  const opportunityRanking = [...state.marketGapScores]
    .map((score) => ({ ...score, opportunityScore: opportunityScore(score) }))
    .sort((a, b) => b.opportunityScore - a.opportunityScore);
  const competitorCountByDistrict = Object.entries(groupCount(state.competitors, (row) => row.district)).map(([name, value]) => ({ name, value }));
  const threatDistribution = Object.entries(groupCount(state.competitors, (row) => row.threatLevel)).map(([name, value]) => ({ name, value }));
  const customerDistribution = Object.entries(groupCount(state.customers, (row) => row.customerType)).map(([name, value]) => ({ name, value }));
  const averageMarketPricePerProduct = Object.entries(groupSum(state.marketPrices, (row) => row.productName, (row) => row.priceUgx)).map(([name, total]) => {
    const count = state.marketPrices.filter((row) => row.productName === name).length;
    return { name, price: count ? total / count : 0 };
  });
  const priceComparison = state.products
    .map((product) => {
      const market = averageMarketPricePerProduct.find((row) => row.name === product.name);
      return {
        name: product.name,
        planned: product.plannedPriceUgx,
        competitor: market?.price ?? product.plannedPriceUgx,
      };
    })
    .filter((row) => row.competitor > 0);

  return {
    opportunityRanking,
    competitorCountByDistrict,
    threatDistribution,
    customerDistribution,
    averageMarketPricePerProduct,
    priceComparison,
  };
}

export function generateSwot(competitor: Competitor) {
  const response =
    competitor.threatLevel === "high"
      ? "Prioritize field verification, match critical products selectively, differentiate with curing records, delivery discipline, and test certificates."
      : competitor.threatLevel === "medium"
        ? "Monitor pricing monthly, build contractor relationships, and use reliable delivery as the main response."
        : "Track periodically while focusing sales effort on higher-threat areas.";

  return {
    strengths: competitor.strengths,
    weaknesses: competitor.weaknesses,
    opportunities: "Win customers needing documented quality, predictable volumes, and professional delivery terms.",
    threats: "Price undercutting, relationship-based selling, and unverified hidden capacity.",
    recommendedResponse: response,
  };
}

export function computeErp(state: AppState) {
  const inventory = computeInventory(state);
  const production = computeProductionRows(state);
  const quality = computeQuality(state);
  const financials = computeFinancials(state);
  const market = computeMarket(state);
  const expenses = computeExpenseRows(state);
  const stockValueUgx = sumBy(inventory, (item) => item.stockValueUgx);
  const totalProduced = sumBy(production, (batch) => batch.quantityProduced);
  const rejectedProducts = sumBy(production, (batch) => batch.rejectedProducts);
  const productionEfficiency = production.map((batch) => ({ name: batch.batchId, efficiency: batch.efficiency, rejected: batch.rejectedProducts }));
  const customerBalances = state.customers.map((customer) => ({
    name: customer.name,
    balance: financials.salesRows.filter((sale) => sale.customerId === customer.id).reduce((sum, sale) => sum + sale.balance, 0),
  }));
  const supplierBalances = state.suppliers.map((supplier) => ({
    name: supplier.name,
    balance: expenses.filter((expense) => expense.supplierId === supplier.id).reduce((sum, expense) => sum + expense.balance, 0),
  }));

  return {
    inventory,
    production,
    quality,
    financials,
    market,
    expenses,
    stockValueUgx,
    totalProduced,
    rejectedProducts,
    rejectRate: totalProduced ? rejectedProducts / totalProduced : 0,
    productionEfficiency,
    customerBalances,
    supplierBalances,
  };
}

export type InventoryComputed = ReturnType<typeof computeInventory>[number];
export type ProductionComputed = ReturnType<typeof computeProductionRows>[number];
export type SaleComputed = ReturnType<typeof computeSales>[number];
export type ErpComputed = ReturnType<typeof computeErp>;
