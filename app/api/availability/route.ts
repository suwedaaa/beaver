import { NextResponse } from "next/server"
import { checkAvailability, type Booking } from "@/lib/celcat"

// CELCAT requires an authenticated session. From a server context, supply
// a session cookie via the CELCAT_COOKIE env var. Without it CELCAT returns
// an empty booking list — we expose that as `authenticated: false` so the UI
// can render "unknown" instead of trusting a false "available" result.
const CELCAT_COOKIE = process.env.CELCAT_COOKIE

interface Body {
  roomId?: string
  startDate?: string
  endDate?: string
  start?: string
  end?: string
}

function eachDateInclusive(startDate: string, endDate: string): string[] {
  const out: string[] = []
  const [sy, sm, sd] = startDate.split("-").map(Number)
  const [ey, em, ed] = endDate.split("-").map(Number)
  const cursor = new Date(Date.UTC(sy, sm - 1, sd))
  const stop = new Date(Date.UTC(ey, em - 1, ed))
  while (cursor.getTime() <= stop.getTime()) {
    const y = cursor.getUTCFullYear()
    const m = String(cursor.getUTCMonth() + 1).padStart(2, "0")
    const d = String(cursor.getUTCDate()).padStart(2, "0")
    out.push(`${y}-${m}-${d}`)
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return out
}

export async function POST(req: Request) {
  let body: Body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { roomId, startDate, endDate, start, end } = body

  if (!roomId || !startDate || !endDate || !start || !end) {
    return NextResponse.json(
      { error: "roomId, startDate, endDate, start, end are required" },
      { status: 400 }
    )
  }

  const dates = eachDateInclusive(startDate, endDate)
  const opts = CELCAT_COOKIE ? { cookie: CELCAT_COOKIE } : undefined

  try {
    const perDay = await Promise.all(
      dates.map((d) => checkAvailability(roomId, d, { start, end }, opts))
    )
    const bookings: Booking[] = perDay.flatMap((r) => r.bookings)
    const isAvailable = perDay.every((r) => r.isAvailable)
    return NextResponse.json({
      roomId,
      startDate,
      endDate,
      timeWindow: { start, end },
      isAvailable,
      bookings,
      authenticated: !!CELCAT_COOKIE,
      celcatUrl: perDay[0]?.celcatUrl,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
