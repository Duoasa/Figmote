# Local capability inventory

The extraction baseline is DSH to Figma 0.4.1 at [20ae81a](https://github.com/Duoasa/DSH-to-Figma/tree/20ae81a6196526159bbc3b1bea63e5aa3b5054dc). All 43 local catalog entries are carried into Figmote. Four operate on a workspace without an open Figma file. The scope column describes where an operation is coordinated, not necessarily a single plugin call. The inventory records implementation coverage, not per-agent visual acceptance.

## Canvas and context

| Tool | Scope | Purpose |
| --- | --- | --- |
| `create_session` | Bound document | Create a local task recording UUID for the selected Figma file. |
| `use_figma` | Bound document | Run JavaScript using the figma-use 17 contract in the selected local Figma document. |
| `get_selection` | Bound document | Read the current page and selected nodes. |
| `get_metadata` | Bound document | Read a bounded layer tree; prefer summary for discovery. |
| `get_screenshot` | Bound document | Return an actual PNG screenshot as an image result. |
| `get_design_context` | Bound document | Read a target subtree and CSS for design-to-code work. |
| `get_figjam` | Bound document | Read FigJam structure. |
| `get_component_context` | Bound document | Read component, component set or instance properties and descendants. |
| `get_capabilities` | Bound document | Probe currently exposed Motion, TextStagger, custom animation styles and Specs APIs without creating nodes or writing. |

## Design systems and references

| Tool | Scope | Purpose |
| --- | --- | --- |
| `list_fonts` | Bound document | Find available font families and exact styles. |
| `resolve_fonts` | Bound document | Resolve a batch against actually available fonts, cached briefly per companion. |
| `get_variable_defs` | Bound document | Read local variables or collection inventory. |
| `get_libraries` | Bound document | Read available team variable libraries through the public Plugin API.. |
| `search_design_system` | Bound document | Search local components, variables and styles. |
| `create_variables` | Bound document | Create explicitly named variables in an existing local collection. |
| `add_variable_modes` | Bound document | Add explicit modes to one local collection. |
| `get_design_reference` | Bound document | Read the current file’s persistent design reference. |
| `set_design_reference` | Bound document | Bind a design reference for this file. |
| `clear_design_reference` | Bound document | Unbind this file’s design reference; leaves the source and all generated UI untouched.. |

## Media, motion and authoring

| Tool | Scope | Purpose |
| --- | --- | --- |
| `upload_assets` | Bound document | Import workspace raster/SVG files as editable SVG layers or image fills. |
| `download_assets` | Bound document | Export nodes to workspace files as PNG/JPG/SVG/PDF, optionally with original image bytes. |
| `import_scene` | Bound document | Import a local JSON scene as native editable Figma nodes. |
| `get_motion_context` | Bound document | Read reactions, manual keyframe tracks, animation styles and timelines for one node. |
| `export_video` | Bound document | Export native animation from a top-level frame as MP4/GIF/WebM to the workspace. |
| `generate_diagram` | Bound document | Build native editable FigJam nodes and bound connectors in the current board. |
| `generate_deck` | Bound document | Create editable slides in the connected Slides file using title/body layouts. |
| `get_shaders` | Bound document | Discover shaders exposed to the current file through the native editor API. |
| `list_file_shaders` | Bound document | Inspect shader usage in a bounded subtree; reports coverage and node references, not cloud source.. |
| `apply_shader` | Bound document | Import and apply an existing native shader by ID; type and parameter validation precedes canvas writes.. |
| `import_dom_snapshot` | Bound document | Import a bounded computed DOM snapshot as editable native nodes. |
| `capture_webpage` | Bound document | Capture a user-specified HTTP(S) page with a local browser and import the supported editable DOM subset. |

## Reuse, verification and recovery

| Tool | Scope | Purpose |
| --- | --- | --- |
| `get_local_component_links` | Bound document | Read local component-to-code links. |
| `set_local_component_links` | Bound document | Save local component-to-code links in Figma plugin data. |
| `design_diff` | Bound document | Compare a complete semantic design snapshot against a versioned workspace baseline. |
| `project_index` | Workspace | Scan bounded source files in the active workspace for components, tokens and SVG icons. |
| `project_match` | Workspace | Suggest project components/tokens/icons for explicit design inputs. |
| `project_mappings` | Workspace | Manage explicit workspace mappings; never publishes Code Connect. |
| `local_recipes` | Workspace | Save/read/list/remove bounded local canvas scripts. |
| `batch_edit` | Bound document | Apply a bounded whitelist of reversible edits with preflight and best-effort verified recovery. |
| `run_steps` | Bound document | Execute explicit bounded steps with persistent checkpoints. |
| `operation_status` | Bound document | Read the status of an operation in this agent session and connected document. |
| `compare` | Bound document | Compare a workspace/session reference raster with a rendered Figma node. |
| `rollback` | Bound document | Explicitly remove eligible unchanged nodes created by a failed use_figma with trackCreated:true, in this session/file only. |

## Connection and guidance

| Original entry | Figmote equivalent |
| --- | --- |
| figma_status | `figmote status` lists live connections and the session binding. |
| figma_setup | `figmote serve` prepares the paired companion and prints its absolute manifest path. |
| figma_select_document | `figmote select <connectionId>` binds one session to an open document. |
| figma_read_guide | README, bundled agent skill and local workflow references. |
| figma_reconnect | Official MCP catalog refresh is outside the local extraction. Reopen the companion and explicitly select its new connection. |

Canvas writes run only in the local plugin. Browser capture requires a supported installed browser. Video, shaders, libraries and native specifications depend on the editor APIs, available fonts, account and file type. An operation can partially modify a document. Read operation status and reconcile before retrying. Workspace-only recipes, component indexes and mapping files do not require an open document.

The DSH host owns native tool registration, prompt injection and chat attachment lookup. Standalone agents read the current design reference from status or get_design_reference and pass reference images by workspace path. Native integrations can supply an attachment reader and message lookup to the runtime.
