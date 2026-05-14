/**
 * Terminal frontend for testing checkAvailability
 * Run with: npx tsx lib/celcat.cli.ts
 */

import { checkAvailability } from "./celcat"

const TEST_CASES = [
  {
    label: "HXLY 138 — busy slot (Feb 23, 09:00-11:00)",
    roomId: "HXLY-01-138",
    date: "2026-02-23",
    timeWindow: { start: "09:00", end: "11:00" },
    expect: false,
  },
  {
    label: "HXLY 138 — free slot (Feb 23, 07:00-09:00)",
    roomId: "HXLY-01-138",
    date: "2026-02-23",
    timeWindow: { start: "07:00", end: "09:00" },
    expect: true,
  },
  {
    label: "HXLY 138 — full day (Feb 23)",
    roomId: "HXLY-01-138",
    date: "2026-02-23",
    timeWindow: { start: "07:00", end: "23:00" },
    expect: false,
  },
  {
    label: "HXLY 139 — busy slot (Feb 23, 09:00-11:00)",
    roomId: "HXLY-01-139",
    date: "2026-02-23",
    timeWindow: { start: "09:00", end: "11:00" },
    expect: false,
  },
  {
    label: "Sunday — should be free",
    roomId: "HXLY-01-138",
    date: "2026-02-22",
    timeWindow: { start: "09:00", end: "17:00" },
    expect: true,
  },
]

const VALIDATION_CASES = [
  {
    label: "Invalid date format",
    roomId: "HXLY-01-138",
    date: "27-03-2026",
    timeWindow: { start: "09:00", end: "11:00" },
    expectError: "Invalid date format",
  },
  {
    label: "Invalid time format",
    roomId: "HXLY-01-138",
    date: "2026-03-27",
    timeWindow: { start: "9am", end: "11am" },
    expectError: "Invalid time format",
  },
  {
    label: "Start after end",
    roomId: "HXLY-01-138",
    date: "2026-03-27",
    timeWindow: { start: "14:00", end: "09:00" },
    expectError: "timeWindow.start must be before timeWindow.end",
  },
]

async function run() {
  console.log("🦫 Beaver — checkAvailability integration test\n")

  let passed = 0
  let failed = 0

  // Integration tests
  console.log("━━━ Integration Tests (live CELCAT API) ━━━\n")
  for (const tc of TEST_CASES) {
    try {
      const result = await checkAvailability(tc.roomId, tc.date, tc.timeWindow)
      const correct = result.isAvailable === tc.expect

      if (correct) {
        console.log(`✅ ${tc.label}`)
        console.log(`   isAvailable: ${result.isAvailable} | bookings: ${result.bookings.length}`)
        passed++
      } else {
        console.log(`❌ ${tc.label}`)
        console.log(`   Expected: ${tc.expect} | Got: ${result.isAvailable}`)
        failed++
      }
    } catch (e: any) {
      console.log(`❌ ${tc.label} — threw unexpectedly: ${e.message}`)
      failed++
    }
    console.log()
  }

  // Validation tests
  console.log("━━━ Validation Tests ━━━\n")
  for (const tc of VALIDATION_CASES) {
    try {
      await checkAvailability(tc.roomId, tc.date, tc.timeWindow)
      console.log(`❌ ${tc.label} — should have thrown but didn't`)
      failed++
    } catch (e: any) {
      if (e.message.includes(tc.expectError)) {
        console.log(`✅ ${tc.label}`)
        console.log(`   Threw: "${e.message}"`)
        passed++
      } else {
        console.log(`❌ ${tc.label} — wrong error: "${e.message}"`)
        failed++
      }
    }
    console.log()
  }

  // Summary
  console.log("━━━ Summary ━━━")
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`Total: ${passed + failed}`)

  if (failed === 0) {
    console.log("\n🎉 All tests passed!")
  } else {
    console.log("\n⚠️  Some tests failed — check output above")
    process.exit(1)
  }
}

run().catch(console.error)
