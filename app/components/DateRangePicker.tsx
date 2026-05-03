"use client";

import { useState, useRef, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DateRange {
  from: Date | null;
  to: Date | null;
}

interface Props {
  value: DateRange;
  onChange: (r: DateRange) => void;
  hasError?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DOW = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}
function fmtShort(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DateRangePicker({ value, onChange, hasError }: Props) {
  const today = startOfDay(new Date());
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [hovered, setHovered] = useState<Date | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  // ── Calendar grid ──────────────────────────────────────────────────────────

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDow = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7; // 0 = Mon

  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(viewYear, viewMonth, d));

  // ── Navigation ─────────────────────────────────────────────────────────────

  const canGoPrev =
    viewYear > today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth > today.getMonth());

  function prevMonth() {
    if (!canGoPrev) return;
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  // ── Day click ──────────────────────────────────────────────────────────────

  function handleDayClick(raw: Date) {
    const d = startOfDay(raw);
    if (d < today) return;

    // No start yet, or both already set → start fresh
    if (!value.from || (value.from && value.to)) {
      onChange({ from: d, to: null });
      return;
    }

    // Have start, no end yet
    if (d < value.from) {
      // Clicked before start → restart selection
      onChange({ from: d, to: null });
    } else if (sameDay(d, value.from)) {
      // Same day → single-day range
      onChange({ from: d, to: d });
      setOpen(false);
    } else {
      // Valid end date
      onChange({ from: value.from, to: d });
      setOpen(false);
    }
  }

  // ── Day state helpers ──────────────────────────────────────────────────────

  function isPast(d: Date) { return startOfDay(d) < today; }
  function isStart(d: Date) { return !!value.from && sameDay(d, value.from); }
  function isEnd(d: Date) { return !!value.to && sameDay(d, value.to); }
  function isToday(d: Date) { return sameDay(d, today); }
  function isInRange(d: Date): boolean {
    const anchor = value.to || hovered;
    if (!value.from || !anchor) return false;
    const from = startOfDay(value.from);
    const to = startOfDay(anchor);
    const sd = startOfDay(d);
    const [lo, hi] = from <= to ? [from, to] : [to, from];
    return sd > lo && sd < hi;
  }

  // ── Trigger label ──────────────────────────────────────────────────────────

  function displayLabel(): string {
    if (!value.from) return "";
    if (!value.to || sameDay(value.from, value.to)) return fmtShort(value.from);
    return `${fmtShort(value.from)} – ${fmtShort(value.to)}`;
  }

  // ── Day cell class ─────────────────────────────────────────────────────────

  function dayClass(day: Date): string {
    let cls = "drp-day";
    if (isPast(day)) return cls + " drp-past";
    if (isStart(day) || isEnd(day)) return cls + " drp-selected";
    if (isInRange(day)) return cls + " drp-in-range";
    if (isToday(day)) return cls + " drp-today";
    return cls + " drp-normal";
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ position: "relative" }} ref={wrapRef}>
      {/* Trigger button */}
      <button
        id="date-range-trigger"
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`drp-trigger${hasError ? " drp-trigger-error" : ""}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Open date range picker"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <span style={{ color: value.from ? "#2c1f14" : "#9c8b7e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {value.from ? displayLabel() : "Select date range"}
        </span>
      </button>

      {/* Calendar dropdown */}
      {open && (
        <div className="drp-calendar" role="dialog" aria-label="Date range picker">

          {/* Month nav header */}
          <div className="drp-header">
            <button type="button" onClick={prevMonth} disabled={!canGoPrev}
              className="drp-nav-btn" aria-label="Previous month">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span className="drp-month-label">{MONTHS[viewMonth]} {viewYear}</span>
            <button type="button" onClick={nextMonth}
              className="drp-nav-btn" aria-label="Next month">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          {/* Day-of-week labels */}
          <div className="drp-grid">
            {DOW.map(d => (
              <div key={d} className="drp-dow">{d}</div>
            ))}

            {/* Day cells */}
            {cells.map((day, i) => {
              if (!day) return <div key={`e-${i}`} />;
              const past = isPast(day);
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  className={dayClass(day)}
                  onClick={() => handleDayClick(day)}
                  onMouseEnter={() => { if (!past && value.from && !value.to) setHovered(day); }}
                  onMouseLeave={() => setHovered(null)}
                  disabled={past}
                  aria-label={day.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                  aria-pressed={isStart(day) || isEnd(day)}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          {/* Footer: hint + clear */}
          <div className="drp-footer">
            <span className="drp-hint">
              {!value.from
                ? "Click a start date"
                : !value.to
                  ? "Now click an end date"
                  : displayLabel()}
            </span>
            {value.from && (
              <button type="button" className="drp-clear"
                onClick={() => onChange({ from: null, to: null })}>
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Styles scoped to this component */}
      <style>{`
        .drp-trigger {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 8px;
          background: #faf7f4;
          border: 1px solid #ccc5bb;
          border-radius: 8px;
          padding: 0.55rem 0.85rem;
          font-size: 0.85rem;
          color: #4a3728;
          font-family: inherit;
          cursor: pointer;
          text-align: left;
          transition: border-color 0.15s, box-shadow 0.15s;
          min-height: 36px;
        }
        .drp-trigger:hover,
        .drp-trigger:focus {
          border-color: #8a6a52;
          box-shadow: 0 0 0 3px rgba(138,106,82,0.15);
          outline: none;
        }
        .drp-trigger-error {
          border-color: #b85c38 !important;
          box-shadow: 0 0 0 3px rgba(184,92,56,0.15) !important;
        }

        /* ── Dropdown ───────────────────────────────────────── */
        .drp-calendar {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          z-index: 300;
          background: #faf7f4;
          border: 1px solid #d4ccc4;
          border-radius: 14px;
          padding: 1rem 1rem 0.75rem;
          box-shadow: 0 10px 30px rgba(60,40,20,0.18);
          min-width: 292px;
          animation: drpFadeIn 0.15s ease;
        }
        @keyframes drpFadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Header ─────────────────────────────────────────── */
        .drp-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.6rem;
        }
        .drp-month-label {
          font-size: 0.9rem;
          font-weight: 700;
          color: #2c1f14;
        }
        .drp-nav-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #6b5c4e;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 6px;
          transition: background 0.15s, color 0.15s;
          padding: 0;
        }
        .drp-nav-btn:hover:not(:disabled) {
          background: #e8dfd6;
          color: #3d2d20;
        }
        .drp-nav-btn:disabled {
          opacity: 0.25;
          cursor: not-allowed;
        }

        /* ── Grid ───────────────────────────────────────────── */
        .drp-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 2px;
        }
        .drp-dow {
          font-size: 0.68rem;
          font-weight: 700;
          color: #9c8b7e;
          text-align: center;
          padding: 3px 0 5px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        /* ── Day buttons ────────────────────────────────────── */
        .drp-day {
          aspect-ratio: 1;
          border: none;
          border-radius: 7px;
          font-size: 0.82rem;
          font-family: inherit;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          transition: background 0.1s, color 0.1s;
        }
        .drp-past {
          color: #c5bdb5;
          background: transparent;
          cursor: not-allowed;
        }
        .drp-normal {
          color: #2c1f14;
          background: transparent;
        }
        .drp-normal:hover {
          background: #e8dfd6;
        }
        .drp-today {
          color: #8a6a52;
          background: transparent;
          font-weight: 700;
        }
        .drp-today:hover {
          background: #e8dfd6;
        }
        .drp-selected {
          background: #3d2d20 !important;
          color: #f5ede6 !important;
          font-weight: 700;
          border-radius: 7px !important;
        }
        .drp-in-range {
          background: #d9cfc6;
          color: #2c1f14;
          border-radius: 0;
        }

        /* ── Footer ─────────────────────────────────────────── */
        .drp-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          margin-top: 0.65rem;
          padding-top: 0.65rem;
          border-top: 1px solid #e0d8d0;
        }
        .drp-hint {
          font-size: 0.75rem;
          color: #6b5c4e;
          font-style: italic;
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .drp-clear {
          background: none;
          border: 1px solid #bab0a6;
          border-radius: 6px;
          padding: 3px 10px;
          font-size: 0.75rem;
          color: #6b5c4e;
          font-family: inherit;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.15s, border-color 0.15s;
          flex-shrink: 0;
        }
        .drp-clear:hover {
          background: #e0d8d0;
          border-color: #9c8b7e;
        }
      `}</style>
    </div>
  );
}
