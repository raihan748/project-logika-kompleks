import fs from "fs";
import path from "path";

const productsDir = path.join(process.cwd(), "public", "products");
if (!fs.existsSync(productsDir)) {
  fs.mkdirSync(productsDir, { recursive: true });
}

interface ProductPackshotDef {
  id: string;
  brand: string;
  name: string;
  variant: string;
  netWeight: string;
  bgGradStart: string;
  bgGradEnd: string;
  packType: "pouch" | "box" | "bottle" | "can" | "sack" | "bag" | "cup" | "plate" | "tube" | "jar";
  accentColor: string;
  textColor: string;
  secondaryText?: string;
  badge?: string;
}

const PACKSHOTS: ProductPackshotDef[] = [
  // SEMBAKO
  {
    id: "prod_sembako_001",
    brand: "SETRA RAMOS",
    name: "BERAS PREMIUM",
    variant: "Pulen & Bersih",
    netWeight: "Netto: 5 KG",
    bgGradStart: "#047857",
    bgGradEnd: "#065f46",
    packType: "sack",
    accentColor: "#fbbf24",
    textColor: "#ffffff",
    badge: "PREMIUM RICE",
  },
  {
    id: "prod_sembako_002",
    brand: "SANIA",
    name: "MINYAK GORENG",
    variant: "Kelapa Sawit Pilihan",
    netWeight: "Isi Bersih: 2 LITER",
    bgGradStart: "#eab308",
    bgGradEnd: "#ca8a04",
    packType: "pouch",
    accentColor: "#15803d",
    textColor: "#ffffff",
    badge: "ROYALE POUCH",
  },
  {
    id: "prod_sembako_003",
    brand: "GULAKU",
    name: "GULA PASIR TEBU",
    variant: "Kemasan Kuning Alami",
    netWeight: "Netto: 1 KG",
    bgGradStart: "#facc15",
    bgGradEnd: "#eab308",
    packType: "bag",
    accentColor: "#166534",
    textColor: "#78350f",
    badge: "100% TEBU ALAMI",
  },
  {
    id: "prod_sembako_004",
    brand: "FRESH FARM",
    name: "TELUR AYAM NEGERI",
    variant: "Segar & Berkualitas",
    netWeight: "Isi: 1 KG (16 Butir)",
    bgGradStart: "#d97706",
    bgGradEnd: "#b45309",
    packType: "box",
    accentColor: "#fef3c7",
    textColor: "#ffffff",
    badge: "FRESH EGGS",
  },
  {
    id: "prod_sembako_005",
    brand: "SEGITIGA BIRU",
    name: "TEPUNG TERIGU",
    variant: "Serbaguna Protein Sedang",
    netWeight: "Netto: 1 KG",
    bgGradStart: "#1d4ed8",
    bgGradEnd: "#1e40af",
    packType: "bag",
    accentColor: "#fde047",
    textColor: "#ffffff",
    badge: "BOGASARI",
  },
  {
    id: "prod_sembako_006",
    brand: "BLUE BAND",
    name: "MARGARIN SERBAGUNA",
    variant: "Omega 3 & 6 Enriched",
    netWeight: "Netto: 200 GR",
    bgGradStart: "#2563eb",
    bgGradEnd: "#1d4ed8",
    packType: "pouch",
    accentColor: "#facc15",
    textColor: "#ffffff",
    badge: "SERBAGUNA",
  },

  // MINUMAN
  {
    id: "prod_minum_001",
    brand: "Le Minerale",
    name: "AIR MINERAL",
    variant: "Air Pegunungan Alami",
    netWeight: "Botol: 600 ML",
    bgGradStart: "#0284c7",
    bgGradEnd: "#0369a1",
    packType: "bottle",
    accentColor: "#e0f2fe",
    textColor: "#ffffff",
    badge: "MINERAL ALAMI",
  },
  {
    id: "prod_minum_002",
    brand: "TEH PUCUK HARUM",
    name: "TEH MELATI",
    variant: "Pucuk Daun Teh Pilihan",
    netWeight: "Botol: 350 ML",
    bgGradStart: "#15803d",
    bgGradEnd: "#166534",
    packType: "bottle",
    accentColor: "#fde047",
    textColor: "#ffffff",
    badge: "HARUM MELATI",
  },
  {
    id: "prod_minum_003",
    brand: "ULTRA MILK",
    name: "SUSU UHT COKELAT",
    variant: "Fresh Dairy Milk",
    netWeight: "Isi: 250 ML",
    bgGradStart: "#451a03",
    bgGradEnd: "#78350f",
    packType: "box",
    accentColor: "#fef3c7",
    textColor: "#ffffff",
    badge: "REAL CHOCOLATE",
  },
  {
    id: "prod_minum_004",
    brand: "KOPI KENANGAN",
    name: "MANTANCINO",
    variant: "Espresso & Fresh Milk",
    netWeight: "Kaleng: 220 ML",
    bgGradStart: "#292524",
    bgGradEnd: "#1c1917",
    packType: "can",
    accentColor: "#f59e0b",
    textColor: "#ffffff",
    badge: "READY TO DRINK",
  },
  {
    id: "prod_minum_005",
    brand: "POCARI SWEAT",
    name: "ION SUPPLY DRINK",
    variant: "Isotonik Elektrolit Tubuh",
    netWeight: "Botol: 500 ML",
    bgGradStart: "#0284c7",
    bgGradEnd: "#0369a1",
    packType: "bottle",
    accentColor: "#ffffff",
    textColor: "#ffffff",
    badge: "ION BODY RECOVERY",
  },
  {
    id: "prod_minum_006",
    brand: "FLORIDINA",
    name: "ORANGE PULPY",
    variant: "Bulir Jeruk Asli Florida",
    netWeight: "Botol: 350 ML",
    bgGradStart: "#ea580c",
    bgGradEnd: "#c2410c",
    packType: "bottle",
    accentColor: "#fef08a",
    textColor: "#ffffff",
    badge: "REAL PULP",
  },
  {
    id: "prod_minum_007",
    brand: "WARUNG BERKAH",
    name: "ES TEH MANIS JUMBO",
    variant: "Seduhan Segar Es Batu",
    netWeight: "Cup: 22 Oz",
    bgGradStart: "#b45309",
    bgGradEnd: "#92400e",
    packType: "cup",
    accentColor: "#fef3c7",
    textColor: "#ffffff",
    badge: "SEGAR DINGIN",
  },

  // SNACK
  {
    id: "prod_snk_001",
    brand: "CHITATO",
    name: "SAPI PANGGANG",
    variant: "Keripik Kentang Wavy",
    netWeight: "Netto: 68 GR",
    bgGradStart: "#18181b",
    bgGradEnd: "#27272a",
    packType: "bag",
    accentColor: "#eab308",
    textColor: "#ffffff",
    badge: "BEEF BBQ",
  },
  {
    id: "prod_snk_002",
    brand: "SILVERQUEEN",
    name: "CASHEW CHOCOLATE",
    variant: "Milk Chocolate Mete Bar",
    netWeight: "Netto: 58 GR",
    bgGradStart: "#7f1d1d",
    bgGradEnd: "#991b1b",
    packType: "bag",
    accentColor: "#fbbf24",
    textColor: "#ffffff",
    badge: "CHUNKY CASHEW",
  },
  {
    id: "prod_snk_003",
    brand: "OREO",
    name: "VANILLA SANDWICH",
    variant: "Biskuit Cokelat Krim Vanila",
    netWeight: "Netto: 119.6 GR",
    bgGradStart: "#1e3a8a",
    bgGradEnd: "#172554",
    packType: "bag",
    accentColor: "#38bdf8",
    textColor: "#ffffff",
    badge: "TWIST LICK DUNK",
  },
  {
    id: "prod_snk_004",
    brand: "SARI ROTI",
    name: "ROTI TAWAR KUPAS",
    variant: "Tekstur Lembut & Higienis",
    netWeight: "Netto: 200 GR",
    bgGradStart: "#1e40af",
    bgGradEnd: "#1e3a8a",
    packType: "bag",
    accentColor: "#facc15",
    textColor: "#ffffff",
    badge: "ROTI TAWAR",
  },
  {
    id: "prod_snk_005",
    brand: "BENG-BENG",
    name: "WAFER COKELAT CRISPY",
    variant: "4 Kelezatan Sekali Gigit",
    netWeight: "Netto: 25 GR",
    bgGradStart: "#b91c1c",
    bgGradEnd: "#991b1b",
    packType: "bag",
    accentColor: "#facc15",
    textColor: "#ffffff",
    badge: "CARAMEL CRISPY",
  },
  {
    id: "prod_snk_008",
    brand: "WARUNG",
    name: "KERUPUK KALENG PUTIH",
    variant: "Renyah Gurih Kaleng Warung",
    netWeight: "Satuan Pcs",
    bgGradStart: "#0284c7",
    bgGradEnd: "#0369a1",
    packType: "can",
    accentColor: "#f8fafc",
    textColor: "#ffffff",
    badge: "KALENG WARUNG",
  },

  // F&B / SIAP SAJI
  {
    id: "prod_fnb_001",
    brand: "WARUNG SPESIAL",
    name: "NASI GORENG TELUR",
    variant: "Acar, Kerupuk, Telur Ceplok",
    netWeight: "1 Porsi Hangat",
    bgGradStart: "#c2410c",
    bgGradEnd: "#9a3412",
    packType: "plate",
    accentColor: "#fef08a",
    textColor: "#ffffff",
    badge: "SPESIAL WARUNG",
  },
  {
    id: "prod_fnb_002",
    brand: "WARUNG SPESIAL",
    name: "MIE GORENG KORNET",
    variant: "Telur Mata Sapi & Sayur",
    netWeight: "1 Porsi Hangat",
    bgGradStart: "#b45309",
    bgGradEnd: "#78350f",
    packType: "plate",
    accentColor: "#fde047",
    textColor: "#ffffff",
    badge: "FAVORIT WARUNG",
  },
  {
    id: "prod_fnb_003",
    brand: "WARUNG SPESIAL",
    name: "AYAM GEPREK SAMBAL",
    variant: "Sambal Bawang Pedas + Nasi",
    netWeight: "1 Porsi Komplit",
    bgGradStart: "#b91c1c",
    bgGradEnd: "#7f1d1d",
    packType: "plate",
    accentColor: "#fef08a",
    textColor: "#ffffff",
    badge: "EXTRA PEDAS",
  },

  // BUMBU & MIE INSTAN
  {
    id: "prod_bumbu_001",
    brand: "INDOMIE",
    name: "MI GORENG SPESIAL",
    variant: "Mi Instan Goreng Asli",
    netWeight: "Netto: 85 GR",
    bgGradStart: "#dc2626",
    bgGradEnd: "#991b1b",
    packType: "bag",
    accentColor: "#fef08a",
    textColor: "#ffffff",
    badge: "INDOMIE GORENG",
  },
  {
    id: "prod_bumbu_002",
    brand: "INDOMIE",
    name: "KARI AYAM KUAH",
    variant: "Kuah Kari Gurih Mantap",
    netWeight: "Netto: 72 GR",
    bgGradStart: "#ca8a04",
    bgGradEnd: "#a16207",
    packType: "bag",
    accentColor: "#15803d",
    textColor: "#ffffff",
    badge: "KUAH KARI",
  },
  {
    id: "prod_bumbu_003",
    brand: "BANGO",
    name: "KECAP MANIS POUCH",
    variant: "Kedelai Hitam Mallika Asli",
    netWeight: "Refill: 520 ML",
    bgGradStart: "#14532d",
    bgGradEnd: "#052e16",
    packType: "pouch",
    accentColor: "#fbbf24",
    textColor: "#ffffff",
    badge: "KEDELAI MALLIKA",
  },
  {
    id: "prod_bumbu_004",
    brand: "ABC",
    name: "SAMBAL EKSTRA PEDAS",
    variant: "Cabai Merah Asli Segar",
    netWeight: "Botol: 335 ML",
    bgGradStart: "#dc2626",
    bgGradEnd: "#991b1b",
    packType: "bottle",
    accentColor: "#facc15",
    textColor: "#ffffff",
    badge: "SAMBAL ABC",
  },

  // PERAWATAN & RUMAH TANGGA
  {
    id: "prod_hsh_001",
    brand: "SUNLIGHT",
    name: "PENCUCI PIRING",
    variant: "Ekstrak Jeruk Nipis 100",
    netWeight: "Pouch: 700 ML",
    bgGradStart: "#15803d",
    bgGradEnd: "#166534",
    packType: "pouch",
    accentColor: "#facc15",
    textColor: "#ffffff",
    badge: "JERUK NIPIS",
  },
  {
    id: "prod_hsh_002",
    brand: "RINSO MOLTO",
    name: "DETERJEN CAIR",
    variant: "Rose Fresh 3x Konsentrat",
    netWeight: "Pouch: 750 ML",
    bgGradStart: "#be185d",
    bgGradEnd: "#9d174d",
    packType: "pouch",
    accentColor: "#fbcfe8",
    textColor: "#ffffff",
    badge: "ROSE FRESH",
  },
  {
    id: "prod_hsh_003",
    brand: "LIFEBUOY",
    name: "SABUN CAIR TOTAL 10",
    variant: "Antibakterial Body Wash",
    netWeight: "Refill: 400 ML",
    bgGradStart: "#b91c1c",
    bgGradEnd: "#7f1d1d",
    packType: "pouch",
    accentColor: "#ffffff",
    textColor: "#ffffff",
    badge: "TOTAL 10 PROTECT",
  },
  {
    id: "prod_hsh_004",
    brand: "PEPSODENT",
    name: "PASTA GIGI FRESH COOL",
    variant: "Pencegah Gigi Berlubang",
    netWeight: "Tube: 190 GR",
    bgGradStart: "#b91c1c",
    bgGradEnd: "#1e3a8a",
    packType: "tube",
    accentColor: "#ffffff",
    textColor: "#ffffff",
    badge: "MICRO CALCIUM",
  },
  {
    id: "prod_hsh_005",
    brand: "PANTENE",
    name: "SHAMPOO ANTI DANDRUFF",
    variant: "Pro-V Formula Bersih",
    netWeight: "Botol: 160 ML",
    bgGradStart: "#1e293b",
    bgGradEnd: "#0f172a",
    packType: "bottle",
    accentColor: "#f59e0b",
    textColor: "#ffffff",
    badge: "PRO-V NO DANDRUFF",
  },
  {
    id: "prod_hsh_006",
    brand: "BAYGON",
    name: "ANTI NYAMUK & LALAT",
    variant: "Aerosol Semprotan Flower",
    netWeight: "Kaleng: 600 ML",
    bgGradStart: "#047857",
    bgGradEnd: "#065f46",
    packType: "can",
    accentColor: "#fbbf24",
    textColor: "#ffffff",
    badge: "MAX PROTECTION",
  },
];

