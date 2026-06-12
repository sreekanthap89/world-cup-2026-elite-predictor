## 2026-06-12 - Expensive Calculations inside Render loop
**Learning:** `getGroupStandings` computation performed O(n) operations multiple times during a single render loop of `BracketView.tsx`.
**Action:** Identified expensive calculations and computed results ahead of time via `useMemo`. Replaced calls to function with lookups against memoized data.
