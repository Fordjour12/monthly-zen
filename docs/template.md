Template Concept - Current State
What exists now:

- Explore screen shows 4 mock "pre-made" templates (Deep Work Sprint, Morning Routine, etc.)
- Each template has: title, description, category, complexity, focus areas
- "Apply" button on template cards exists but doesn't navigate to planner with the template data
- Bookmark icon exists but has no functionality
  What the URL template param does:
- The planner can receive a JSON string via URL to pre-fill form fields
- Currently only handles: goalsText, taskComplexity, focusAreas, weekendPreference
- Missing: commitments array

---

Clarifying Questions
To define the template system for your mobile app, I need to understand your vision:

1. Template Purpose - What should templates be?
   | Option | Description |
   |--------|-------------|
   | Pre-made presets | App-provided starting points (like the current mock data) |
   | User saved plans | Users save their own completed plans as templates for future months |
   | Hybrid | Both app-provided presets + user-saved templates |
2. Where do templates live?
   | Option | Description |
   |--------|-------------|
   | Cloud (server) | Sync across devices, shareable with others |
   | Local device only | No sync, privacy-focused |
   | Both | Local cache with optional cloud backup |
3. What data should a template contain?
   □ goalsText
   □ taskComplexity
   □ focusAreas
   □ weekendPreference
   □ commitments (fixed time blocks)
   □ Other?
4. User workflow - How would someone use a template?
   Example:
5. User taps "Templates" tab
6. Browses/creates templates
7. Taps one → pre-fills planner form
8. Edits if needed → generates plan
   Does this match your vision? Which options resonate with you?
