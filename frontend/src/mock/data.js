// Realistic mock data for Otarisk fraud investigation platform.
// All values are deterministic given a seed so tests/screenshots are stable.

const MERCHANTS = [
  "Amazon", "Walmart", "Target", "Best Buy", "Apple Store", "Steam Games",
  "Uber Eats", "DoorDash", "Netflix", "Spotify", "Airbnb", "Delta Air Lines",
  "Western Union", "MoneyGram", "Crypto.com", "Binance", "OnlyFans",
  "Shell Gas", "Whole Foods", "Costco", "eBay", "Etsy", "Shopify Merchant",
  "Bet365", "DraftKings", "Coinbase", "PayPal Transfer", "Wise Transfer",
  "Bloomingdale's", "Zara", "Nike", "Adidas", "Rolex Boutique",
];

const LOCATIONS = [
  { city: "New York", country: "USA", flag: "US" },
  { city: "London", country: "UK", flag: "GB" },
  { city: "Tokyo", country: "Japan", flag: "JP" },
  { city: "Singapore", country: "SG", flag: "SG" },
  { city: "Dubai", country: "UAE", flag: "AE" },
  { city: "Mumbai", country: "India", flag: "IN" },
  { city: "Lagos", country: "Nigeria", flag: "NG" },
  { city: "Moscow", country: "Russia", flag: "RU" },
  { city: "Caracas", country: "Venezuela", flag: "VE" },
  { city: "Sao Paulo", country: "Brazil", flag: "BR" },
  { city: "Berlin", country: "Germany", flag: "DE" },
  { city: "Paris", country: "France", flag: "FR" },
  { city: "Sydney", country: "Australia", flag: "AU" },
  { city: "Toronto", country: "Canada", flag: "CA" },
  { city: "Mexico City", country: "Mexico", flag: "MX" },
  { city: "Bangkok", country: "Thailand", flag: "TH" },
  { city: "Cape Town", country: "South Africa", flag: "ZA" },
];

const DEVICES = [
  "iPhone 15 Pro · iOS 17.4",
  "Pixel 8 · Android 14",
  "MacBook Pro · Safari 17.2",
  "Windows 11 · Chrome 122",
  "Galaxy S24 · Android 14",
  "iPad Air · iOS 17.3",
  "Linux · Firefox 124",
];

const FIRST_NAMES = ["Aarav","Liam","Noah","Sofia","Mia","Ravi","Emma","Lucas","Ananya","Ethan","Isabella","Ahmed","Yuki","Olivia","Hassan","Chloe","Diego","Maya"];
const LAST_NAMES = ["Patel","Smith","Johnson","Garcia","Kim","Singh","Tanaka","Mueller","Lopez","Brown","Khan","Davis","Chen","Silva","Cohen","Rossi"];

