import React, { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Banknote,
  Boxes,
  Building2,
  ClipboardCheck,
  Factory,
  FileBarChart,
  PackageCheck,
  Receipt,
  RotateCcw,
  Save,
  ShoppingCart,
  Truck,
  Users,
} from "lucide-react";

const STORAGE_KEY = "mbarara-concrete-factory-simple-erp-v1";
const TODAY = "2026-06-06";

const products = [
  { name: "6-inch hollow blocks", unit: "unit", price: 2600 },
  { name: "8-inch hollow blocks", unit: "unit", price: 3400 },
  { name: "solid blocks", unit: "unit", price: 3800 },
  { name: "60 mm pavers", unit: "m²", price: 43000 },
  { name: "80 mm pavers", unit: "m²", price: 58000 },
  { name: "kerbstones", unit: "unit", price: 23500 },
  { name: "drainage channels", unit: "unit", price: 115000 },
  { name: "culverts", unit: "unit", price: 420000 },
];

const inventoryItems = [
  { id: "cement", name: "Cement bags", unit: "bags", openingQty: 2500, unitCost: 38000, reorderLevel: 850 },
  { id: "stoneDust", name: "Stone dust", unit: "tonnes", openingQty: 460, unitCost: 72000, reorderLevel: 140 },
  { id: "sand", name: "Sand", unit: "tonnes", openingQty: 390, unitCost: 85000, reorderLevel: 120 },
  { id: "aggregates", name: "Aggregates", unit: "tonnes", openingQty: 520, unitCost: 98000, reorderLevel: 160 },
  { id: "diesel", name: "Diesel", unit: "litres", openingQty: 3400, unitCost: 5450, reorderLevel: 1200 },
  { id: "water", name: "Water", unit: "m³", openingQty: 1800, unitCost: 4200, reorderLevel: 650 },
  { id: "pallets", name: "Pallets", unit: "pallets", openingQty: 1250, unitCost: 42000, reorderLevel: 350 },
  { id: "moulds", name: "Moulds", unit: "sets", openingQty: 34, unitCost: 3200000, reorderLevel: 8 },
  { id: "spares", name: "Spare parts", unit: "items", openingQty: 210, unitCost: 185000, reorderLevel: 75 },
];

const seedCustomers = [
  { id: "cust-1", name: "Mbarara Heights Estate", phone: "+256 700 111 220", contact: "Estates procurement", openingBalance: 4_800_000 },
  { id: "cust-2", name: "Western Roads JV", phone: "+256 701 444 330", contact: "Site engineer", openingBalance: 12_500_000 },
  { id: "cust-3", name: "Nyamitanga Hardware", phone: "+256 702 555 110", contact: "Dealer desk", openingBalance: 1_400_000 },
  { id: "cust-4", name: "Lake View Schools", phone: "+256 703 222 910", contact: "Bursar", openingBalance: 0 },
];

const seedSuppliers = [
  { id: "sup-1", name: "Hima Cement Distributor", category: "cement", phone: "+256 760 100 200", openingBalance: 9_500_000 },
  { id: "sup-2", name: "Nyakayojo Quarry", category: "aggregates", phone: "+256 761 330 440", openingBalance: 3_200_000 },
  { id: "sup-3", name: "Mbarara Sand Supplies", category: "sand", phone: "+256 762 550 880", openingBalance: 1_900_000 },
  { id: "sup-4", name: "TotalEnergies Mbarara", category: "diesel", phone: "+256 763 777 520", openingBalance: 2_700_000 },
];

const seedSales = [
  sale("2026-06-01", "Mbarara Heights Estate", "6-inch hollow blocks", 8200, 2600, 480000, 15_000_000),
  sale("2026-06-01", "Nyamitanga Hardware", "60 mm pavers", 420, 43000, 350000, 13_000_000),
  sale("2026-06-02", "Western Roads JV", "kerbstones", 520, 23500, 620000, 6_000_000),
  sale("2026-06-03", "Lake View Schools", "8-inch hollow blocks", 2900, 3400, 420000, 10_280_000),
  sale("2026-06-04", "Western Roads JV", "drainage channels", 75, 115000, 780000, 4_000_000),
  sale("2026-06-05", "Mbarara Heights Estate", "80 mm pavers", 260, 58000, 420000, 9_500_000),
];

const seedDispatches = [
  dispatch("2026-06-01", "Mbarara Heights Estate", "6-inch hollow blocks", 8200, "UBG 212P", "R. Mugisha", "Kakiika estate site", "Delivered", 420_000, 420_000),
  dispatch("2026-06-01", "Nyamitanga Hardware", "60 mm pavers", 420, "UBH 884C", "D. Atwine", "Nyamitanga dealer yard", "Delivered", 310_000, 310_000),
  dispatch("2026-06-02", "Western Roads JV", "kerbstones", 520, "UBE 775M", "S. Byaruhanga", "Mbarara bypass works", "Delivered", 590_000, 400_000),
  dispatch("2026-06-03", "Lake View Schools", "8-inch hollow blocks", 2900, "UBK 441A", "P. Muhwezi", "Ruti campus", "Loaded", 380_000, 0),
  dispatch("2026-06-04", "Western Roads JV", "drainage channels", 75, "UBJ 932L", "R. Mugisha", "Nyamitanga drainage section", "Scheduled", 710_000, 0),
];

const seedPurchases = [
  purchase("2026-06-01", "cement", 900, 38000, "Hima Cement Distributor", "UBG 734K", 34_200_000, 24_000_000),
  purchase("2026-06-02", "sand", 120, 85000, "Mbarara Sand Supplies", "UAZ 903M", 10_200_000, 6_000_000),
  purchase("2026-06-02", "aggregates", 160, 98000, "Nyakayojo Quarry", "UBH 441P", 15_680_000, 10_000_000),
  purchase("2026-06-03", "diesel", 1800, 5450, "TotalEnergies Mbarara", "UBE 220L", 9_810_000, 6_500_000),
];

