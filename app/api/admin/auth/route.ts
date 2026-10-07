import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { passphrase } = await req.json();
  if (passphrase === process.env.ADMIN_ACCESS_PASSPHRASE) {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
