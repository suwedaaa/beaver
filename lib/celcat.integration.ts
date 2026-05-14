/**
 * Live integration tests against CELCAT.
 * Run with: npm run test:integration
 *
 * These hit the real Imperial timetabling endpoint and assert shape only —
 * they do NOT assert specific bookings, so they survive timetable changes.
 */

import { checkAvailability } from "./celcat"

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg)
}

async function runIntegrationTests() {
  console.log("Running integration tests against live CELCAT...\n")

  const ROOM = "HXLY-01-138"
  const DATE = "2026-02-23"

  // T1: returns a well-formed result for a real room
  const t1 = await checkAvailability(ROOM, DATE, { start: "09:00", end: "11:00" })
  assert(typeof t1.isAvailable === "boolean", "T1: isAvailable should be boolean")
  assert(Array.isArray(t1.bookings), "T1: bookings should be an array")
  assert(t1.celcatUrl.includes(ROOM), "T1: celcatUrl should contain roomId")
  console.log("T1 passed: real room returns well-formed result")

  // T2: return shape is complete
  assert(typeof t1.roomId === "string", "T2: roomId not string")
  assert(typeof t1.date === "string", "T2: date not string")
  assert(typeof t1.timeWindow.start === "string", "T2: timeWindow.start missing")
  assert(typeof t1.timeWindow.end === "string", "T2: timeWindow.end missing")
  console.log("T2 passed: return shape is correct")

  // T3: unknown roomId is handled (CELCAT returns empty for unknown federationIds)
  const t3 = await checkAvailability("FAKE-ROOM-999", DATE, { start: "09:00", end: "11:00" })
  assert(Array.isArray(t3.bookings), "T3: bookings should be array for unknown room")
  assert(t3.isAvailable === true, "T3: unknown room should report available (no bookings)")
  console.log("T3 passed: unknown room handled gracefully")

  // T4: parallel calls across multiple rooms
  const rooms = ["HXLY-01-138", "HXLY-01-139", "HXLY-01-140"]
  const results = await Promise.all(
    rooms.map((r) => checkAvailability(r, DATE, { start: "09:00", end: "11:00" }))
  )
  assert(results.length === 3, "T4: should return 3 results")
  assert(
    results.every((r) => typeof r.isAvailable === "boolean"),
    "T4: every result should have a boolean isAvailable"
  )
  console.log("T4 passed: multiple rooms in parallel")
  console.log(
    "   Results:",
    results.map((r) => `${r.roomId}: ${r.isAvailable ? "free" : "busy"}`).join(", ")
  )

  console.log("\nAll integration tests passed.")
}

runIntegrationTests().catch((e) => {
  console.error("\nIntegration tests failed:", e instanceof Error ? e.message : e)
  process.exit(1)
})