function generatePackshotSVG(item: ProductPackshotDef): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${item.bgGradStart}" />
      <stop offset="100%" stop-color="${item.bgGradEnd}" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#000000" flood-opacity="0.35" />
    </filter>
  </defs>

  <!-- Studio Stage Background -->
  <rect width="400" height="320" fill="#f1f5f9" />
  
  <!-- Subtle circular stage highlight -->
  <ellipse cx="200" cy="270" rx="140" ry="25" fill="#e2e8f0" />
  <circle cx="200" cy="140" r="110" fill="#ffffff" fill-opacity="0.6" filter="blur(20px)" />

  <!-- Packaging Graphic Shape based on type -->
  ${getPackagingShape(item)}

  <!-- Brand Label Ribbon / Badge -->
  ${
    item.badge
      ? `<g transform="translate(200, 48)">
          <rect x="-70" y="-12" width="140" height="24" rx="12" fill="${item.accentColor}" filter="url(#shadow)" />
          <text x="0" y="4" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="900" fill="#0f172a" letter-spacing="1">${escapeXml(
            item.badge
          )}</text>
        </g>`
      : ""
  }

  <!-- Brand Typography -->
  <text x="200" y="145" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="900" fill="${item.textColor}" letter-spacing="0.5" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.4))">
    ${escapeXml(item.brand)}
  </text>

  <!-- Product Name -->
  <text x="200" y="172" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="800" fill="${item.accentColor}" letter-spacing="0.5" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.5))">
    ${escapeXml(item.name)}
  </text>

  <!-- Variant Description -->
  <text x="200" y="195" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="${item.textColor}" opacity="0.95">
    ${escapeXml(item.variant)}
  </text>

  <!-- Net Weight Barcode Footer on Packaging -->
  <g transform="translate(200, 230)">
    <rect x="-60" y="-10" width="120" height="20" rx="6" fill="#000000" fill-opacity="0.35" />
    <text x="0" y="4" text-anchor="middle" font-family="monospace" font-size="10" font-weight="700" fill="#ffffff">${escapeXml(
      item.netWeight
    )}</text>
  </g>
