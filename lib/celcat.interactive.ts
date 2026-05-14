/**
 * Interactive CLI  mimics the Beaver frontend experience
 * Run with: npx tsx lib/celcat.interactive.ts
 */

import * as readline from "readline"
import { checkAvailability } from "./celcat"
import rooms from "../data/rooms.json"

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

const ask = (question: string): Promise<string> =>
  new Promise((resolve) => rl.question(question, resolve))

function searchRooms(query: string) {
  return rooms.filter(
    (r) =>
      r.roomName.toLowerCase().includes(query.toLowerCase()) ||
      r.department.toLowerCase().includes(query.toLowerCase()) ||
      r.type.toLowerCase().includes(query.toLowerCase())
  )
}

function printRoom(r: any, index: number) {
  console.log(`  ${index + 1}. ${r.roomName} — ${r.type} | ${r.department}`)
}

async function run() {
  console.clear()
  console.log("🦫 Beaver — Room Availability Checker")
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")

  while (true) {
    // Step 1: Search for a room
    const query = await ask("🔍 Search for a room (or 'quit' to exit): ")
    if (query.toLowerCase() === "quit") break

    const results = searchRooms(query)

    if (results.length === 0) {
      console.log("  ❌ No rooms found. Try again.\n")
      continue
    }

    console.log(`\n  Found ${results.length} rooms:\n`)
    results.slice(0, 10).forEach(printRoom)
    if (results.length > 10) console.log(`  ... and ${results.length - 10} more`)

    // Step 2: Pick a room
    const pick = await ask("\nEnter room number: ")
    const index = parseInt(pick) - 1
    if (isNaN(index) || index < 0 || index >= Math.min(results.length, 10)) {
      console.log("  ❌ Invalid selection.\n")
      continue
    }

    const selectedRoom = results[index]
    console.log(`\n  ✅ Selected: ${selectedRoom.roomName}`)

    // Step 3: Enter date
    const date = await ask("\n📅 Enter date (YYYY-MM-DD): ")

    // Step 4: Enter time window
    const start = await ask("⏰ Start time (HH:MM): ")
    const end = await ask("⏰ End time (HH:MM): ")

    // Step 5: Check availability
    console.log("\n  Checking availability...\n")

    try {
      const result = await checkAvailability(selectedRoom.roomId, date, {
        start,
        end,
      })

      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
      console.log(`  Room:       ${selectedRoom.roomName}`)
      console.log(`  Type:       ${selectedRoom.type}`)
      console.log(`  Department: ${selectedRoom.department}`)
      console.log(`  Date:       ${result.date}`)
      console.log(`  Time:       ${result.timeWindow.start} - ${result.timeWindow.end}`)
      console.log(
        `  Status:     ${result.isAvailable ? "✅ AVAILABLE" : "❌ UNAVAILABLE"}`
      )

      if (!result.isAvailable) {
        console.log(`\n  Conflicting bookings:`)
        result.bookings.forEach((b) => {
          const start = b.start.split("T")[1].slice(0, 5)
          const end = b.end.split("T")[1].slice(0, 5)
          console.log(`    • ${start}-${end} — ${b.eventCategory}`)
        })
      }

      console.log(`\n  🔗 CELCAT: ${result.celcatUrl}`)
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
    } catch (e: any) {
      console.log(`\n   Error: ${e.message}\n`)
    }
  }

  console.log("\nGoodbye! ")
  rl.close()
}

run().catch(console.error)
