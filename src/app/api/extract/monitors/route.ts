import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("monitors")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ monitors: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { keyword, location } = await req.json();
    const userId = session.user.id;

    if (!keyword || !location) {
      return NextResponse.json(
        { error: "Keyword and Location are required" },
        { status: 400 },
      );
    }

    // 1. LIMIT CHECK: Enforce the "Max 6" Rule
    const { count, error: countError } = await supabase
      .from("monitors")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (countError) throw countError;

    // CTO NOTE: Limit increased to 6 as requested
    if (count !== null && count >= 6) {
      return NextResponse.json(
        {
          error:
            "Limit Reached: You can only have 6 active monitors. Delete one to add another.",
        },
        { status: 403 },
      );
    }

    // 2. INSERT: Default status is now "paused" (READY state)
    // The user must manually click 'Start' to spend credits.
    const { data, error } = await supabase
      .from("monitors")
      .insert({
        user_id: userId,
        keyword,
        location,
        status: "paused", // <--- FORCE PAUSED STATE
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          {
            error:
              "Duplicate: You are already monitoring this keyword in this location.",
          },
          { status: 409 },
        );
      }
      throw error;
    }

    return NextResponse.json({ monitor: data });
  } catch (error: any) {
    console.error("Monitor Add Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing Monitor ID" },
        { status: 400 },
      );
    }

    const { error } = await supabase
      .from("monitors")
      .delete()
      .eq("id", id)
      .eq("user_id", session.user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
