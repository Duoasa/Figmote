---
name: figma-workbench
description: Read, create, edit, and visually verify native Figma designs with Figmote's local companion and CLI.
---

Use a single FIGMOTE_SESSION value for the conversation. Use the same workspace for all calls. Run figmote status to inspect connected files, then figmote select CONNECTION_ID when multiple files are open or a previous binding disconnected. Read the current selection only when the user's request depends on it. Inspect a tool's arguments with figmote tools NAME.

Read references/plugin-api.md before authoring a script. Put JavaScript in a file and use figmote exec FILE. Return touched node IDs. For repeatable writes, use figmote call use_figma --args-file PATH with a stable idempotencyKey and the intended fileKey. Refer to the current design reference and reuse components and variables when appropriate.

For a reproduction, preserve intended layout behavior and inspect a real render against the reference. Test size or content changes in areas meant to adapt. After a meaningful edit request get_screenshot for the returned node and open the image in the host. A successful write or image export proves only that step.

If a write fails, read the reported execution state and follow reconcile. Inspect partial or unknown results before editing again. If only screenshot generation or saving failed, retry the screenshot separately.
