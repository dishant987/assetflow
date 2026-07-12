-- ═══════════════════════════════════════════════════════════════
-- POST-GENERATE MANUAL EDITS
-- Apply these AFTER running `drizzle-kit generate`.
-- Copy-paste these statements into the generated migration file
-- (e.g., drizzle/0000_*.sql) before running `drizzle-kit migrate`.
-- ═══════════════════════════════════════════════════════════════

-- 1. FK on employees.department_id (circular-dependency workaround)
ALTER TABLE employees
  ADD CONSTRAINT fk_employees_department
  FOREIGN KEY (department_id) REFERENCES departments(id);

-- 2. EXCLUDE constraint on bookings (prevents overlapping reservations)
ALTER TABLE bookings
  ADD CONSTRAINT no_overlap_booking
  EXCLUDE USING gist (
    asset_id WITH =,
    tstzrange(slot_start, slot_end) WITH &&
  )
  WHERE (status != 'cancelled');

-- 3. Sequence for auto-generating asset tags (AF-0001, AF-0002, …)
CREATE SEQUENCE IF NOT EXISTS asset_tag_seq START 1;
