import { describe, it, expect, vi, beforeEach } from "vitest"
import { checkAvailability, getOverlappingBookings } from "./celcat"
import type { Booking, TimeWindow } from "./celcat"

// ---- helpers ----
const makeBooking = (start: string, end: string): Booking => ({
  start: `2026-03-27T${start}:00`,
  end: `2026-03-27T${end}:00`,
  description: "Test booking",
  eventCategory: "T - Academic",
  department: "CO Department of Computing",
})

// ---- getOverlappingBookings (pure function - no mocking needed) ----
describe("getOverlappingBookings", () => {
  const window: TimeWindow = { start: "10:00", end: "12:00" }

  it("returns empty array when no bookings", () => {
    expect(getOverlappingBookings([], window)).toEqual([])
  })

  it("detects a booking that fully overlaps the window", () => {
    const bookings = [makeBooking("09:00", "13:00")]
    expect(getOverlappingBookings(bookings, window)).toHaveLength(1)
  })

  it("detects a booking that partially overlaps at the start", () => {
    const bookings = [makeBooking("09:00", "11:00")]
    expect(getOverlappingBookings(bookings, window)).toHaveLength(1)
  })

  it("detects a booking that partially overlaps at the end", () => {
    const bookings = [makeBooking("11:00", "13:00")]
    expect(getOverlappingBookings(bookings, window)).toHaveLength(1)
  })

  it("ignores a booking that ends exactly when the window starts", () => {
    const bookings = [makeBooking("08:00", "10:00")]
    expect(getOverlappingBookings(bookings, window)).toHaveLength(0)
  })

  it("ignores a booking that starts exactly when the window ends", () => {
    const bookings = [makeBooking("12:00", "13:00")]
    expect(getOverlappingBookings(bookings, window)).toHaveLength(0)
  })

  it("ignores a booking completely outside the window", () => {
    const bookings = [makeBooking("13:00", "14:00")]
    expect(getOverlappingBookings(bookings, window)).toHaveLength(0)
  })

  it("handles multiple bookings, some overlapping some not", () => {
    const bookings = [
      makeBooking("08:00", "09:00"), // before - no overlap
      makeBooking("09:00", "11:00"), // overlaps
      makeBooking("11:30", "12:30"), // overlaps
      makeBooking("13:00", "14:00"), // after - no overlap
    ]
    expect(getOverlappingBookings(bookings, window)).toHaveLength(2)
  })
})

// ---- checkAvailability (mocked fetch) ----
describe("checkAvailability", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("returns isAvailable=true when no bookings", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    }))

    const result = await checkAvailability("HXLY-01-138", "2026-03-27", {
      start: "10:00",
      end: "12:00",
    })

    expect(result.isAvailable).toBe(true)
    expect(result.bookings).toHaveLength(0)
  })

  it("returns isAvailable=false when room is booked", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [makeBooking("10:00", "12:00")],
    }))

    const result = await checkAvailability("HXLY-01-138", "2026-03-27", {
      start: "10:00",
      end: "12:00",
    })

    expect(result.isAvailable).toBe(false)
    expect(result.bookings).toHaveLength(1)
  })

  it("returns correct celcatUrl", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    }))

    const result = await checkAvailability("HXLY-01-138", "2026-03-27", {
      start: "10:00",
      end: "12:00",
    })

    expect(result.celcatUrl).toContain("HXLY-01-138")
    expect(result.celcatUrl).toContain("2026-03-27")
  })

  it("throws when CELCAT returns an error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    }))

    await expect(
      checkAvailability("HXLY-01-138", "2026-03-27", { start: "10:00", end: "12:00" })
    ).rejects.toThrow("CELCAT error: 500")
  })

  it("throws on invalid date format", async () => {
  await expect(
    checkAvailability("HXLY-01-138", "27-03-2026", { start: "09:00", end: "11:00" })
  ).rejects.toThrow("Invalid date format")
})

it("throws on invalid time format", async () => {
  await expect(
    checkAvailability("HXLY-01-138", "2026-03-27", { start: "9am", end: "11am" })
  ).rejects.toThrow("Invalid time format")
})

it("throws when start is after end", async () => {
  await expect(
    checkAvailability("HXLY-01-138", "2026-03-27", { start: "14:00", end: "09:00" })
  ).rejects.toThrow("timeWindow.start must be before timeWindow.end")
})

it("throws when start equals end", async () => {
  await expect(
    checkAvailability("HXLY-01-138", "2026-03-27", { start: "09:00", end: "09:00" })
  ).rejects.toThrow("timeWindow.start must be before timeWindow.end")
})
})
