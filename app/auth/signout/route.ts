import { NextResponse } from "next/server";
import { createServer } from "@/utils/supabase/server";

export async function POST(request: Request) {
  const supabase = await createServer();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/", request.url), {
    status: 302,
  });
}
