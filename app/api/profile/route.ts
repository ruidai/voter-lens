import { NextRequest, NextResponse } from "next/server";
import { createServer } from "@/utils/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ profile: null }, { status: 200 });
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("voter_stance, full_name, email")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      return NextResponse.json({ error: "Failed to fetch profile." }, { status: 500 });
    }

    return NextResponse.json({ profile });
  } catch (error: any) {
    console.error("Profile GET API Error:", error);
    return NextResponse.json(
      { error: "Failed to get profile: " + (error.message || error) },
      { status: 500 }
    );
  }
}
