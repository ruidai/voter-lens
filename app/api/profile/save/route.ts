import { NextRequest, NextResponse } from "next/server";
import { createServer } from "@/utils/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = createServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { stance } = await req.json();

    if (!stance) {
      return NextResponse.json({ error: "Stance is required." }, { status: 400 });
    }

    // Update the profile with the new stance
    const { error } = await supabase
      .from("profiles")
      .update({
        voter_stance: stance,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      console.error("Error saving profile to database:", error);
      return NextResponse.json({ error: "Failed to save profile." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Profile Save API Error:", error);
    return NextResponse.json(
      { error: "Failed to save profile: " + (error.message || error) },
      { status: 500 }
    );
  }
}
