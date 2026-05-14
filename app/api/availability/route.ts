import { NextResponse } from "next/server"
import { checkAvailability } from "@/lib/celcat"

// CELCAT requires an authenticated session. From a server context, supply
// a session cookie via the CELCAT_COOKIE env var. Without it CELCAT typically
// returns an empty booking list — the UI treats that as "available" and notes
// the caveat to the user.
const CELCAT_COOKIE = process.env.CELCAT_COOKIE

export async function POST(req: Request) {
  let body: { roomId?: string; date?: string; start?: string; end?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { roomId, date, start, end } = body
  if (!roomId || !date || !start || !end) {
    return NextResponse.json(
      { error: "roomId, date, start, end are required" },
      { status: 400 }
    )
  }

  try {
    const result = await checkAvailability(
      roomId,
      date,
      { start, end },
      CELCAT_COOKIE ? { cookie: CELCAT_COOKIE } : undefined
    )
    return NextResponse.json(result)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