const seedProduction = [
  production("2026-06-01", "6-inch hollow blocks", 9300, { cement: 330, stoneDust: 44, sand: 35, aggregates: 18, diesel: 120, water: 78 }, 9.5, 260),
  production("2026-06-02", "60 mm pavers", 760, { cement: 220, stoneDust: 31, sand: 22, aggregates: 28, diesel: 95, water: 42 }, 8.2, 18),
  production("2026-06-03", "kerbstones", 610, { cement: 190, stoneDust: 24, sand: 16, aggregates: 40, diesel: 86, water: 31 }, 7.4, 12),
  production("2026-06-04", "drainage channels", 90, { cement: 205, stoneDust: 28, sand: 18, aggregates: 48, diesel: 110, water: 36 }, 8.8, 7),
  production("2026-06-05", "80 mm pavers", 520, { cement: 245, stoneDust: 35, sand: 23, aggregates: 31, diesel: 102, water: 45 }, 8.5, 16),
];

const seedQc = [
  qc("MBR-QC-2026-0001", "2026-06-01", "6-inch hollow blocks", "Passed", 6.2, "Pass"),
  qc("MBR-QC-2026-0002", "2026-06-02", "60 mm pavers", "Passed", 37.8, "Pass"),
  qc("MBR-QC-2026-0003", "2026-06-03", "kerbstones", "Passed", 27.4, "Pass"),
  qc("MBR-QC-2026-0004", "2026-06-04", "drainage channels", "Failed", 23.8, "Honeycombing and low strength"),
  qc("MBR-QC-2026-0005", "2026-06-05", "80 mm pavers", "Passed", 42.4, "Pass"),
];

const seedExpenses = [
  expense("2026-06-01", "Payroll", "Monthly production payroll", "Internal payroll", 24_000_000, 24_000_000),
  expense("2026-06-02", "Utilities", "Electricity and water deposit", "Utility providers", 5_300_000, 3_000_000),
  expense("2026-06-03", "Maintenance", "Vibropress service parts", "Mbarara Engineering Supplies", 4_800_000, 2_000_000),
  expense("2026-06-04", "Security", "Site security service", "Western Guard Services", 2_100_000, 2_100_000),
];

const modules = [
  ["Reports", FileBarChart],
  ["Sales", ShoppingCart],
  ["Dispatch", PackageCheck],
  ["Inventory", Boxes],
  ["Production", Factory],
  ["Quality Control", ClipboardCheck],
  ["Customers", Users],
  ["Suppliers", Truck],
  ["Expenses", Receipt],
];

const colors = ["#2f7d5b", "#3b6ea8", "#b7842f", "#a44a3f", "#5d7182", "#6f5ea8", "#4f8f96", "#7a6b45"];

function id(prefix) {
  return `${prefix}-${Math.random().toString(16).slice(2)}-${Date.now().toString(16)}`;
}

function sale(date, customerName, product, quantity, unitPrice, deliveryCost, paidAmount) {
  return { id: id("sale"), date, customerName, product, quantity, unitPrice, deliveryCost, paidAmount };
}

function dispatch(date, customerName, product, quantity, truckNumber, driverName, destination, status, deliveryCost, paidAmount) {
  return { id: id("dispatch"), date, customerName, product, quantity, truckNumber, driverName, destination, status, deliveryCost, paidAmount };
}

function purchase(date, itemId, quantity, unitCost, supplierName, truckNumber, totalCost, paidAmount) {
  return { id: id("purchase"), date, itemId, quantity, unitCost, supplierName, truckNumber, totalCost, paidAmount };
}

function production(date, productType, dailyProduction, materialConsumption, machineHours, rejectedProducts) {
  return { id: id("prod"), date, productType, dailyProduction, materialConsumption, machineHours, rejectedProducts };
}

function qc(batchId, date, productType, status, compressiveStrength, notes) {
  return { id: id("qc"), batchId, date, productType, status, compressiveStrength, notes };
}

function expense(date, category, description, supplierName, amount, paidAmount) {
  return { id: id("exp"), date, category, description, supplierName, amount, paidAmount };
}

function asNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatUGX(value, compact = false) {
  const safe = Number.isFinite(value) ? value : 0;
  if (compact && Math.abs(safe) >= 1_000_000_000) return `UGX ${(safe / 1_000_000_000).toFixed(2)} bn`;
  if (compact && Math.abs(safe) >= 1_000_000) return `UGX ${(safe / 1_000_000).toFixed(1)} m`;
  return `UGX ${safe.toLocaleString("en-UG", { maximumFractionDigits: 0 })}`;
}

function monthKey(date) {
  return String(date || "").slice(0, 7);
}

function groupSum(rows, keyFn, valueFn) {
  const map = new Map();
  rows.forEach((row) => {
    const key = keyFn(row);
    map.set(key, (map.get(key) || 0) + valueFn(row));
  });
  return [...map.entries()].map(([name, value]) => ({ name, value }));
}

function computeSalesRow(row) {
  const total = row.quantity * row.unitPrice + row.deliveryCost;
  const balance = total - row.paidAmount;
  return { ...row, total, balance };
}

