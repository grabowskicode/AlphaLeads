// src/app/api/logs/route.ts
import { NextResponse } from "next/server";
import { getLogs, clearLogs } from "@/lib/logger";

export async function GET() {
  return NextResponse.json({ logs: getLogs() });
}

export async function DELETE() {
  clearLogs();
  return NextResponse.json({ success: true });
}
