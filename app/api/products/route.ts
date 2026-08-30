import { NextResponse } from "next/server";
import { INITIAL_UMKM_PRODUCTS } from "../../../lib/data/umkm-catalog";
import { Product } from "../../../lib/types/pos";

let memoryProducts: Product[] = [...INITIAL_UMKM_PRODUCTS];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.toLowerCase();
  const category = searchParams.get("category");

  let filtered = [...memoryProducts];

  if (category && category !== "all") {
    filtered = filtered.filter((p) => p.category === category);
  }

  if (query) {
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query) ||
        p.id.toLowerCase().includes(query)
    );
  }

  return NextResponse.json({
    success: true,
    total: filtered.length,
    data: filtered,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.name || body.price === undefined) {
      return NextResponse.json(
        { success: false, error: "Nama produk dan Harga jual wajib diisi." },
        { status: 400 }
      );
    }

    const newProduct: Product = {
      id: body.id || `prod_${Date.now()}`,
      sku: body.sku ? body.sku.trim() : `${Date.now()}`,
      name: body.name.trim(),
      category: body.category || "sembako",
      price: Number(body.price),
      costPrice: Number(body.costPrice || body.price * 0.75),
      stock: Number(body.stock || 50),
      minStockAlert: Number(body.minStockAlert || 5),
      unit: body.unit || "pcs",
      imageUrl: body.imageUrl || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&auto=format&fit=crop&q=80",
      isFavorite: Boolean(body.isFavorite),
    };

    memoryProducts = [newProduct, ...memoryProducts];

    return NextResponse.json({
      success: true,
      message: "Produk berhasil ditambahkan ke katalog.",
      data: newProduct,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    const idx = memoryProducts.findIndex((p) => p.id === id);
    if (idx === -1) {
      return NextResponse.json(
        { success: false, error: "Produk tidak ditemukan." },
        { status: 404 }
      );
    }

    memoryProducts[idx] = { ...memoryProducts[idx], ...updates };

    return NextResponse.json({
      success: true,
      message: "Data produk berhasil diperbarui.",
      data: memoryProducts[idx],
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID produk wajib disertakan." },
        { status: 400 }
      );
    }

    memoryProducts = memoryProducts.filter((p) => p.id !== id);

    return NextResponse.json({
      success: true,
      message: "Produk berhasil dihapus.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
