/**
 * One-shot scraper that refreshes data/rooms.json with canonical metadata
 * from CELCAT's sidebar endpoint.
 *
 * Run with: npx tsx lib/scrape-rooms.ts
 *
 * Drops rooms CELCAT marks as "Non Physical Room" (placeholders like
 * "Non-Standard Room", "Room to be confirmed", offsite locations).
 */

import { readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"

const ROOMS_PATH = join(process.cwd(), "data", "rooms.json")
const ENDPOINT = "https://www.imperial.ac.uk/timetabling/calendar/Home/GetSideBarResources"
const BATCH_SIZE = 200
const RES_TYPE_ROOM = "102"
const DROPPED_TYPE = "Non Physical Room"

interface RawRoom {
  roomId: string
  roomName: string
  type: string
  department: string
  celcatUrl: string
}

interface SidebarElement {
  label: string
  content: string
}

interface SidebarItem {
  federationId: string
  elements: SidebarElement[]
}

interface SidebarResponse {
  items: SidebarItem[]
}

function elementsByLabel(item: SidebarItem): Record<string, string> {
  const out: Record<string, string> = {}
  for (const el of item.elements) {
    // The room name has label="" — preserve it under "Name".
    out[el.label || "Name"] = el.content
  }
  return out
}

async function fetchBatch(ids: string[]): Promise<SidebarItem[]> {
  const body = new URLSearchParams()
  body.set("resType", RES_TYPE_ROOM)
  for (const id of ids) body.append("federationIds[]", id)

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      "x-requested-with": "XMLHttpRequest",
    },
    body: body.toString(),
  })
  if (!res.ok) throw new Error(`CELCAT ${res.status} for batch of ${ids.length}`)
  const data: SidebarResponse = await res.json()
  return data.items
}

async function run() {
  const original: RawRoom[] = JSON.parse(await readFile(ROOMS_PATH, "utf-8"))
  console.log(`Loaded ${original.length} rooms from data/rooms.json`)

  const allItems: SidebarItem[] = []
  for (let i = 0; i < original.length; i += BATCH_SIZE) {
    const slice = original.slice(i, i + BATCH_SIZE)
    const items = await fetchBatch(slice.map((r) => r.roomId))
    allItems.push(...items)
    process.stdout.write(`  batch ${i / BATCH_SIZE + 1}: ${items.length} returned (running total ${allItems.length})\n`)
  }

  const byId = new Map(allItems.map((it) => [it.federationId, elementsByLabel(it)]))

  let updatedType = 0
  let updatedDept = 0
  let dropped = 0
  let missing = 0
  const out: RawRoom[] = []

  for (const room of original) {
    const info = byId.get(room.roomId)
    if (!info) {
      missing++
      out.push(room) // keep as-is when CELCAT returns nothing
      continue
    }
    const newType = info["Room Type"] ?? room.type
    const newDept = info["Department"] ?? room.department

    if (newType === DROPPED_TYPE) {
      dropped++
      continue
    }
    if (newType !== room.type) updatedType++
    if (newDept !== room.department) updatedDept++

    out.push({
      ...room,
      type: newType,
      department: newDept,
    })
  }

  // Stable order: by department then roomName, matching the existing file feel.
  out.sort((a, b) => {
    if (a.department !== b.department) return a.department.localeCompare(b.department)
    return a.roomName.localeCompare(b.roomName)
  })

  await writeFile(ROOMS_PATH, JSON.stringify(out, null, 2) + "\n", "utf-8")

  console.log()
  console.log("---- summary ----")
  console.log(`  rooms in source       : ${original.length}`)
  console.log(`  CELCAT returned       : ${allItems.length}`)
  console.log(`  not returned by API   : ${missing}`)
  console.log(`  dropped (Non Physical): ${dropped}`)
  console.log(`  type changed          : ${updatedType}`)
  console.log(`  department changed    : ${updatedDept}`)
  console.log(`  rooms in output       : ${out.length}`)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