function mulberry32(seed) {
  return function() {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(7);

const pick = (arr) => arr[Math.floor(rand() * arr.length)];

function genTxn(i) {
  const r = rand();
  let riskLevel, fraudProb, pipeline, action, status;

  if (r < 0.62) {
    // Low risk
    riskLevel = "low";
    fraudProb = Math.round((rand() * 12 + 1) * 10) / 10;
    pipeline = "A";
    action = "Approve";
    status = "Approved";
  } else if (r < 0.88) {
    // Medium risk
    riskLevel = "medium";
    fraudProb = Math.round((rand() * 35 + 35) * 10) / 10;
    pipeline = "B";
    action = "OTP Required";
    status = rand() < 0.7 ? "OTP Sent" : "Approved";
  } else {
    // Critical
    riskLevel = "critical";
    fraudProb = Math.round((rand() * 18 + 80) * 10) / 10;
    pipeline = "C";
    action = pick(["Block", "Human Review", "Hold"]);
    status = pick(["Pending Review", "Blocked", "Investigating"]);
  }

  const baseAmount =
    riskLevel === "critical" ? 5000 + rand() * 45000 :
    riskLevel === "medium" ? 300 + rand() * 3000 :
    5 + rand() * 800;

  const amount = Math.round(baseAmount * 100) / 100;
  const loc = pick(LOCATIONS);
  const merchant = pick(MERCHANTS);
  const id = "TX-" + (100000 + i).toString();
  const customerId = "CUST-" + (50000 + Math.floor(rand() * 50000)).toString();
  const customerName = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
  const device = pick(DEVICES);

  // Timestamp: random in last 24h
  const ts = new Date(Date.now() - Math.floor(rand() * 86400 * 1000));

  return {
    id,
    customerId,
    customerName,
    amount,
    currency: "USD",
    location: loc,
    merchant,
    device,
    fraudProb,
    confidence: Math.round((85 + rand() * 14) * 10) / 10,
    pipeline,
    action,
    status,
    riskLevel,
    timestamp: ts.toISOString(),
    anomalies: generateAnomalies(riskLevel),
  };
}

function generateAnomalies(level) {
  const pool = [
    { key: "new_device", label: "New Device", desc: "First seen on this device", icon: "Smartphone" },
    { key: "foreign_loc", label: "Foreign Location", desc: "Geography deviates from baseline", icon: "Globe" },
    { key: "amount_spike", label: "Amount 32× Average", desc: "Statistically extreme spend", icon: "TrendingUp" },
    { key: "risk_merchant", label: "High Risk Merchant", desc: "Merchant on watchlist", icon: "AlertTriangle" },
    { key: "unusual_time", label: "Unusual Time", desc: "Activity outside profile window", icon: "Clock" },
    { key: "velocity", label: "Velocity Breach", desc: "4 txns in 90 seconds", icon: "Zap" },
    { key: "vpn", label: "VPN / Proxy Signal", desc: "Anonymized IP detected", icon: "Shield" },
  ];
  const count = level === "critical" ? 5 : level === "medium" ? 3 : 1;
  return pool.slice(0, count);
}

export const TRANSACTIONS = Array.from({ length: 150 }, (_, i) => genTxn(i))
  .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

export const KPIS = {
  txnToday: 184_730,
  txnDelta: 8.4,
  fraudDetected: 1_284,
  fraudDelta: -3.1,
  aiBudgetUsed: 6_341,
  aiBudgetTotal: 10_000,
  avgLatency: 132,
  latencyDelta: -12,
  llmCalls: 24_580,
  llmDelta: 14.2,
  moneySaved: 4_286_410,
  moneySavedDelta: 22.3,
};

export const PIPELINE_DISTRIBUTION = [
  { name: "Pipeline A", label: "Low Risk", count: 154_201, pct: 83.4, color: "#10B981" },
  { name: "Pipeline B", label: "Medium Risk", count: 23_540, pct: 12.7, color: "#F59E0B" },
  { name: "Pipeline C", label: "Critical Risk", count: 6_989, pct: 3.9, color: "#EF4444" },
];

export const ACTIVITY_FEED = [
  { id: 1, type: "received", label: "Transaction received", detail: "TX-100742 · $12,480.00 · Dubai", time: "12s ago", color: "cyan" },
  { id: 2, type: "pipeline", label: "Pipeline C selected", detail: "Critical risk · 94% fraud probability", time: "11s ago", color: "purple" },
  { id: 3, type: "llm", label: "LLM investigation completed", detail: "claude-sonnet-4.5 · 1.84s · 12,401 tokens", time: "9s ago", color: "purple" },
  { id: 4, type: "recommendation", label: "Recommendation generated", detail: "Block transaction · Confidence 97%", time: "8s ago", color: "amber" },
  { id: 5, type: "human", label: "Analyst approved decision", detail: "M. Reyes · override notes attached", time: "3s ago", color: "emerald" },
  { id: 6, type: "received", label: "Transaction received", detail: "TX-100743 · $42.10 · New York", time: "2s ago", color: "cyan" },
  { id: 7, type: "pipeline", label: "Pipeline A selected", detail: "Auto-approved · 2.1% fraud probability", time: "1s ago", color: "emerald" },
];

export const BUDGET_BREAKDOWN = [
  { name: "claude-sonnet-4.5", calls: 14_210, cost: 3_982, pct: 62.8 },
  { name: "gpt-5.2-mini", calls: 7_340, cost: 1_640, pct: 25.9 },
  { name: "gemini-3-flash", calls: 3_030, cost: 719, pct: 11.3 },
];

export const LATENCY_SERIES = Array.from({ length: 30 }, (_, i) => ({
  t: i,
  latency: 110 + Math.round(Math.sin(i / 3) * 18 + (i % 5) * 4),
}));

export const FRAUD_TREND = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i.toString().padStart(2, "0")}:00`,
  approved: Math.round(5000 + Math.sin(i / 4) * 1800 + (i > 12 ? 1200 : 0)),
  flagged: Math.round(120 + Math.cos(i / 3) * 50 + (i > 18 ? 80 : 0)),
  blocked: Math.round(20 + Math.abs(Math.sin(i / 2)) * 30),
}));

export function getTransactionById(id) {
  return TRANSACTIONS.find((t) => t.id === id) || TRANSACTIONS[0];
}

export const LLM_RECOMMENDATION = {
  model: "claude-sonnet-4.5",
  action: "Block Transaction",
  confidence: 97.4,
  reasoning: [
    "Transaction amount is 32× the customer's 90-day rolling average, exceeding all spend percentiles for this profile.",
    "Geo-IP places the request in a country with no prior activity from this customer, while the device fingerprint is new and shows VPN egress.",
    "Merchant category code (MCC 6051 - Quasi-Cash) combined with the velocity of 4 attempts in 90 seconds matches a documented account takeover pattern.",
    "Behavioural session signals (typing cadence, mouse entropy) diverge from baseline by 4.2 standard deviations.",
  ],
  nextStep: "Place a 24-hour hold, escalate to L2 analyst queue, and trigger customer outreach via verified channel.",
  tokens: 12_401,
  latencyMs: 1_842,
};
