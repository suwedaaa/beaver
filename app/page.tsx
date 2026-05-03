"use client";

import { useState } from "react";
import DateRangePicker, { DateRange } from "./components/DateRangePicker";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Room {
  id: string;
  name: string;
  department: string;
  type: string;
  hasCamera?: boolean;
  hasEllipsis?: boolean;
}

// ─── Static Data ─────────────────────────────────────────────────────────────

const ALL_TIMES = [
  "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00",
];

const DEPARTMENTS = [
  "Computing",
  "Life Sciences",
  "Physics",
  "Mathematics",
  "Chemistry",
  "Electrical Engineering",
  "Mechanical Engineering",
];

const ROOM_TYPES = [
  "Lecture Theatre",
  "Seminar Room",
  "Lab",
  "Meeting Room",
  "Study Space",
];

const SAMPLE_ROOMS: Room[] = [
  { id: "hxly138", name: "HXLY 138", department: "Computing", type: "Lecture Theatre", hasCamera: true },
  { id: "safbg61", name: "SAFB G61", department: "Life Sciences", type: "Seminar Room", hasEllipsis: true },
  { id: "blkt122", name: "BLKT 122 – Lecture Theatre 3", department: "Physics", type: "Lecture Theatre" },
];

// ─── Validation ───────────────────────────────────────────────────────────────

interface ValidationErrors {
  dateRange?: string;
  timeWindow?: string;
}

function validate(
  dateRange: DateRange,
  startTime: string,
  endTime: string
): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!dateRange.from) {
    errors.dateRange = "Date Range is required to search.";
    return errors;
  }

  // Time order check — only when both are selected
  if (startTime && endTime) {
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    if (sh * 60 + sm >= eh * 60 + em) {
      errors.timeWindow = "End time must be after start time.";
    }
  }

  return errors;
}

// ─── Beaver SVG Icon ──────────────────────────────────────────────────────────

function BeaverIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width="34"
      height="34"
      aria-label="STEMM Beaver logo"
    >
      {/* Body */}
      <ellipse cx="32" cy="36" rx="18" ry="16" fill="#c8956c" />
      {/* Head */}
      <ellipse cx="32" cy="20" rx="13" ry="12" fill="#c8956c" />
      {/* Ears */}
      <ellipse cx="20" cy="12" rx="5" ry="6" fill="#a0704a" />
      <ellipse cx="44" cy="12" rx="5" ry="6" fill="#a0704a" />
      <ellipse cx="20" cy="12" rx="3" ry="4" fill="#c8956c" />
      <ellipse cx="44" cy="12" rx="3" ry="4" fill="#c8956c" />
      {/* Eyes */}
      <circle cx="26" cy="18" r="3" fill="#3d2d20" />
      <circle cx="38" cy="18" r="3" fill="#3d2d20" />
      <circle cx="27" cy="17" r="1" fill="white" />
      <circle cx="39" cy="17" r="1" fill="white" />
      {/* Nose */}
      <ellipse cx="32" cy="23" rx="3" ry="2" fill="#a0704a" />
      {/* Teeth */}
      <rect x="29" y="25" width="3" height="4" rx="1" fill="white" />
      <rect x="33" y="25" width="3" height="4" rx="1" fill="white" />
      {/* Tail */}
      <ellipse cx="32" cy="55" rx="12" ry="6" fill="#a0704a" />
      <line x1="20" y1="55" x2="44" y2="55" stroke="#8a5c35" strokeWidth="1" />
      <line x1="22" y1="52" x2="42" y2="52" stroke="#8a5c35" strokeWidth="1" />
      <line x1="22" y1="58" x2="42" y2="58" stroke="#8a5c35" strokeWidth="1" />
    </svg>
  );
}

// ─── Camera Icon ─────────────────────────────────────────────────────────────

function CameraIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "inline", verticalAlign: "middle", marginLeft: "6px", color: "#6b5c4e" }}
      aria-label="Has camera"
    >
      <path d="M23 7l-7 5 7 5V7z" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  );
}

