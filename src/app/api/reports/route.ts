import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);

  return NextResponse.json({
    status: "queued",
    message:
      "Report ricevuto. In produzione questo endpoint genera e archivia il PDF professionale su Supabase Storage.",
    report: {
      title: payload?.projectName ?? "Launch Pilot Report",
      createdAt: new Date().toISOString(),
    },
  });
}
