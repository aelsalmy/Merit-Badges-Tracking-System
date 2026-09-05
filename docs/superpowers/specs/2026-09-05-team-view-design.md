# Team View & Add Member — Design Spec

## Context

The Merit Badge Tracker currently has a scout-by-scout view where a leader selects one scout and sees their badge progress. Leaders want a team-level view where they can see all scouts in a team at once for a given badge, check off requirements directly in a table, and add new members without going to the Google Sheet.

## Navigation

A tab bar below the top bar with two links:
- **Scout View** (`/#/`) — existing individual scout view, unchanged
- **Team View** (`/#/team`) — new team-level table view

The leader name input stays in the top bar on both views (used as `marked_by`). The scout dropdown only appears in Scout View. In Team View, team and badge dropdowns appear on the page itself.

Existing route `/#/badge/:badgeId` remains unchanged.

## Team View Page (`/#/team`)

### Filters

Two dropdowns at the top:
1. **Team dropdown** — lists all 9 teams (Smurfs, Cubs, Sea Scouts, Senior Scouts, Rovers, Fairies, Brownies, Girl Guide, Senior Guides)
2. **Badge dropdown** — lists all badges; appears after a team is selected

Both selections are persisted to `localStorage` so they survive page reloads.

### Table Layout

Once both team and badge are selected, a table renders:

- **Rows:** one per scout in the selected team
- **Columns:** Scout name | one column per requirement (sorted by `sort_order`) | Status
- **Cells:** each requirement cell is a checkbox, directly clickable
- **Requirement headers:** truncated text with full text on hover (via `title` attribute)
- **Status column:** shows `X/Y` completed count, or "Earned" with gold styling when all requirements are complete
- **Responsive:** table container has `overflow-x: auto` for horizontal scroll on narrow screens

### Checkbox Interaction

Same pattern as the existing badge detail page:
1. Leader clicks a checkbox in the table
2. Optimistic UI update (checkbox toggles immediately)
3. `markRequirement` POST fires in the background
4. On success, re-fetch team progress to confirm
5. On failure, revert the checkbox

Requires the leader name to be filled in — if empty, checkboxes are disabled with a hint message.

### Add Member

A "+ Add Scout" button sits below the team dropdown. Clicking it reveals an inline form:
- **Full name** text input (required)
- **Team** dropdown, pre-filled with the currently selected team
- **Save** button
- **Cancel** link to collapse the form

On save:
1. POST `addMember` to Apps Script
2. On success, the new member appears in the table immediately (no page reload)
3. Form collapses and clears
4. On failure, show an error message inline

## Backend Changes (Apps Script)

### New GET action: `getTeamData`

Parameters: `team` (required), `badge_id` (optional)

Returns:
```json
{
  "success": true,
  "data": {
    "members": [...],       // filtered by team
    "badges": [...],        // all badges
    "requirements": [...],  // all requirements, sorted by sort_order
    "progress": [...]       // all progress rows for members in this team
  }
}
```

Logic:
1. Read all members, filter by `team` parameter
2. Read all badges and requirements
3. Read all progress rows, filter to only include rows where `member_id` is in the filtered members list
4. Return combined object

### New POST action: `addMember`

Body: `{action: "addMember", full_name: "...", team: "..."}`

Logic:
1. Read the members sheet to find the highest existing `member_id` (format: `M` followed by zero-padded number, e.g., M005)
2. Parse the numeric part, increment by 1, zero-pad to 3 digits (M006). If no members exist, start at M001.
3. Append row: `[member_id, full_name, team]`
4. Return the created member object: `{member_id, full_name, team}`

## New React Components

### `NavBar.jsx`
Tab bar with "Scout View" and "Team View" links. Highlights the active route. Renders below the top bar header.

### `TeamSelector.jsx`
A `<select>` dropdown listing all 9 teams. Accepts `selectedTeam` and `onChange` props.

### `BadgeSelector.jsx`
A `<select>` dropdown listing all badges. Accepts `badges`, `selectedBadgeId`, and `onChange` props.

### `TeamTable.jsx`
The main table component. Props: `members`, `requirements` (filtered to selected badge), `progress` (for the team), `onToggle`, `disabled`.

Renders the HTML `<table>` with:
- Header row: "Scout" + one `<th>` per requirement (truncated, with `title`) + "Status"
- Body rows: one `<tr>` per member, with checkboxes in each requirement cell
- Status cell with completion count

### `AddMemberForm.jsx`
Inline collapsible form. Props: `defaultTeam`, `teams`, `onSave`.

State: `expanded` (boolean), `fullName`, `team`, `saving`, `error`.

### `TeamPage.jsx`
New page component composing TeamSelector, BadgeSelector, AddMemberForm, and TeamTable. Manages state for selected team, selected badge, and data loading.

Data loading: when team changes, calls `fetchTeamData(team)`. When badge changes, filters requirements client-side (already loaded). Stores `selectedTeam` and `selectedBadgeId` in `localStorage`.

## API Layer Changes (`src/api/sheets.js`)

### `fetchTeamData(team, badgeId)`
GET with `action=getTeamData&team=...&badge_id=...`. Falls back to mock data filtered by team when no API URL is set.

### `addMember({fullName, team})`
POST with `{action: "addMember", full_name, team}`. Mock mode appends to the in-memory mock members list with an auto-incremented ID.

## App.jsx Changes

- Add `NavBar` component below the header
- Add route: `/#/team` → `TeamPage`
- Move scout dropdown into Scout View routes only (not rendered on Team View)
- Pass `markedBy` to `TeamPage` for requirement toggling

## Styling

- Reuse existing CSS custom properties (scout green, gold, etc.)
- Table uses `.team-table` class with borders, alternating row colors
- Checkbox cells are centered, compact
- "Earned" row gets gold left border like the existing badge cards
- Add Member form has subtle background to distinguish it from the table
- Mobile: table scrolls horizontally, form stacks vertically

## Verification

1. Navigate to Team View, select a team — see all scouts in that team
2. Select a badge — table shows with requirements as columns
3. Check a requirement — checkbox fills, Sheet updates, progress persists on reload
4. Add a new member — appears in the table and in the Google Sheet
5. Switch to Scout View — new member appears in the dropdown
6. Switch back to Team View — selections persist from localStorage
7. Mobile viewport — table scrolls horizontally, form is usable
