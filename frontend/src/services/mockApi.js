// 간단 목업 API: 백엔드 연동 전 임시 데이터/정렬/필터 제공

const SERVICES = [
  { id: 1, name: "넷플릭스", priceValue: 13500, price: "₩ 13,500/월", tags: ["OTT", "4K"], benefits: ["FHD", "동시 2명"], category: "ott", nextBilling: "2025-11-02", icon: "/vite.svg" },
  { id: 2, name: "디즈니+", priceValue: 9900, price: "₩ 9,900/월", tags: ["OTT"], benefits: ["FHD"], category: "ott", nextBilling: "2025-10-28", icon: "/vite.svg" },
  { id: 3, name: "유튜브프리미엄", priceValue: 14900, price: "₩ 14,900/월", tags: ["Music", "Ad-free"], benefits: ["광고 제거", "백그라운드 재생"], category: "music", nextBilling: "2025-10-30", icon: "/vite.svg" },
  { id: 4, name: "티빙", priceValue: 10900, price: "₩ 10,900/월", tags: ["OTT"], benefits: ["국내 채널"], category: "ott", nextBilling: "2025-11-05", icon: "/vite.svg" },
  { id: 5, name: "웨이브", priceValue: 9500, price: "₩ 9,500/월", tags: ["OTT"], benefits: ["국내 드라마"], category: "ott", nextBilling: "2025-11-01", icon: "/vite.svg" },
  { id: 6, name: "드롭박스", priceValue: 12000, price: "₩ 12,000/월", tags: ["Cloud"], benefits: ["2TB"], category: "cloud", nextBilling: "2025-11-03", icon: "/vite.svg" },
];
// id : 말그대로 번호
// service : 숫자로 되어있는데 아무래도 서비스 이름을 번호로 지정해둔듯?
// plan_name : 해당 서비스의 플랜명을 적어둔듯?
// billing_cycle : 결제주기
// price : 가격
// benefits : 해당 서비스가 제공하는 혜택?
// created_at, updated_at은 노출되면 안될듯? 백엔드쪽에서 던져주는 데이터를 수정해야함.

//frontend  id, name, priceValue, price, tags, benefits, category, nextBilling, icon
//backend   id, service, plan_name, billing_cycle, price, benefits, created_at, updated_at
const COMPARISON = [
  { id: 101, name: "넷플릭스 Basic", regular: 9500, discount: null, bundle: null, benefits: ["FHD", "1명"] },
  { id: 102, name: "넷플릭스 Standard", regular: 13500, discount: 12500, bundle: 11900, benefits: ["FHD", "2명"] },
  { id: 201, name: "디즈니+ Basic", regular: 9900, discount: 8900, bundle: null, benefits: ["FHD"] },
];

const DJANGO_BASE_URL = 'http://localhost:8000';
// --- 가격 이력 / 프로모션 / 번들 목업 ---
const PRICE_HISTORY = [
  { price_id: 1, plan_id: 102, price: 13500, start_date: "2025-01-01", end_date: "2025-12-31", discount_reason: null, is_bundle: false },
  { price_id: 2, plan_id: 201, price: 9900, start_date: "2025-08-01", end_date: null, discount_reason: "가을 프로모션", is_bundle: false },
];

const PROMOTIONS = [
  { promo_id: 1, name: "통신사 제휴 10%", description: "특정 통신사 고객 10% 할인", discount_type: "percent", discount_value: 10, start_date: "2025-10-01", end_date: "2025-12-31", target_type: "service", target_id: 1, telecom_id: 1, card_id: null },
  { promo_id: 2, name: "카드 청구할인 2,000원", description: "제휴 카드 청구할인", discount_type: "fixed", discount_value: 2000, start_date: "2025-10-01", end_date: "2025-10-31", target_type: "plan", target_id: 102, telecom_id: null, card_id: 3 },
  { promo_id: 3, name: "가을 전고객 5%", description: "모든 사용자 5% 할인", discount_type: "percent", discount_value: 5, start_date: "2025-09-15", end_date: "2025-11-15", target_type: "service", target_id: 2, telecom_id: null, card_id: null },
];

const BUNDLES = [
  { bundle_id: 1, name: "넷플+뮤직", description: "OTT + 음악 결합", total_price: 19900, start_date: "2025-10-01", end_date: null },
];
const BUNDLE_PLANS = [
  { bundle_plan_id: 1, bundle_id: 1, plan_id: 102 },
  { bundle_plan_id: 2, bundle_id: 1, plan_id: 201 },
];

function delay(ms = 150) {
  return new Promise((res) => setTimeout(res, ms));
}

