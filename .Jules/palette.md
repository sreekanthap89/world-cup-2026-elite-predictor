## 2024-11-20 - Adding htmlFor to input elements
**Learning:** Found an accessibility issue pattern specific to this app's components, where many input fields and dropdowns in `MemberAccess.tsx` and `MatchDetailModal.tsx` were missing the `id` attribute and their corresponding labels lacked the `htmlFor` attribute.
**Action:** Always verify that `<label>` elements are properly associated with their `<input>` or `<select>` counterparts via `id` and `htmlFor` to support screen readers and click-to-focus functionality.
