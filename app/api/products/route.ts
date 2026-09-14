import { NextResponse } from "next/server";
import { INITIAL_UMKM_PRODUCTS } from "../../../lib/data/umkm-catalog";
import { Product } from "../../../lib/types/pos";
import { createServerSupabaseClient } from "../../../lib/supabase/server";

let memoryProducts: Product[] = [...INITIAL_UMKM_PRODUCTS];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.toLowerCase();
  const category = searchParams.get("category");

  const supabase = createServerSupabaseClient();

  try {
    let queryBuilder = supabase.from("products").select("*").order("created_at", { ascending: false });

    if (category && category !== "all") {
      queryBuilder = queryBuilder.eq("category", category);
    }

    if (query) {
      queryBuilder = queryBuilder.or(`name.ilike.%${query}%,sku.ilike.%${query}%`);
    }

    const { data: dbProducts, error: dbError } = await queryBuilder;

    if (!dbError && dbProducts && dbProducts.length > 0) {
      const mapped: Product[] = dbProducts.map((row) => ({
        id: row.id,
        sku: row.sku,
        name: row.name,
        category: row.category,
        price: Number(row.price),
        costPrice: Number(row.cost_price),
        stock: Number(row.stock),
        minStockAlert: Number(row.min_stock_alert),
        unit: row.unit,
        imageUrl: row.image_url || "/products/prod_sembako_001.svg",
        isFavorite: Boolean(row.is_favorite),
      }));

      return NextResponse.json({
        success: true,
        source: "supabase-cloud",
        total: mapped.length,
        data: mapped,
      });
    }
  } catch {}

  // In-memory fallback
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
    source: "local-memory",
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
      imageUrl: body.imageUrl || "/products/prod_sembako_001.svg",
      isFavorite: Boolean(body.isFavorite),
    };

    memoryProducts = [newProduct, ...memoryProducts];

    // Simpan juga ke Supabase jika terhubung
    try {
      const supabase = createServerSupabaseClient();
      await supabase.from("products").upsert({
        id: newProduct.id,
        sku: newProduct.sku,
        name: newProduct.name,
        category: newProduct.category,
        price: newProduct.price,
        cost_price: newProduct.costPrice,
        stock: newProduct.stock,
        min_stock_alert: newProduct.minStockAlert,
        unit: newProduct.unit,
        image_url: newProduct.imageUrl,
        is_favorite: newProduct.isFavorite,
        updated_at: new Date().toISOString(),
      });
    } catch {}

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
    if (idx !== -1) {
      memoryProducts[idx] = { ...memoryProducts[idx], ...updates };
    }

    // Update di Supabase
    try {
      const supabase = createServerSupabaseClient();
      const dbPayload: any = { updated_at: new Date().toISOString() };
      if (updates.name !== undefined) dbPayload.name = updates.name;
      if (updates.sku !== undefined) dbPayload.sku = updates.sku;
      if (updates.price !== undefined) dbPayload.price = updates.price;
      if (updates.costPrice !== undefined) dbPayload.cost_price = updates.costPrice;
      if (updates.stock !== undefined) dbPayload.stock = updates.stock;
      if (updates.category !== undefined) dbPayload.category = updates.category;
      if (updates.unit !== undefined) dbPayload.unit = updates.unit;
      if (updates.imageUrl !== undefined) dbPayload.image_url = updates.imageUrl;
      if (updates.isFavorite !== undefined) dbPayload.is_favorite = updates.isFavorite;

      await supabase.from("products").update(dbPayload).eq("id", id);
    } catch {}

    return NextResponse.json({
      success: true,
      message: "Data produk berhasil diperbarui.",
      data: idx !== -1 ? memoryProducts[idx] : body,
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

    try {
      const supabase = createServerSupabaseClient();
      await supabase.from("products").delete().eq("id", id);
    } catch {}

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