export async function searchServices(
{
    q = "",
    onlyOtt = false,
    sort = "recommended",
    category,
    categories = [],
    opCategory = "or",
    minPrice,
    maxPrice,
    benefits = [],
    freeTrial = false
    } = {}
) {

  await delay(120);
  let rows = SERVICES;
  if (q) {
    rows = rows.filter((s) => s.name.toLowerCase().includes(q.toLowerCase()));
  }
  if (onlyOtt) {
    rows = rows.filter((s) => s.tags.includes("OTT"));
  }
  if (category) {
    rows = rows.filter((s) => s.category === category);
  }
  if (Array.isArray(categories) && categories.length > 0) {
    if (opCategory === "or") {
      rows = rows.filter((s) => categories.includes(s.category));
    } else {
      // AND의 경우 단일 카테고리 데이터에서는 OR과 동일 동작
      rows = rows.filter((s) => categories.includes(s.category));
    }
  }
  if (typeof minPrice === "number") {
    rows = rows.filter((s) => s.priceValue >= minPrice);
  }
  if (typeof maxPrice === "number") {
    rows = rows.filter((s) => s.priceValue <= maxPrice);
  }
  if (Array.isArray(benefits) && benefits.length > 0) {
    rows = rows.filter((s) => benefits.every((b) => (s.benefits || []).includes(b)));
  }
  if (freeTrial) {
    // 목업: 무료체험은 넷플릭스/디즈니+만 있다고 가정
    rows = rows.filter((s) => ["넷플릭스", "디즈니+"].includes(s.name));
  }
  if (sort === "priceAsc") {
    rows = [...rows].sort((a, b) => a.priceValue - b.priceValue);
  } else if (sort === "priceDesc") {
    rows = [...rows].sort((a, b) => b.priceValue - a.priceValue);
  } else if (sort === "nameAsc") {
    rows = [...rows].sort((a, b) => a.name.localeCompare(b.name));
  } else if (sort === "nextBillingAsc") {
    rows = [...rows].sort((a, b) => new Date(a.nextBilling) - new Date(b.nextBilling));
  }
  return rows;
}

export async function getComparison({ sort = "recommended" } = {}) {
  await delay(120);
  let rows = COMPARISON;
  if (sort === "priceAsc") {
    rows = [...rows].sort((a, b) => a.regular - b.regular);
  } else if (sort === "priceDesc") {
    rows = [...rows].sort((a, b) => b.regular - a.regular);
  } else if (sort === "nameAsc") {
    rows = [...rows].sort((a, b) => a.name.localeCompare(b.name));
  }
  return rows;
}