function computeErp(state) {
  const sales = state.sales.map(computeSalesRow);
  const dispatches = (state.dispatches || []).map((row) => ({ ...row, balance: row.deliveryCost - row.paidAmount }));
  const purchases = state.purchases.map((row) => ({
    ...row,
    totalCost: row.totalCost || row.quantity * row.unitCost,
    balance: (row.totalCost || row.quantity * row.unitCost) - row.paidAmount,
  }));
  const expenses = state.expenses.map((row) => ({ ...row, balance: row.amount - row.paidAmount }));

  const productionUsage = inventoryItems.reduce((acc, item) => ({ ...acc, [item.id]: 0 }), {});
  state.production.forEach((row) => {
    Object.entries(row.materialConsumption || {}).forEach(([itemId, qty]) => {
      productionUsage[itemId] = (productionUsage[itemId] || 0) + asNumber(qty);
    });
  });

  const inventory = inventoryItems.map((item) => {
    const receipts = purchases.filter((purchaseRow) => purchaseRow.itemId === item.id);
    const receivedQty = receipts.reduce((sum, row) => sum + row.quantity, 0);
    const receiptValue = receipts.reduce((sum, row) => sum + row.totalCost, 0);
    const issuedQty = productionUsage[item.id] || 0;
    const availableQty = item.openingQty + receivedQty;
    const availableValue = item.openingQty * item.unitCost + receiptValue;
    const weightedCost = availableQty ? availableValue / availableQty : item.unitCost;
    const currentQty = Math.max(0, availableQty - issuedQty);
    const stockValue = currentQty * weightedCost;
    return { ...item, receivedQty, issuedQty, currentQty, weightedCost, stockValue, lowStock: currentQty <= item.reorderLevel };
  });

  const materialCost = inventory.reduce((sum, item) => sum + item.issuedQty * item.weightedCost, 0);
  const revenue = sales.reduce((sum, row) => sum + row.total, 0);
  const paid = sales.reduce((sum, row) => sum + row.paidAmount, 0);
  const salesBalance = sales.reduce((sum, row) => sum + row.balance, 0);
  const dispatchCost = dispatches.reduce((sum, row) => sum + row.deliveryCost, 0);
  const dispatchPaid = dispatches.reduce((sum, row) => sum + row.paidAmount, 0);
  const dispatchBalance = dispatches.reduce((sum, row) => sum + row.balance, 0);
  const operatingExpenses = expenses.reduce((sum, row) => sum + row.amount, 0);
  const grossProfit = revenue - materialCost;
  const netProfit = grossProfit - operatingExpenses - dispatchCost;
  const rejected = state.production.reduce((sum, row) => sum + row.rejectedProducts, 0);
  const produced = state.production.reduce((sum, row) => sum + row.dailyProduction, 0);
  const machineHours = state.production.reduce((sum, row) => sum + row.machineHours, 0);
  const efficiency = machineHours ? (produced - rejected) / machineHours : 0;
  const rejectRate = produced ? rejected / produced : 0;

  const customerBalances = state.customers.map((customer) => {
    const balance = customer.openingBalance + sales.filter((row) => row.customerName === customer.name).reduce((sum, row) => sum + row.balance, 0);
    return { ...customer, balance };
  });

  const supplierBalances = state.suppliers.map((supplier) => {
    const purchaseBalance = purchases.filter((row) => row.supplierName === supplier.name).reduce((sum, row) => sum + row.balance, 0);
    const expenseBalance = expenses.filter((row) => row.supplierName === supplier.name).reduce((sum, row) => sum + row.balance, 0);
    return { ...supplier, balance: supplier.openingBalance + purchaseBalance + expenseBalance };
  });

  const dailySales = groupSum(sales, (row) => row.date, (row) => row.total).sort((a, b) => a.name.localeCompare(b.name));
  const monthlyProfit = groupSum(sales, (row) => monthKey(row.date), (row) => row.total).map((row) => {
    const monthlyMaterial = materialCostForMonth(state, purchases, monthKey(row.name));
    const monthlyExpenses = expenses.filter((expenseRow) => monthKey(expenseRow.date) === row.name).reduce((sum, expenseRow) => sum + expenseRow.amount, 0);
    const monthlyDispatch = dispatches.filter((dispatchRow) => monthKey(dispatchRow.date) === row.name).reduce((sum, dispatchRow) => sum + dispatchRow.deliveryCost, 0);
    return { name: row.name, revenue: row.value, profit: row.value - monthlyMaterial - monthlyExpenses - monthlyDispatch };
  });

  const inventoryUsage = inventory.map((item) => ({ name: item.name, value: item.issuedQty * item.weightedCost, quantity: item.issuedQty }));
  const productionEfficiency = state.production.map((row) => ({
    name: row.date,
    product: row.productType,
    output: row.dailyProduction,
    rejected: row.rejectedProducts,
    efficiency: row.machineHours ? (row.dailyProduction - row.rejectedProducts) / row.machineHours : 0,
  }));
  const dispatchStatus = groupSum(dispatches, (row) => row.status, () => 1);
  const pendingDispatches = dispatches.filter((row) => row.status !== "Delivered").length;
  const deliveredDispatches = dispatches.filter((row) => row.status === "Delivered").length;
  const deliveryRevenue = sales.reduce((sum, row) => sum + row.deliveryCost, 0);
  const deliveryRecovery = dispatchCost ? deliveryRevenue / dispatchCost : 0;

  return {
    sales,
    dispatches,
    purchases,
    expenses,
    inventory,
    revenue,
    paid,
    salesBalance,
    materialCost,
    operatingExpenses,
    dispatchCost,
    dispatchPaid,
    dispatchBalance,
    grossProfit,
    netProfit,
    produced,
    rejected,
    efficiency,
    rejectRate,
    customerBalances,
    supplierBalances,
    dailySales,
    monthlyProfit,
    inventoryUsage,
    productionEfficiency,
    dispatchStatus,
    pendingDispatches,
    deliveredDispatches,
    deliveryRevenue,
    deliveryRecovery,
  };
}

function materialCostForMonth(state, purchases, month) {
  const monthlyUsage = inventoryItems.reduce((acc, item) => ({ ...acc, [item.id]: 0 }), {});
  state.production
    .filter((row) => monthKey(row.date) === month)
    .forEach((row) => {
      Object.entries(row.materialConsumption || {}).forEach(([itemId, qty]) => {
        monthlyUsage[itemId] = (monthlyUsage[itemId] || 0) + asNumber(qty);
      });
    });
  return inventoryItems.reduce((sum, item) => {
    const receipts = purchases.filter((purchaseRow) => purchaseRow.itemId === item.id);
    const receivedQty = receipts.reduce((qty, row) => qty + row.quantity, 0);
    const receiptValue = receipts.reduce((value, row) => value + row.totalCost, 0);
    const cost = item.openingQty + receivedQty ? (item.openingQty * item.unitCost + receiptValue) / (item.openingQty + receivedQty) : item.unitCost;
    return sum + (monthlyUsage[item.id] || 0) * cost;
  }, 0);
}