</svg>`;
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return c;
    }
  });
}

function getPackagingShape(item: ProductPackshotDef): string {
  switch (item.packType) {
    case "bottle":
      return `
        <!-- Bottle Neck & Cap -->
        <path d="M 175 60 L 225 60 L 220 85 L 180 85 Z" fill="${item.accentColor}" filter="url(#shadow)" />
        <rect x="180" y="45" width="40" height="18" rx="4" fill="${item.accentColor}" />
        <!-- Bottle Body -->
        <rect x="130" y="85" width="140" height="175" rx="35" fill="url(#bgGrad)" filter="url(#shadow)" />
        <rect x="140" y="115" width="120" height="115" rx="12" fill="#ffffff" fill-opacity="0.15" />
      `;
    case "can":
      return `
        <!-- Metal Can Top Rim -->
        <ellipse cx="200" cy="75" rx="70" ry="15" fill="#cbd5e1" filter="url(#shadow)" />
        <!-- Can Body -->
        <path d="M 130 75 L 130 250 A 70 15 0 0 0 270 250 L 270 75 Z" fill="url(#bgGrad)" filter="url(#shadow)" />
        <ellipse cx="200" cy="250" rx="70" ry="15" fill="${item.bgGradEnd}" />
        <rect x="140" y="110" width="120" height="120" rx="10" fill="#ffffff" fill-opacity="0.1" />
      `;
    case "pouch":
      return `
        <!-- Stand-up Pouch Bag -->
        <path d="M 140 60 L 260 60 L 275 240 A 100 20 0 0 1 125 240 Z" fill="url(#bgGrad)" filter="url(#shadow)" />
        <path d="M 140 60 L 260 60 L 255 75 L 145 75 Z" fill="${item.accentColor}" opacity="0.8" />
        <!-- Pouch Notch & Seal -->
        <line x1="140" y1="70" x2="260" y2="70" stroke="#ffffff" stroke-width="1.5" stroke-dasharray="4 2" />
        <rect x="140" y="105" width="120" height="120" rx="16" fill="#000000" fill-opacity="0.12" />
      `;
    case "sack":
      return `
        <!-- Rice Sack -->
        <path d="M 125 70 Q 200 60 275 70 L 270 255 Q 200 265 130 255 Z" fill="url(#bgGrad)" filter="url(#shadow)" />
        <!-- Top Stitching -->
        <path d="M 120 70 L 280 70" stroke="${item.accentColor}" stroke-width="6" stroke-linecap="round" />
        <rect x="140" y="105" width="120" height="125" rx="14" fill="#ffffff" fill-opacity="0.15" />
      `;
    case "tube":
      return `
        <!-- Toothpaste Tube / Box -->
        <rect x="100" y="95" width="200" height="135" rx="20" fill="url(#bgGrad)" filter="url(#shadow)" />
        <rect x="290" y="135" width="25" height="55" rx="6" fill="${item.accentColor}" />
        <rect x="115" y="110" width="170" height="105" rx="12" fill="#ffffff" fill-opacity="0.15" />
      `;
    case "plate":
      return `
        <!-- Fresh Cooked Serving Dish / Plate -->
        <ellipse cx="200" cy="165" rx="120" ry="80" fill="url(#bgGrad)" filter="url(#shadow)" />
        <ellipse cx="200" cy="165" rx="95" ry="60" fill="#ffffff" fill-opacity="0.2" />
        <circle cx="200" cy="165" r="45" fill="${item.accentColor}" fill-opacity="0.3" />
      `;
    case "cup":
      return `
        <!-- Cold Drink Cup with Straw -->
        <line x1="225" y1="30" x2="200" y2="100" stroke="#f59e0b" stroke-width="8" stroke-linecap="round" />
        <ellipse cx="200" cy="95" rx="65" ry="12" fill="#e2e8f0" filter="url(#shadow)" />
        <path d="M 140 95 L 155 255 A 45 10 0 0 0 245 255 L 260 95 Z" fill="url(#bgGrad)" filter="url(#shadow)" />
        <rect x="155" y="125" width="90" height="100" rx="10" fill="#ffffff" fill-opacity="0.18" />
      `;
    case "box":
    case "bag":
    default:
      return `
        <!-- Retail Packaging Box / Bag -->
        <rect x="120" y="70" width="160" height="190" rx="22" fill="url(#bgGrad)" filter="url(#shadow)" />
        <rect x="135" y="105" width="130" height="130" rx="14" fill="#ffffff" fill-opacity="0.15" />
      `;
  }
}

// Generate all packshot SVGs
PACKSHOTS.forEach((item) => {
  const svgContent = generatePackshotSVG(item);
  const filePath = path.join(productsDir, `${item.id}.svg`);
  fs.writeFileSync(filePath, svgContent, "utf-8");
  console.log(`Generated packshot: ${filePath}`);
});

console.log(`Successfully generated ${PACKSHOTS.length} real product packshot graphics!`);