export async function getServiceDetail(id) {
  await delay(120);
  const base = SERVICES.find((s) => String(s.id) === String(id));
  if (!base) return { id, name: `서비스 #${id}`, plans: [] };
  // 간단한 플랜 목업
  return {
    id: base.id,
    name: base.name,
    officialUrl: base.name === "넷플릭스" ? "https://www.netflix.com/kr/" : base.name === "디즈니+" ? "https://www.disneyplus.com/ko-kr" : undefined,
    plans: [
      { name: "Basic", price: base.price.replace("/월", ""), cycle: "월", freeTrial: true, benefits: ["FHD", "1명"] },
      { name: "Standard", price: "₩ 13,500", cycle: "월", freeTrial: false, benefits: ["FHD", "2명"] },
    ],
  };
}
/*
// 간단 목업 API: 백엔드 연동 전 임시 데이터/정렬/필터 제공

const SERVICES = [
  { id: 1, name: "넷플릭스", priceValue: 13500, price: "₩ 13,500/월", tags: ["OTT", "4K"], benefits: ["FHD", "동시 2명"], category: "ott", nextBilling: "2025-11-02", icon: "/vite.svg" },
  { id: 2, name: "디즈니+", priceValue: 9900, price: "₩ 9,900/월", tags: ["OTT"], benefits: ["FHD"], category: "ott", nextBilling: "2025-10-28", icon: "/vite.svg" },
  { id: 3, name: "유튜브프리미엄", priceValue: 14900, price: "₩ 14,900/월", tags: ["Music", "Ad-free"], benefits: ["광고 제거", "백그라운드 재생"], category: "music", nextBilling: "2025-10-30", icon: "/vite.svg" },
  { id: 4, name: "티빙", priceValue: 10900, price: "₩ 10,900/월", tags: ["OTT"], benefits: ["국내 채널"], category: "ott", nextBilling: "2025-11-05", icon: "/vite.svg" },
  { id: 5, name: "웨이브", priceValue: 9500, price: "₩ 9,500/월", tags: ["OTT"], benefits: ["국내 드라마"], category: "ott", nextBilling: "2025-11-01", icon: "/vite.svg" },
  { id: 6, name: "드롭박스", priceValue: 12000, price: "₩ 12,000/월", tags: ["Cloud"], benefits: ["2TB"], category: "cloud", nextBilling: "2025-11-03", icon: "/vite.svg" },
];

const COMPARISON = [
  { id: 101, name: "넷플릭스 Basic", regular: 9500, discount: null, bundle: null, benefits: ["FHD", "1명"] },
  { id: 102, name: "넷플릭스 Standard", regular: 13500, discount: 12500, bundle: 11900, benefits: ["FHD", "2명"] },
  { id: 201, name: "디즈니+ Basic", regular: 9900, discount: 8900, bundle: null, benefits: ["FHD"] },
];

const DJANGO_BASE_URL = 'http://localhost:8000';

function delay(ms = 150) {
  return new Promise((res) => setTimeout(res, ms));
}

export async function searchServices(
{
    q = "",
    onlyOtt = false,
    sort = "recommended",
    category,
    categories = [],
    opCategory = "or",
    minPrice,
    maxPrice,
    benefits = [],
    freeTrial = false
    } = {}
) {
export async function getPriceHistory(planId) {
  await delay(100);
  return PRICE_HISTORY.filter((p) => String(p.plan_id) === String(planId));
}

export async function listPromotions({ targetType, targetId, telecomId, cardIds = [], activeOnly = false } = {}) {
  await delay(100);
  let rows = PROMOTIONS;
  if (targetType && targetType !== 'all') rows = rows.filter((p) => p.target_type === targetType);
  if (targetId != null && targetId !== '') rows = rows.filter((p) => String(p.target_id) === String(targetId));

  if (telecomId) {
    rows = rows.filter((p) => p.telecom_id == null || String(p.telecom_id) === String(telecomId));
  }
  if (Array.isArray(cardIds) && cardIds.length > 0) {
    const set = new Set(cardIds.map(String));
    rows = rows.filter((p) => p.card_id == null || set.has(String(p.card_id)));
  }

  if (activeOnly) {
    const today = new Date();
    rows = rows.filter((p) => {
      const start = p.start_date ? new Date(p.start_date) : null;
      const end = p.end_date ? new Date(p.end_date) : null;
      const afterStart = !start || start <= today;
      const beforeEnd = !end || today <= end;
      return afterStart && beforeEnd;
    });
  }

  return rows;
}

export async function listBundles() {
  await delay(100);
  return BUNDLES.map((b) => ({
    ...b,
    plans: BUNDLE_PLANS.filter((x) => x.bundle_id === b.bundle_id).map((x) => x.plan_id),
  }));
}


  await delay(120);
  let rows = SERVICES;
  if (q) {
    rows = rows.filter((s) => s.name.toLowerCase().includes(q.toLowerCase()));
  }
  if (onlyOtt) {
    rows = rows.filter((s) => s.tags.includes("OTT"));
  }
  if (category) {
    rows = rows.filter((s) => s.category === category);
  }
  if (Array.isArray(categories) && categories.length > 0) {
    if (opCategory === "or") {
      rows = rows.filter((s) => categories.includes(s.category));
    } else {
      // AND의 경우 단일 카테고리 데이터에서는 OR과 동일 동작
      rows = rows.filter((s) => categories.includes(s.category));
    }
  }
  if (typeof minPrice === "number") {
    rows = rows.filter((s) => s.priceValue >= minPrice);
  }
  if (typeof maxPrice === "number") {
    rows = rows.filter((s) => s.priceValue <= maxPrice);
  }
  if (Array.isArray(benefits) && benefits.length > 0) {
    rows = rows.filter((s) => benefits.every((b) => (s.benefits || []).includes(b)));
  }
  if (freeTrial) {
    // 목업: 무료체험은 넷플릭스/디즈니+만 있다고 가정
    rows = rows.filter((s) => ["넷플릭스", "디즈니+"].includes(s.name));
  }
  if (sort === "priceAsc") {
    rows = [...rows].sort((a, b) => a.priceValue - b.priceValue);
  } else if (sort === "priceDesc") {
    rows = [...rows].sort((a, b) => b.priceValue - a.priceValue);
  } else if (sort === "nameAsc") {
    rows = [...rows].sort((a, b) => a.name.localeCompare(b.name));
  } else if (sort === "nextBillingAsc") {
    rows = [...rows].sort((a, b) => new Date(a.nextBilling) - new Date(b.nextBilling));
  }
  return rows;
}

export async function getComparison({ sort = "recommended" } = {}) {
  await delay(120);
  let rows = COMPARISON;
  if (sort === "priceAsc") {
    rows = [...rows].sort((a, b) => a.regular - b.regular);
  } else if (sort === "priceDesc") {
    rows = [...rows].sort((a, b) => b.regular - a.regular);
  } else if (sort === "nameAsc") {
    rows = [...rows].sort((a, b) => a.name.localeCompare(b.name));
  }
  return rows;
}

export async function getServiceDetail(id) {
  await delay(120);
  const base = SERVICES.find((s) => String(s.id) === String(id));
  if (!base) return { id, name: `서비스 #${id}`, plans: [] };
  // 간단한 플랜 목업
  return {
    id: base.id,
    name: base.name,
    officialUrl: base.name === "넷플릭스" ? "https://www.netflix.com/kr/" : base.name === "디즈니+" ? "https://www.disneyplus.com/ko-kr" : undefined,
    plans: [
      { name: "Basic", price: base.price.replace("/월", ""), cycle: "월", freeTrial: true, benefits: ["FHD", "1명"] },
      { name: "Standard", price: "₩ 13,500", cycle: "월", freeTrial: false, benefits: ["FHD", "2명"] },
    ],
  };
}
*/