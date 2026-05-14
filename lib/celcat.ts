// CELCAT API helpers.
// Auth: relies on an active CELCAT session cookie being forwarded with the request.
// Invalid roomIds return an empty bookings array (not an error) — validate against rooms.json upstream.

export interface Booking {
  start: string
  end: string
  description: string
  eventCategory: string
  department: string
}

export interface TimeWindow {
  start: string  // "HH:MM"
  end: string    // "HH:MM"
}

export interface AvailabilityResult {
  roomId: string
  date: string
  timeWindow: TimeWindow
  isAvailable: boolean
  bookings: Booking[]
  celcatUrl: string
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

export function getOverlappingBookings(
  bookings: Booking[],
  timeWindow: TimeWindow
): Booking[] {
  const windowStart = timeToMinutes(timeWindow.start)
  const windowEnd = timeToMinutes(timeWindow.end)

  return bookings.filter((b) => {
    const bookingStart = timeToMinutes(b.start.split("T")[1].slice(0, 5))
    const bookingEnd = timeToMinutes(b.end.split("T")[1].slice(0, 5))
    return bookingStart < windowEnd && bookingEnd > windowStart
  })
}

export interface CheckAvailabilityOptions {
  // Server-side callers can forward an Imperial session cookie here.
  // From the browser, omit this — `credentials: "include"` carries cookies automatically.
  cookie?: string
}

export async function checkAvailability(
  roomId: string,
  date: string,
  timeWindow: TimeWindow,
  options?: CheckAvailabilityOptions
): Promise<AvailabilityResult> {


//input validation for edge cases (this prevents us getting wrong results)

 if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    throw new Error(`Invalid date format "${date}" — expected YYYY-MM-DD`)
  }

  const timeRegex = /^\d{2}:\d{2}$/
  if (!timeRegex.test(timeWindow.start) || !timeRegex.test(timeWindow.end)) {
    throw new Error(`Invalid time format — expected HH:MM`)
  }

  if (timeWindow.start >= timeWindow.end) {
    throw new Error(`timeWindow.start must be before timeWindow.end`)
  }


  const body = new URLSearchParams({
    start: date,
    end: date,
    resType: "102",
    calView: "agendaDay",
    "federationIds[]": roomId,
    colourScheme: "3",
  })

  const headers: Record<string, string> = {
    "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
    accept: "application/json, text/javascript, */*; q=0.01",
    "x-requested-with": "XMLHttpRequest",
  }
  if (options?.cookie) headers.cookie = options.cookie

  const res = await fetch(
    "https://www.imperial.ac.uk/timetabling/calendar/Home/GetCalendarData",
    {
      method: "POST",
      headers,
      body: body.toString(),
      credentials: "include",
    }
  )

  if (!res.ok) throw new Error(`CELCAT error: ${res.status}`)

  const bookings: Booking[] = await res.json()
  const overlapping = getOverlappingBookings(bookings, timeWindow)

  return {
    roomId,
    date,
    timeWindow,
    isAvailable: overlapping.length === 0,
    bookings: overlapping,
    celcatUrl: `https://www.imperial.ac.uk/timetabling/calendar/cal?vt=agendaDay&dt=${date}&et=room&fid0=${encodeURIComponent(roomId)}`,
  }
}