// ─── Select Component ─────────────────────────────────────────────────────────

interface SelectProps {
  id: string;
  placeholder: string;
  options: string[];
  value: string;
  onChange: (val: string) => void;
  hasError?: boolean;
}

function Select({ id, placeholder, options, value, onChange, hasError }: SelectProps) {
  return (
    <div className="select-wrapper">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`beaver-select${hasError ? " select-error" : ""}`}
        aria-label={placeholder}
        aria-invalid={hasError ? "true" : undefined}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <span className="select-chevron" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </span>
    </div>
  );
}

// ─── Room Card ────────────────────────────────────────────────────────────────

function RoomCard({ room }: { room: Room }) {
  return (
    <div className="room-card" role="listitem">
      <div className="room-name-col">
        <span className="room-name">
          {room.name}
        </span>
        {room.hasCamera && <CameraIcon />}
        {room.hasEllipsis && (
          <span className="room-ellipsis" aria-label="More options">…</span>
        )}
      </div>
      <div className="room-dept">{room.department}</div>
      <div className="room-type">{room.type}</div>
    </div>
  );
}

// ─── Section Divider ──────────────────────────────────────────────────────────

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="section-divider" role="separator">
      <div className="divider-line" />
      <span className="divider-label">{label}</span>
      <div className="divider-line" />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Home() {
  const emptyRange: DateRange = { from: null, to: null };
  const [dateRange, setDateRange] = useState<DateRange>(emptyRange);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [department, setDepartment] = useState("");
  const [roomType, setRoomType] = useState("");
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [hasSearched, setHasSearched] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({
    dateRange: emptyRange, startTime: "", endTime: "", department: "", roomType: ""
  });

  // Dynamically compute valid end-time options (must be strictly after start)
  const validEndTimes = startTime
    ? ALL_TIMES.filter((t) => {
        const [sh, sm] = startTime.split(":").map(Number);
        const [eh, em] = t.split(":").map(Number);
        return eh * 60 + em > sh * 60 + sm;
      })
    : ALL_TIMES;

  // When start time changes, clear end time if it's now invalid
  const handleStartTimeChange = (val: string) => {
    setStartTime(val);
    if (val && endTime) {
      const [sh, sm] = val.split(":").map(Number);
      const [eh, em] = endTime.split(":").map(Number);
      if (eh * 60 + em <= sh * 60 + sm) setEndTime("");
    }
    setErrors((prev) => ({ ...prev, timeWindow: undefined }));
  };

  const handleApply = () => {
    const errs = validate(dateRange, startTime, endTime);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setAppliedFilters({ dateRange, startTime, endTime, department, roomType });
    setHasSearched(true);
  };

  const handleReset = () => {
    setDateRange(emptyRange);
    setStartTime("");
    setEndTime("");
    setDepartment("");
    setRoomType("");
    setErrors({});
    setHasSearched(false);
    setAppliedFilters({ dateRange: emptyRange, startTime: "", endTime: "", department: "", roomType: "" });
  };

  // Rooms only shown after a valid search
  const filteredRooms = hasSearched
    ? SAMPLE_ROOMS.filter((room) => {
        if (appliedFilters.department && room.department !== appliedFilters.department) return false;
        if (appliedFilters.roomType && room.type !== appliedFilters.roomType) return false;
        return true;
      })
    : null;

  return (
    <>
      {/* ── Navbar ──────────────────────────────────────────── */}
      <nav className="navbar" role="navigation" aria-label="Main navigation">
        <div className="navbar-inner">
          <a href="/" className="navbar-brand" aria-label="STEMM Beaver home">
            <BeaverIcon />
            <span className="navbar-title">STEMM Beaver</span>
          </a>
          <div className="navbar-links">
            <a href="#search" className="nav-link">Search Rooms</a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-link"
            >
              GitHub
            </a>
          </div>
        </div>
      </nav>

      {/* ── Page Content ────────────────────────────────────── */}
      <main className="page-main" id="search">
        {/* Page heading */}
        <h1 className="page-title">Find Available Rooms</h1>

        {/* ── Filter Card ─────────────────────────────────── */}
        <section className="filter-card" aria-label="Room search filters">
          {/* Row 1 */}
          <div className="filter-row">
            <div className="filter-group">
              <label htmlFor="date-range-trigger" className="filter-label">
                Date Range <span className="required-star">*</span>
              </label>
              <DateRangePicker
                value={dateRange}
                onChange={(r) => {
                  setDateRange(r);
                  setErrors((prev) => ({ ...prev, dateRange: undefined }));
                }}
                hasError={!!errors.dateRange}
              />
              {errors.dateRange && (
                <span className="field-error" role="alert">{errors.dateRange}</span>
              )}
            </div>

            <div className="filter-group">
              <label className="filter-label">
                Time Window <span className="label-optional">(optional)</span>
              </label>
              <div className="time-selects">
                <Select
                  id="start-time"
                  placeholder="Start Time"
                  options={ALL_TIMES.slice(0, -1)}
                  value={startTime}
                  onChange={handleStartTimeChange}
                  hasError={!!errors.timeWindow}
                />
                <Select
                  id="end-time"
                  placeholder="End Time"
                  options={validEndTimes.slice(1)}
                  value={endTime}
                  onChange={(val) => {
                    setEndTime(val);
                    setErrors((prev) => ({ ...prev, timeWindow: undefined }));
                  }}
                  hasError={!!errors.timeWindow}
                />
              </div>
              {errors.timeWindow && (
                <span className="field-error" role="alert">{errors.timeWindow}</span>
              )}
            </div>
          </div>

          {/* Row 2 */}
          <div className="filter-row">
            <div className="filter-group">
              <label htmlFor="department" className="filter-label">
                Department <span className="label-optional">(optional)</span>
              </label>
              <Select
                id="department"
                placeholder="Select Department"
                options={DEPARTMENTS}
                value={department}
                onChange={setDepartment}
              />
            </div>

            <div className="filter-group">
              <label htmlFor="room-type" className="filter-label">
                Type of Room <span className="label-optional">(optional)</span>
              </label>
              <Select
                id="room-type"
                placeholder="Select Room"
                options={ROOM_TYPES}
                value={roomType}
                onChange={setRoomType}
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="filter-actions">
            <button id="apply-btn" className="btn-apply" onClick={handleApply} type="button">
              Search
            </button>
            <button id="reset-btn" className="btn-reset" onClick={handleReset} type="button">
              Reset
            </button>
          </div>
        </section>

        {/* ── Available Rooms ──────────────────────────────── */}
        <section aria-label="Available rooms list">
          <SectionDivider label="Available Rooms" />

          <div className="rooms-list" role="list" aria-live="polite">
            {filteredRooms === null ? (
              <p className="no-rooms prompt-text">Select a date range and click Search to find available rooms.</p>
            ) : filteredRooms.length === 0 ? (
              <p className="no-rooms">No rooms match your filters. Try adjusting your search.</p>
            ) : (
              filteredRooms.map((room) => (
                <RoomCard key={room.id} room={room} />
              ))
            )}
          </div>
        </section>

        {/* ── Can't Find A Room ────────────────────────────── */}
        <section className="cant-find-section" aria-label="Can&apos;t find a room">
          <SectionDivider label="Can't Find A Room?" />
          <div className="cant-find-content">
            <a
              href="#non-union"
              id="non-union-btn"
              className="non-union-btn"
              role="button"
            >
              Click here to look for Non Union rooms
            </a>
            <p className="contact-intro">Or you can contact societies at:</p>
            <ul className="contact-list">
              <li>
                <a href="mailto:enquiries@imperialisoc.co.uk" className="contact-link">
                  enquiries@imperialisoc.co.uk
                </a>
              </li>
              <li>
                <a href="mailto:enquiries@stemmm.co.uk" className="contact-link">
                  enquiries@stemmm.co.uk
                </a>
              </li>
              <li>
                <a href="mailto:enquiries@anothersociety.co.uk" className="contact-link">
                  enquiries@anothersociety.co.uk
                </a>
              </li>
            </ul>
          </div>
        </section>
      </main>

      {/* ── Scoped Styles ────────────────────────────────────── */}
      <style>{`
        /* ── Navbar ──────────────────────────────────────── */
        .navbar {
          background-color: #3d2d20;
          padding: 0 2rem;
          height: 56px;
          display: flex;
          align-items: center;
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        .navbar-inner {
          max-width: 780px;
          width: 100%;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .navbar-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }
        .navbar-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: #f5ede6;
          letter-spacing: 0.01em;
        }
        .navbar-links {
          display: flex;
          gap: 1.8rem;
          align-items: center;
        }
        .nav-link {
          font-size: 0.875rem;
          font-weight: 500;
          color: #e8ddd6;
          text-decoration: underline;
          text-underline-offset: 3px;
          transition: color 0.15s;
        }
        .nav-link:hover {
          color: #ffffff;
        }

        /* ── Page Layout ─────────────────────────────────── */
        .page-main {
          max-width: 780px;
          margin: 0 auto;
          padding: 2.5rem 1.5rem 4rem;
        }
        .page-title {
          font-size: 2rem;
          font-weight: 700;
          text-align: center;
          color: #2c1f14;
          margin-bottom: 1.75rem;
          letter-spacing: -0.01em;
        }

        /* ── Filter Card ─────────────────────────────────── */
        .filter-card {
          background: #f0ebe4;
          border: 1px solid #d4ccc4;
          border-radius: 14px;
          padding: 1.75rem 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          box-shadow: 0 1px 4px rgba(60,40,20,0.06);
        }
        .filter-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }
        @media (max-width: 580px) {
          .filter-row { grid-template-columns: 1fr; gap: 1.25rem; }
        }
        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .filter-label {
          font-size: 0.9rem;
          font-weight: 700;
          color: #2c1f14;
        }
        .label-optional {
          font-weight: 400;
          color: #6b5c4e;
        }

        /* Time selects side-by-side */
        .time-selects {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }

        /* ── Custom Select ───────────────────────────────── */
        .select-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .beaver-select {
          width: 100%;
          appearance: none;
          -webkit-appearance: none;
          background: #faf7f4;
          border: 1px solid #ccc5bb;
          border-radius: 8px;
          padding: 0.55rem 2.2rem 0.55rem 0.85rem;
          font-size: 0.85rem;
          color: #4a3728;
          font-family: inherit;
          cursor: pointer;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .beaver-select:focus {
          border-color: #8a6a52;
          box-shadow: 0 0 0 3px rgba(138,106,82,0.15);
        }
        .beaver-select option[value=""] {
          color: #9c8b7e;
        }
        .select-chevron {
          position: absolute;
          right: 0.65rem;
          pointer-events: none;
          color: #6b5c4e;
          display: flex;
          align-items: center;
        }

        /* ── Buttons ─────────────────────────────────────── */
        .filter-actions {
          display: flex;
          gap: 0.75rem;
          justify-content: center;
          padding-top: 0.25rem;
        }
        .btn-apply {
          background: #3d2d20;
          color: #f5ede6;
          border: none;
          border-radius: 8px;
          padding: 0.65rem 2rem;
          font-size: 0.9rem;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          transition: background 0.18s, transform 0.1s;
          min-width: 110px;
        }
        .btn-apply:hover {
          background: #5a3f2e;
          transform: translateY(-1px);
        }
        .btn-apply:active { transform: translateY(0); }

        .btn-reset {
          background: transparent;
          color: #4a3728;
          border: 1px solid #bab0a6;
          border-radius: 8px;
          padding: 0.65rem 2rem;
          font-size: 0.9rem;
          font-weight: 500;
          font-family: inherit;
          cursor: pointer;
          transition: background 0.18s, border-color 0.18s, transform 0.1s;
          min-width: 110px;
        }
        .btn-reset:hover {
          background: #e0d8d0;
          border-color: #9c8b7e;
          transform: translateY(-1px);
        }
        .btn-reset:active { transform: translateY(0); }

        /* ── Section Divider ─────────────────────────────── */
        .section-divider {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin: 2.5rem 0 1.25rem;
        }
        .divider-line {
          flex: 1;
          height: 1px;
          background: #bfb7af;
        }
        .divider-label {
          font-size: 0.95rem;
          font-weight: 600;
          color: #2c1f14;
          white-space: nowrap;
        }

        /* ── Room Cards ──────────────────────────────────── */
        .rooms-list {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }
        .room-card {
          background: #f0ebe4;
          border: 1px solid #d4ccc4;
          border-radius: 12px;
          padding: 1.1rem 1.5rem;
          display: grid;
          grid-template-columns: 2fr 1.5fr 1.5fr;
          align-items: center;
          gap: 1rem;
          transition: box-shadow 0.2s, transform 0.15s;
          cursor: pointer;
        }
        .room-card:hover {
          box-shadow: 0 4px 14px rgba(60,40,20,0.1);
          transform: translateY(-1px);
        }
        .room-name-col {
          display: flex;
          align-items: center;
          gap: 2px;
        }
        .room-name {
          font-size: 0.92rem;
          font-weight: 700;
          color: #2c1f14;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .room-ellipsis {
          font-size: 1rem;
          color: #6b5c4e;
          margin-left: 6px;
          letter-spacing: 2px;
        }
        .room-dept {
          font-size: 0.88rem;
          color: #4a3728;
          text-align: center;
        }
        .room-type {
          font-size: 0.88rem;
          color: #4a3728;
          font-style: italic;
          text-align: right;
        }
        .no-rooms {
          text-align: center;
          color: #9c8b7e;
          font-size: 0.9rem;
          padding: 2rem 0;
        }
        .prompt-text {
          font-style: italic;
        }
        /* ── Validation Styles ───────────────────────────── */
        .required-star {
          color: #b85c38;
          margin-left: 2px;
        }
        .field-error {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 0.78rem;
          color: #b85c38;
          font-weight: 500;
          margin-top: 2px;
          animation: fadeIn 0.2s ease;
        }
        .field-error::before {
          content: "⚠";
          font-size: 0.8rem;
        }
        .select-error {
          border-color: #b85c38 !important;
          box-shadow: 0 0 0 3px rgba(184,92,56,0.15) !important;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Can't Find Section ──────────────────────────── */
        .cant-find-section {
          margin-top: 1rem;
        }
        .cant-find-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.85rem;
          text-align: center;
        }
        .non-union-btn {
          display: inline-block;
          background: #3d2d20;
          color: #f5ede6;
          text-decoration: none;
          border-radius: 8px;
          padding: 0.65rem 1.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          transition: background 0.18s, transform 0.1s;
        }
        .non-union-btn:hover {
          background: #5a3f2e;
          transform: translateY(-1px);
        }
        .contact-intro {
          font-size: 0.85rem;
          color: #4a3728;
          font-style: italic;
        }
        .contact-list {
          list-style: disc;
          padding-left: 1.2rem;
          text-align: left;
          display: inline-block;
        }
        .contact-list li {
          font-size: 0.85rem;
          color: #4a3728;
          margin-bottom: 0.1rem;
        }
        .contact-link {
          color: #4a3728;
          text-decoration: none;
          font-style: italic;
        }
        .contact-link:hover {
          text-decoration: underline;
        }
      `}</style>
    </>
  );
}
