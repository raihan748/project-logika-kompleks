import { NextResponse } from "next/server";
import { CustomerMember } from "../../../lib/types/pos";
import { createServerSupabaseClient } from "../../../lib/supabase/server";
import { INITIAL_SAMPLE_MEMBERS } from "../../../lib/data/sample-members";

let memoryMembers: CustomerMember[] = [...INITIAL_SAMPLE_MEMBERS];

export async function GET() {
  const supabase = createServerSupabaseClient();

  try {
    const { data: dbMembers, error } = await supabase
      .from("customer_members")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && dbMembers && dbMembers.length > 0) {
      const mapped: CustomerMember[] = dbMembers.map((row) => ({
        id: row.id,
        memberCode: row.member_code,
        name: row.name,
        phone: row.phone,
        email: row.email || undefined,
        tier: row.tier,
        membershipType: row.membership_type,
        points: Number(row.points || 0),
        totalSpent: Number(row.total_spent || 0),
        totalVisits: Number(row.total_visits || 0),
        discountPercent: Number(row.discount_percent || 0),
        createdAt: row.created_at,
        notes: row.notes || undefined,
      }));

      return NextResponse.json({
        success: true,
        source: "supabase-cloud",
        total: mapped.length,
        data: mapped,
      });
    }
  } catch {}

  return NextResponse.json({
    success: true,
    source: "local-memory",
    total: memoryMembers.length,
    data: memoryMembers,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      memberCode,
      name,
      phone,
      email,
      tier,
      membershipType,
      points,
      totalSpent,
      totalVisits,
      discountPercent,
      notes,
    } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { success: false, error: "Nama dan nomor telepon wajib diisi." },
        { status: 400 }
      );
    }

    const newMember: CustomerMember = {
      id: id || `mbr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      memberCode: memberCode || `MBR-${Math.floor(1000 + Math.random() * 9000)}`,
      name: name.trim(),
      phone: phone.trim(),
      email: email?.trim() || undefined,
      tier: tier || "REGULAR",
      membershipType: membershipType || "POINT",
      points: Number(points) || 0,
      totalSpent: Number(totalSpent) || 0,
      totalVisits: Number(totalVisits) || 0,
      discountPercent: Number(discountPercent) || 0,
      createdAt: new Date().toISOString(),
      notes: notes?.trim() || undefined,
    };

    memoryMembers = [newMember, ...memoryMembers];

    // Simpan ke Supabase Cloud
    try {
      const supabase = createServerSupabaseClient();
      await supabase.from("customer_members").upsert({
        id: newMember.id,
        member_code: newMember.memberCode,
        name: newMember.name,
        phone: newMember.phone,
        email: newMember.email || null,
        tier: newMember.tier,
        membership_type: newMember.membershipType,
        points: newMember.points,
        total_spent: newMember.totalSpent,
        total_visits: newMember.totalVisits,
        discount_percent: newMember.discountPercent,
        notes: newMember.notes || null,
        created_at: newMember.createdAt,
        updated_at: new Date().toISOString(),
      });
    } catch {}

    return NextResponse.json({
      success: true,
      message: "Member berhasil didaftarkan.",
      data: newMember,
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
    const { id, pointsDelta, spentDelta, visitsDelta, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "ID member diperlukan." }, { status: 400 });
    }

    const memberIdx = memoryMembers.findIndex((m) => m.id === id);
    if (memberIdx >= 0) {
      const current = memoryMembers[memberIdx];
      const updated: CustomerMember = {
        ...current,
        ...updates,
        points: pointsDelta !== undefined ? Math.max(0, current.points + pointsDelta) : (updates.points ?? current.points),
        totalSpent: spentDelta !== undefined ? current.totalSpent + spentDelta : (updates.totalSpent ?? current.totalSpent),
        totalVisits: visitsDelta !== undefined ? current.totalVisits + visitsDelta : (updates.totalVisits ?? current.totalVisits),
      };
      memoryMembers[memberIdx] = updated;
    }

    // Update di Supabase
    try {
      const supabase = createServerSupabaseClient();

      if (pointsDelta !== undefined || spentDelta !== undefined || visitsDelta !== undefined) {
        // Fetch current from db first
        const { data: dbCurrent } = await supabase
          .from("customer_members")
          .select("*")
          .eq("id", id)
          .single();

        if (dbCurrent) {
          await supabase
            .from("customer_members")
            .update({
              points: Math.max(0, Number(dbCurrent.points || 0) + (pointsDelta || 0)),
              total_spent: Number(dbCurrent.total_spent || 0) + (spentDelta || 0),
              total_visits: Number(dbCurrent.total_visits || 0) + (visitsDelta || 0),
              updated_at: new Date().toISOString(),
            })
            .eq("id", id);
        }
      } else {
        const payload: Record<string, any> = { updated_at: new Date().toISOString() };
        if (updates.name) payload.name = updates.name;
        if (updates.phone) payload.phone = updates.phone;
        if (updates.email !== undefined) payload.email = updates.email || null;
        if (updates.tier) payload.tier = updates.tier;
        if (updates.membershipType) payload.membership_type = updates.membershipType;
        if (updates.points !== undefined) payload.points = updates.points;
        if (updates.discountPercent !== undefined) payload.discount_percent = updates.discountPercent;
        if (updates.notes !== undefined) payload.notes = updates.notes || null;

        await supabase.from("customer_members").update(payload).eq("id", id);
      }
    } catch {}

    return NextResponse.json({ success: true, message: "Member berhasil diperbarui." });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ success: false, error: "ID member diperlukan." }, { status: 400 });
  }

  memoryMembers = memoryMembers.filter((m) => m.id !== id);

  try {
    const supabase = createServerSupabaseClient();
    await supabase.from("customer_members").delete().eq("id", id);
  } catch {}

  return NextResponse.json({ success: true, message: "Member berhasil dihapus." });
}