function App() {
  const [activeModule, setActiveModule] = useState("Reports");
  const [state, setState] = useState({
    customers: seedCustomers,
    suppliers: seedSuppliers,
    sales: seedSales,
    dispatches: seedDispatches,
    purchases: seedPurchases,
    production: seedProduction,
    qc: seedQc,
    expenses: seedExpenses,
  });

  const [salesForm, setSalesForm] = useState({
    date: TODAY,
    customerName: seedCustomers[0].name,
    product: products[0].name,
    quantity: "",
    unitPrice: products[0].price,
    deliveryCost: "",
    paidAmount: "",
  });
  const [purchaseForm, setPurchaseForm] = useState({
    date: TODAY,
    itemId: inventoryItems[0].id,
    quantity: "",
    unitCost: inventoryItems[0].unitCost,
    supplierName: seedSuppliers[0].name,
    truckNumber: "",
    paidAmount: "",
  });
  const [dispatchForm, setDispatchForm] = useState({
    date: TODAY,
    customerName: seedCustomers[0].name,
    product: products[0].name,
    quantity: "",
    truckNumber: "",
    driverName: "",
    destination: "",
    status: "Scheduled",
    deliveryCost: "",
    paidAmount: "",
  });
  const [productionForm, setProductionForm] = useState({
    date: TODAY,
    productType: products[0].name,
    dailyProduction: "",
    cement: "",
    stoneDust: "",
    sand: "",
    aggregates: "",
    diesel: "",
    water: "",
    machineHours: "",
    rejectedProducts: "",
  });
  const [qcForm, setQcForm] = useState({
    batchId: "ERP-QC-2026-0006",
    date: TODAY,
    productType: products[0].name,
    status: "Passed",
    compressiveStrength: "",
    notes: "",
  });
  const [customerForm, setCustomerForm] = useState({ name: "", phone: "", contact: "", openingBalance: "" });
  const [supplierForm, setSupplierForm] = useState({ name: "", category: "", phone: "", openingBalance: "" });
  const [expenseForm, setExpenseForm] = useState({
    date: TODAY,
    category: "Maintenance",
    description: "",
    supplierName: seedSuppliers[0].name,
    amount: "",
    paidAmount: "",
  });

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      setState({ ...state, ...parsed.state });
      setActiveModule(parsed.activeModule || "Reports");
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ state, activeModule }));
  }, [state, activeModule]);

  const erp = useMemo(() => computeErp(state), [state]);

  function resetErp() {
    const base = {
      customers: seedCustomers,
      suppliers: seedSuppliers,
      sales: seedSales,
      dispatches: seedDispatches,
      purchases: seedPurchases,
      production: seedProduction,
      qc: seedQc,
      expenses: seedExpenses,
    };
    setState(base);
    setActiveModule("Reports");
    window.localStorage.removeItem(STORAGE_KEY);
  }

  function addSale(event) {
    event.preventDefault();
    const row = sale(
      salesForm.date,
      salesForm.customerName,
      salesForm.product,
      asNumber(salesForm.quantity),
      asNumber(salesForm.unitPrice),
      asNumber(salesForm.deliveryCost),
      asNumber(salesForm.paidAmount)
    );
    setState((current) => ({ ...current, sales: [row, ...current.sales] }));
    setSalesForm((current) => ({ ...current, quantity: "", deliveryCost: "", paidAmount: "" }));
  }

  function addDispatch(event) {
    event.preventDefault();
    const row = dispatch(
      dispatchForm.date,
      dispatchForm.customerName,
      dispatchForm.product,
      asNumber(dispatchForm.quantity),
      dispatchForm.truckNumber,
      dispatchForm.driverName,
      dispatchForm.destination,
      dispatchForm.status,
      asNumber(dispatchForm.deliveryCost),
      asNumber(dispatchForm.paidAmount)
    );
    setState((current) => ({ ...current, dispatches: [row, ...(current.dispatches || [])] }));
    setDispatchForm((current) => ({ ...current, quantity: "", truckNumber: "", driverName: "", destination: "", deliveryCost: "", paidAmount: "" }));
  }

  function addPurchase(event) {
    event.preventDefault();
    const totalCost = asNumber(purchaseForm.quantity) * asNumber(purchaseForm.unitCost);
    const row = purchase(
      purchaseForm.date,
      purchaseForm.itemId,
      asNumber(purchaseForm.quantity),
      asNumber(purchaseForm.unitCost),
      purchaseForm.supplierName,
      purchaseForm.truckNumber,
      totalCost,
      asNumber(purchaseForm.paidAmount)
    );
    setState((current) => ({ ...current, purchases: [row, ...current.purchases] }));
    setPurchaseForm((current) => ({ ...current, quantity: "", truckNumber: "", paidAmount: "" }));
  }

  function addProduction(event) {
    event.preventDefault();
    const row = production(
      productionForm.date,
      productionForm.productType,
      asNumber(productionForm.dailyProduction),
      {
        cement: asNumber(productionForm.cement),
        stoneDust: asNumber(productionForm.stoneDust),
        sand: asNumber(productionForm.sand),
        aggregates: asNumber(productionForm.aggregates),
        diesel: asNumber(productionForm.diesel),
        water: asNumber(productionForm.water),
      },
      asNumber(productionForm.machineHours),
      asNumber(productionForm.rejectedProducts)
    );
    setState((current) => ({ ...current, production: [row, ...current.production] }));
    setProductionForm((current) => ({ ...current, dailyProduction: "", cement: "", stoneDust: "", sand: "", aggregates: "", diesel: "", water: "", machineHours: "", rejectedProducts: "" }));
  }

  function addQc(event) {
    event.preventDefault();
    const row = qc(qcForm.batchId, qcForm.date, qcForm.productType, qcForm.status, asNumber(qcForm.compressiveStrength), qcForm.notes);
    setState((current) => ({ ...current, qc: [row, ...current.qc] }));
    setQcForm((current) => ({ ...current, batchId: nextCode(current.batchId), compressiveStrength: "", notes: "" }));
  }

  function addCustomer(event) {
    event.preventDefault();
    if (!customerForm.name.trim()) return;
    setState((current) => ({
      ...current,
      customers: [{ id: id("cust"), ...customerForm, openingBalance: asNumber(customerForm.openingBalance) }, ...current.customers],
    }));
    setCustomerForm({ name: "", phone: "", contact: "", openingBalance: "" });
  }

  function addSupplier(event) {
    event.preventDefault();
    if (!supplierForm.name.trim()) return;
    setState((current) => ({
      ...current,
      suppliers: [{ id: id("sup"), ...supplierForm, openingBalance: asNumber(supplierForm.openingBalance) }, ...current.suppliers],
    }));
    setSupplierForm({ name: "", category: "", phone: "", openingBalance: "" });
  }

  function addExpense(event) {
    event.preventDefault();
    const row = expense(
      expenseForm.date,
      expenseForm.category,
      expenseForm.description,
      expenseForm.supplierName,
      asNumber(expenseForm.amount),
      asNumber(expenseForm.paidAmount)
    );
    setState((current) => ({ ...current, expenses: [row, ...current.expenses] }));
    setExpenseForm((current) => ({ ...current, description: "", amount: "", paidAmount: "" }));
  }

  function renderModule() {
    if (activeModule === "Sales") return <SalesModule form={salesForm} setForm={setSalesForm} customers={state.customers} onSubmit={addSale} rows={erp.sales} />;
    if (activeModule === "Dispatch") return <DispatchModule form={dispatchForm} setForm={setDispatchForm} customers={state.customers} onSubmit={addDispatch} rows={erp.dispatches} erp={erp} />;
    if (activeModule === "Inventory") return <InventoryModule form={purchaseForm} setForm={setPurchaseForm} suppliers={state.suppliers} onSubmit={addPurchase} inventory={erp.inventory} purchases={erp.purchases} />;
    if (activeModule === "Production") return <ProductionModule form={productionForm} setForm={setProductionForm} onSubmit={addProduction} rows={state.production} erp={erp} />;
    if (activeModule === "Quality Control") return <QcModule form={qcForm} setForm={setQcForm} onSubmit={addQc} rows={state.qc} />;
    if (activeModule === "Customers") return <CustomersModule form={customerForm} setForm={setCustomerForm} onSubmit={addCustomer} rows={erp.customerBalances} />;
    if (activeModule === "Suppliers") return <SuppliersModule form={supplierForm} setForm={setSupplierForm} onSubmit={addSupplier} rows={erp.supplierBalances} />;
    if (activeModule === "Expenses") return <ExpensesModule form={expenseForm} setForm={setExpenseForm} suppliers={state.suppliers} onSubmit={addExpense} rows={erp.expenses} />;
    return <ReportsModule erp={erp} qc={state.qc} />;
  }

  return (
    <div className="min-h-screen bg-[#eef2f4] text-ink">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1560px] flex-col gap-4 px-5 py-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-factory-navy text-white">
              <Building2 size={23} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-factory-green">Mbarara, Uganda</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-normal text-factory-navy">Concrete Products Factory ERP</h1>
            </div>
          </div>
          <button
            type="button"
            onClick={resetErp}
            className="inline-flex w-fit items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <RotateCcw size={17} />
            Reset demo data
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1560px] gap-5 px-5 py-5 xl:grid-cols-[250px_1fr]">
        <nav className="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
          <div className="grid gap-2">
            {modules.map(([name, Icon]) => (
              <button
                key={name}
                type="button"
                onClick={() => setActiveModule(name)}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-semibold ${
                  activeModule === name ? "bg-factory-navy text-white" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Icon size={17} />
                {name}
              </button>
            ))}
          </div>
        </nav>
        <section className="space-y-5">{renderModule()}</section>
      </main>
    </div>
  );
}

