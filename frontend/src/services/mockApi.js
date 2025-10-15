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

function delay(ms = 150) {
  return new Promise((res) => setTimeout(res, ms));
}

export async function searchServices({ q = "", onlyOtt = false, sort = "recommended", category, categories = [], opCategory = "or", minPrice, maxPrice, benefits = [], freeTrial = false } = {}) {
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


