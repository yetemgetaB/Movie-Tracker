

# Vault Page Redesign

## Issues to Fix

1. **Date formatting** — Raw dates like `2026-03-13` should display as `Mar 13, 2026`. Add a `formatDate()` helper that parses various date formats and outputs a consistent readable format.

2. **Movies table shows "Seasons" column** — Movies don't have seasons. Replace with "Runtime" or remove entirely.

3. **Rating display** — Shows `userRating/10` even when empty, resulting in `/10` or `—/10`. Handle empty ratings gracefully with a dash or "Not rated" badge.

4. **Status badge logic** — Currently checks `s.status === "Ended"` but actual data uses values like `"Yes"`, `"No"`, `"No(2026)"`. Fix to reflect real data patterns (e.g. "Yes" = Completed, "No" = In Progress).

5. **Empty poster handling** — Many items have empty poster URLs. Show a styled placeholder instead of a broken image.

6. **Grid card polish** — Add subtle hover effects, better spacing, and genre/year styling.

7. **Stats banner** — Add top genre stat and improve visual hierarchy.

8. **Edit dialog** — Date inputs should use text fields with the friendly format, not raw date pickers. Add notes field.

9. **Table visual polish** — Better row hover states, alternating subtle backgrounds, sticky header, and compact but readable typography.

10. **Empty state** — More inviting empty states with a call-to-action button.

## Technical Approach

**Single file change:** `src/pages/VaultPage.tsx`

- Add a `formatDisplayDate(raw: string)` utility at the top that tries to parse dates in multiple formats (`YYYY-MM-DD`, `Mon DD, YYYY`, `Mon DD,YYYY`, etc.) and outputs `MMM DD, YYYY` using `date-fns` `format` and `parse`.
- Fix the movies table columns: remove "Seasons", add "Finish Date" column.
- Add a poster fallback: if `poster` is empty or fails, show a colored placeholder with the title initial and a film icon.
- Fix status badge to map `"Yes"/"yes"` → "Completed" (green), `"No"` → "In Progress" (yellow), strings containing year like `"No(2026)"` → "Upcoming (2026)" (blue).
- Rating cell: show `★ 8.5` styled nicely when present, or a muted "—" when empty.
- IMDb/RT cells: show "—" when empty instead of blank space.
- Grid cards: add gradient overlay on poster bottom, better text layout.
- Edit dialog: add a "Notes" textarea field.
- Empty states: add a button linking to Browse page.