function ReportsModule({ erp, qc }) {
  const salesPaidData = erp.dailySales.map((row) => ({ name: row.name, sales: row.value }));
  const stockMix = erp.inventory.map((item) => ({ name: item.name, value: item.stockValue }));
  const qcPassed = qc.filter((row) => row.status === "Passed").length;
  const qcFailed = qc.filter((row) => row.status === "Failed").length;
  return (
    <>
      <div className="grid gap-3 lg:grid-cols-4">
        <MetricCard label="Sales revenue" value={formatUGX(erp.revenue, true)} tone="green" />
        <MetricCard label="Monthly profit" value={formatUGX(erp.netProfit, true)} tone={erp.netProfit >= 0 ? "navy" : "clay"} />
        <MetricCard label="Customer balances" value={formatUGX(erp.salesBalance, true)} tone="amber" />
        <MetricCard label="Production efficiency" value={`${erp.efficiency.toFixed(0)} units/hr`} tone="blue" />
      </div>
      <div className="grid gap-3 lg:grid-cols-4">
        <MetricCard label="Pending dispatches" value={String(erp.pendingDispatches)} tone={erp.pendingDispatches ? "amber" : "green"} />
        <MetricCard label="Delivered loads" value={String(erp.deliveredDispatches)} tone="green" />
        <MetricCard label="Delivery cost" value={formatUGX(erp.dispatchCost, true)} tone="navy" />
        <MetricCard label="Delivery recovery" value={`${(erp.deliveryRecovery * 100).toFixed(1)}%`} tone={erp.deliveryRecovery >= 1 ? "green" : "clay"} />
      </div>
      <section className="grid gap-5 2xl:grid-cols-2">
        <ChartPanel title="Daily Sales">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesPaidData} margin={{ top: 12, right: 16, left: 0, bottom: 14 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d8dee4" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(value) => `${Math.round(value / 1_000_000)}m`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => formatUGX(value, true)} />
              <Bar dataKey="sales" fill="#2f7d5b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
        <ChartPanel title="Monthly Profit">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={erp.monthlyProfit} margin={{ top: 12, right: 16, left: 0, bottom: 14 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d8dee4" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(value) => `${Math.round(value / 1_000_000)}m`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => formatUGX(value, true)} />
              <Legend />
              <Bar dataKey="revenue" name="Revenue" fill="#3b6ea8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="profit" name="Profit" fill="#2f7d5b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
        <ChartPanel title="Inventory Usage">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={erp.inventoryUsage} margin={{ top: 12, right: 16, left: 0, bottom: 58 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d8dee4" />
              <XAxis dataKey="name" angle={-28} textAnchor="end" interval={0} height={86} tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(value) => `${Math.round(value / 1_000_000)}m`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value, name) => (name === "quantity" ? value.toLocaleString("en-UG") : formatUGX(value, true))} />
              <Bar dataKey="value" name="Usage value" fill="#b7842f" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
        <ChartPanel title="Production Efficiency">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={erp.productionEfficiency} margin={{ top: 12, right: 18, left: 0, bottom: 14 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d8dee4" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="efficiency" name="Units per machine hour" stroke="#2f7d5b" strokeWidth={2} />
              <Line type="monotone" dataKey="rejected" name="Rejected products" stroke="#a44a3f" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartPanel>
        <ChartPanel title="Dispatch Status">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={erp.dispatchStatus} dataKey="value" nameKey="name" innerRadius={62} outerRadius={104} paddingAngle={2}>
                {erp.dispatchStatus.map((entry, index) => (
                  <Cell key={entry.name} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartPanel>
      </section>
      <section className="grid gap-5 2xl:grid-cols-3">
        <DataPanel title="Customer Balances">
          <SimpleTable
            headers={["Customer", "Balance"]}
            rows={erp.customerBalances.map((row) => [row.name, formatUGX(row.balance)])}
          />
        </DataPanel>
        <DataPanel title="Supplier Balances">
          <SimpleTable
            headers={["Supplier", "Balance"]}
            rows={erp.supplierBalances.map((row) => [row.name, formatUGX(row.balance)])}
          />
        </DataPanel>
        <ChartPanel title="Stock Value Mix">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={stockMix} dataKey="value" nameKey="name" innerRadius={58} outerRadius={96} paddingAngle={2}>
                {stockMix.map((entry, index) => (
                  <Cell key={entry.name} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatUGX(value, true)} />
            </PieChart>
          </ResponsiveContainer>
          <p className="mt-2 text-xs text-slate-500">QC context: {qcPassed} passed, {qcFailed} failed.</p>
        </ChartPanel>
        <DataPanel title="Dispatch Balances">
          <SimpleTable
            headers={["Customer", "Truck", "Status", "Balance"]}
            rows={erp.dispatches.map((row) => [row.customerName, row.truckNumber, row.status, formatUGX(row.balance)])}
          />
        </DataPanel>
      </section>
    </>
  );
}

function SalesModule({ form, setForm, customers, onSubmit, rows }) {
  return (
    <ModuleShell title="Sales" icon={<ShoppingCart size={19} />}>
      <FormPanel title="New sale" onSubmit={onSubmit}>
        <Field label="Date" type="date" value={form.date} onChange={(value) => setForm({ ...form, date: value })} />
        <Select label="Customer name" value={form.customerName} values={customers.map((row) => row.name)} onChange={(value) => setForm({ ...form, customerName: value })} />
        <Select
          label="Product"
          value={form.product}
          values={products.map((row) => row.name)}
          onChange={(value) => {
            const selected = products.find((product) => product.name === value);
            setForm({ ...form, product: value, unitPrice: selected?.price || form.unitPrice });
          }}
        />
        <Field label="Quantity" value={form.quantity} onChange={(value) => setForm({ ...form, quantity: value })} />
        <Field label="Unit price" value={form.unitPrice} onChange={(value) => setForm({ ...form, unitPrice: value })} suffix="UGX" />
        <Field label="Delivery cost" value={form.deliveryCost} onChange={(value) => setForm({ ...form, deliveryCost: value })} suffix="UGX" />
        <Field label="Paid amount" value={form.paidAmount} onChange={(value) => setForm({ ...form, paidAmount: value })} suffix="UGX" />
      </FormPanel>
      <DataPanel title="Sales register">
        <SimpleTable
          headers={["Date", "Customer", "Product", "Qty", "Total", "Paid", "Balance"]}
          rows={rows.map((row) => [row.date, row.customerName, row.product, row.quantity.toLocaleString("en-UG"), formatUGX(row.total), formatUGX(row.paidAmount), formatUGX(row.balance)])}
        />
      </DataPanel>
    </ModuleShell>
  );
}

function DispatchModule({ form, setForm, customers, onSubmit, rows, erp }) {
  return (
    <ModuleShell title="Dispatch" icon={<PackageCheck size={19} />}>
      <FormPanel title="Delivery dispatch record" onSubmit={onSubmit}>
        <Field label="Date" type="date" value={form.date} onChange={(value) => setForm({ ...form, date: value })} />
        <Select label="Customer" value={form.customerName} values={customers.map((row) => row.name)} onChange={(value) => setForm({ ...form, customerName: value })} />
        <Select label="Product" value={form.product} values={products.map((row) => row.name)} onChange={(value) => setForm({ ...form, product: value })} />
        <Field label="Quantity dispatched" value={form.quantity} onChange={(value) => setForm({ ...form, quantity: value })} />
        <Field label="Truck number" value={form.truckNumber} onChange={(value) => setForm({ ...form, truckNumber: value })} type="text" />
        <Field label="Driver name" value={form.driverName} onChange={(value) => setForm({ ...form, driverName: value })} type="text" />
        <Field label="Destination" value={form.destination} onChange={(value) => setForm({ ...form, destination: value })} type="text" />
        <Select label="Status" value={form.status} values={["Scheduled", "Loaded", "Delivered", "Delayed"]} onChange={(value) => setForm({ ...form, status: value })} />
        <Field label="Delivery cost" value={form.deliveryCost} onChange={(value) => setForm({ ...form, deliveryCost: value })} suffix="UGX" />
        <Field label="Paid amount" value={form.paidAmount} onChange={(value) => setForm({ ...form, paidAmount: value })} suffix="UGX" />
      </FormPanel>
      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label="Pending dispatches" value={String(erp.pendingDispatches)} tone={erp.pendingDispatches ? "amber" : "green"} />
        <MetricCard label="Delivered loads" value={String(erp.deliveredDispatches)} tone="green" />
        <MetricCard label="Dispatch cost" value={formatUGX(erp.dispatchCost, true)} tone="navy" />
        <MetricCard label="Dispatch balance" value={formatUGX(erp.dispatchBalance, true)} tone={erp.dispatchBalance ? "clay" : "green"} />
      </div>
      <DataPanel title="Dispatch register">
        <SimpleTable
          headers={["Date", "Customer", "Product", "Qty", "Truck", "Driver", "Destination", "Status", "Cost", "Paid", "Balance"]}
          rows={rows.map((row) => [
            row.date,
            row.customerName,
            row.product,
            row.quantity.toLocaleString("en-UG"),
            row.truckNumber,
            row.driverName,
            row.destination,
            row.status,
            formatUGX(row.deliveryCost),
            formatUGX(row.paidAmount),
            formatUGX(row.balance),
          ])}
        />
      </DataPanel>
    </ModuleShell>
  );
}

function InventoryModule({ form, setForm, suppliers, onSubmit, inventory, purchases }) {
  return (
    <ModuleShell title="Inventory" icon={<Boxes size={19} />}>
      <FormPanel title="Add stock purchase" onSubmit={onSubmit}>
        <Field label="Date" type="date" value={form.date} onChange={(value) => setForm({ ...form, date: value })} />
        <Select
          label="Inventory item"
          value={form.itemId}
          values={inventoryItems.map((item) => item.id)}
          labels={Object.fromEntries(inventoryItems.map((item) => [item.id, `${item.name} (${item.unit})`]))}
          onChange={(value) => {
            const selected = inventoryItems.find((item) => item.id === value);
            setForm({ ...form, itemId: value, unitCost: selected?.unitCost || form.unitCost });
          }}
        />
        <Field label="Quantity" value={form.quantity} onChange={(value) => setForm({ ...form, quantity: value })} />
        <Field label="Unit cost" value={form.unitCost} onChange={(value) => setForm({ ...form, unitCost: value })} suffix="UGX" />
        <Select label="Supplier" value={form.supplierName} values={suppliers.map((row) => row.name)} onChange={(value) => setForm({ ...form, supplierName: value })} />
        <Field label="Truck number" value={form.truckNumber} onChange={(value) => setForm({ ...form, truckNumber: value })} type="text" />
        <Field label="Paid amount" value={form.paidAmount} onChange={(value) => setForm({ ...form, paidAmount: value })} suffix="UGX" />
      </FormPanel>
      <DataPanel title="Current stock">
        <SimpleTable
          headers={["Item", "Current stock", "Used", "Stock value", "Reorder", "Status"]}
          rows={inventory.map((row) => [
            row.name,
            `${row.currentQty.toLocaleString("en-UG", { maximumFractionDigits: 1 })} ${row.unit}`,
            `${row.issuedQty.toLocaleString("en-UG", { maximumFractionDigits: 1 })} ${row.unit}`,
            formatUGX(row.stockValue, true),
            `${row.reorderLevel} ${row.unit}`,
            row.lowStock ? "Low stock" : "OK",
          ])}
        />
      </DataPanel>
      <DataPanel title="Stock purchases">
        <SimpleTable
          headers={["Date", "Supplier", "Truck", "Item", "Qty", "Cost", "Balance"]}
          rows={purchases.map((row) => {
            const item = inventoryItems.find((entry) => entry.id === row.itemId);
            return [row.date, row.supplierName, row.truckNumber, item?.name || row.itemId, row.quantity, formatUGX(row.totalCost), formatUGX(row.balance)];
          })}
        />
      </DataPanel>
    </ModuleShell>
  );
}

function ProductionModule({ form, setForm, onSubmit, rows, erp }) {
  return (
    <ModuleShell title="Production" icon={<Factory size={19} />}>
      <FormPanel title="Daily production" onSubmit={onSubmit}>
        <Field label="Date" type="date" value={form.date} onChange={(value) => setForm({ ...form, date: value })} />
        <Select label="Product type" value={form.productType} values={products.map((row) => row.name)} onChange={(value) => setForm({ ...form, productType: value })} />
        <Field label="Daily production" value={form.dailyProduction} onChange={(value) => setForm({ ...form, dailyProduction: value })} />
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Cement bags" value={form.cement} onChange={(value) => setForm({ ...form, cement: value })} />
          <Field label="Stone dust tonnes" value={form.stoneDust} onChange={(value) => setForm({ ...form, stoneDust: value })} />
          <Field label="Sand tonnes" value={form.sand} onChange={(value) => setForm({ ...form, sand: value })} />
          <Field label="Aggregate tonnes" value={form.aggregates} onChange={(value) => setForm({ ...form, aggregates: value })} />
          <Field label="Diesel litres" value={form.diesel} onChange={(value) => setForm({ ...form, diesel: value })} />
          <Field label="Water m³" value={form.water} onChange={(value) => setForm({ ...form, water: value })} />
        </div>
        <Field label="Machine hours" value={form.machineHours} onChange={(value) => setForm({ ...form, machineHours: value })} />
        <Field label="Rejected products" value={form.rejectedProducts} onChange={(value) => setForm({ ...form, rejectedProducts: value })} />
      </FormPanel>
      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard label="Total produced" value={erp.produced.toLocaleString("en-UG")} tone="green" />
        <MetricCard label="Rejected products" value={erp.rejected.toLocaleString("en-UG")} tone="clay" />
        <MetricCard label="Reject rate" value={`${(erp.rejectRate * 100).toFixed(1)}%`} tone="amber" />
      </div>
      <DataPanel title="Production register">
        <SimpleTable
          headers={["Date", "Product", "Produced", "Machine hours", "Rejected", "Efficiency"]}
          rows={rows.map((row) => [
            row.date,
            row.productType,
            row.dailyProduction.toLocaleString("en-UG"),
            row.machineHours,
            row.rejectedProducts,
            row.machineHours ? `${((row.dailyProduction - row.rejectedProducts) / row.machineHours).toFixed(0)} units/hr` : "-",
          ])}
        />
      </DataPanel>
    </ModuleShell>
  );
}

function QcModule({ form, setForm, onSubmit, rows }) {
  return (
    <ModuleShell title="Quality Control" icon={<ClipboardCheck size={19} />}>
      <FormPanel title="QC result" onSubmit={onSubmit}>
        <Field label="Batch ID" value={form.batchId} onChange={(value) => setForm({ ...form, batchId: value })} type="text" />
        <Field label="Date" type="date" value={form.date} onChange={(value) => setForm({ ...form, date: value })} />
        <Select label="Product type" value={form.productType} values={products.map((row) => row.name)} onChange={(value) => setForm({ ...form, productType: value })} />
        <Select label="Status" value={form.status} values={["Passed", "Failed", "Hold"]} onChange={(value) => setForm({ ...form, status: value })} />
        <Field label="Compressive strength" value={form.compressiveStrength} onChange={(value) => setForm({ ...form, compressiveStrength: value })} suffix="MPa" />
        <Field label="Notes" value={form.notes} onChange={(value) => setForm({ ...form, notes: value })} type="text" />
      </FormPanel>
      <DataPanel title="QC register">
        <SimpleTable
          headers={["Batch", "Date", "Product", "Status", "Strength", "Notes"]}
          rows={rows.map((row) => [row.batchId, row.date, row.productType, row.status, `${row.compressiveStrength} MPa`, row.notes])}
        />
      </DataPanel>
    </ModuleShell>
  );
}

function CustomersModule({ form, setForm, onSubmit, rows }) {
  return (
    <ModuleShell title="Customers" icon={<Users size={19} />}>
      <FormPanel title="Add customer" onSubmit={onSubmit}>
        <Field label="Customer name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} type="text" />
        <Field label="Phone" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} type="text" />
        <Field label="Contact person / desk" value={form.contact} onChange={(value) => setForm({ ...form, contact: value })} type="text" />
        <Field label="Opening balance" value={form.openingBalance} onChange={(value) => setForm({ ...form, openingBalance: value })} suffix="UGX" />
      </FormPanel>
      <DataPanel title="Customer balances">
        <SimpleTable headers={["Customer", "Contact", "Phone", "Balance"]} rows={rows.map((row) => [row.name, row.contact, row.phone, formatUGX(row.balance)])} />
      </DataPanel>
    </ModuleShell>
  );
}

function SuppliersModule({ form, setForm, onSubmit, rows }) {
  return (
    <ModuleShell title="Suppliers" icon={<Truck size={19} />}>
      <FormPanel title="Add supplier" onSubmit={onSubmit}>
        <Field label="Supplier name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} type="text" />
        <Field label="Category" value={form.category} onChange={(value) => setForm({ ...form, category: value })} type="text" />
        <Field label="Phone" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} type="text" />
        <Field label="Opening balance" value={form.openingBalance} onChange={(value) => setForm({ ...form, openingBalance: value })} suffix="UGX" />
      </FormPanel>
      <DataPanel title="Supplier balances">
        <SimpleTable headers={["Supplier", "Category", "Phone", "Balance"]} rows={rows.map((row) => [row.name, row.category, row.phone, formatUGX(row.balance)])} />
      </DataPanel>
    </ModuleShell>
  );
}

function ExpensesModule({ form, setForm, suppliers, onSubmit, rows }) {
  return (
    <ModuleShell title="Expenses" icon={<Receipt size={19} />}>
      <FormPanel title="Record expense" onSubmit={onSubmit}>
        <Field label="Date" type="date" value={form.date} onChange={(value) => setForm({ ...form, date: value })} />
        <Select label="Category" value={form.category} values={["Payroll", "Utilities", "Maintenance", "Security", "Rent", "Office", "Other"]} onChange={(value) => setForm({ ...form, category: value })} />
        <Field label="Description" value={form.description} onChange={(value) => setForm({ ...form, description: value })} type="text" />
        <Select label="Supplier / payee" value={form.supplierName} values={[...suppliers.map((row) => row.name), "Internal payroll", "Utility providers"]} onChange={(value) => setForm({ ...form, supplierName: value })} />
        <Field label="Amount" value={form.amount} onChange={(value) => setForm({ ...form, amount: value })} suffix="UGX" />
        <Field label="Paid amount" value={form.paidAmount} onChange={(value) => setForm({ ...form, paidAmount: value })} suffix="UGX" />
      </FormPanel>
      <DataPanel title="Expense register">
        <SimpleTable
          headers={["Date", "Category", "Description", "Payee", "Amount", "Paid", "Balance"]}
          rows={rows.map((row) => [row.date, row.category, row.description, row.supplierName, formatUGX(row.amount), formatUGX(row.paidAmount), formatUGX(row.balance)])}
        />
      </DataPanel>
    </ModuleShell>
  );
}

function ModuleShell({ title, icon, children }) {
  return (
    <>
      <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-factory-navy">
          {icon}
          {title}
        </h2>
        <p className="mt-1 text-sm text-slate-500">Currency: UGX only. Records are stored locally in this browser.</p>
      </section>
      {children}
    </>
  );
}

function FormPanel({ title, onSubmit, children }) {
  return (
    <form onSubmit={onSubmit} className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-factory-navy">{title}</h3>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{children}</div>
      <button
        type="submit"
        className="mt-4 inline-flex items-center gap-2 rounded-md bg-factory-navy px-3 py-2 text-sm font-semibold text-white hover:bg-[#102638]"
      >
        <Save size={17} />
        Save record
      </button>
    </form>
  );
}

function DataPanel({ title, children }) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-factory-navy">{title}</h3>
      {children}
    </section>
  );
}

function ChartPanel({ title, children }) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-2 text-sm font-semibold text-factory-navy">{title}</h3>
      {children}
    </section>
  );
}

function MetricCard({ label, value, tone }) {
  const tones = {
    navy: "bg-factory-navy text-white",
    green: "bg-factory-green text-white",
    amber: "bg-factory-amber text-white",
    clay: "bg-factory-clay text-white",
    blue: "bg-factory-blue text-white",
  };
  return (
    <section className={`${tones[tone]} rounded-md p-4 shadow-soft`}>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] opacity-80">{label}</p>
      <p className="mt-4 text-2xl font-semibold tracking-normal">{value}</p>
    </section>
  );
}

function Field({ label, value, onChange, type = "number", suffix }) {
  return (
    <label className="grid gap-1">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <div className="flex overflow-hidden rounded-md border border-slate-300 bg-white focus-within:border-factory-green focus-within:ring-2 focus-within:ring-factory-green/20">
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 border-0 px-3 py-2 text-sm outline-none"
        />
        {suffix ? <span className="flex items-center border-l border-slate-200 bg-slate-50 px-2 text-xs font-semibold text-slate-500">{suffix}</span> : null}
      </div>
    </label>
  );
}

function Select({ label, value, values, labels = {}, onChange }) {
  return (
    <label className="grid gap-1">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-factory-green focus:ring-2 focus:ring-factory-green/20"
      >
        {values.map((entry) => (
          <option key={entry} value={entry}>
            {labels[entry] || entry}
          </option>
        ))}
      </select>
    </label>
  );
}

function SimpleTable({ headers, rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
        <thead>
          <tr className="bg-factory-navy text-white">
            {headers.map((header) => (
              <th key={header} className="border-b border-white/10 px-3 py-3 text-xs font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.join("-")}-${index}`} className={index % 2 ? "bg-white" : "bg-slate-50/70"}>
              {row.map((cell, cellIndex) => (
                <td key={`${cell}-${cellIndex}`} className="border-b border-slate-200 px-3 py-3 align-middle text-sm">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function nextCode(code) {
  const match = /(\d+)$/.exec(code || "");
  if (!match) return `${code || "ERP-QC-2026-"}1`;
  return code.replace(/\d+$/, String(Number(match[1]) + 1).padStart(match[1].length, "0"));
}

export default App;
