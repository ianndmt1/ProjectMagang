import { NextResponse } from "next/server";
import { getAppSettings } from "@/lib/settings";

export async function GET() {
  try {
    const settings = await getAppSettings();
    return NextResponse.json({ data: settings }, { status: 200 });
  } catch (error: any) {
    console.error("[/api/settings] Error fetching app settings:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}
