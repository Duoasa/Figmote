<div align="center">

<!-- Hero image -->

# Figmote

**Read, create and edit Figma designs with natural language.**

[简体中文](README.md) · **English** · [日本語](README.ja.md)

[Prompt installation (recommended)](#install-with-a-prompt) · [Manual installation](#manual-installation) · [Features](#features) · [Demo](#demo)

</div>

Connect an agent that can run local commands to Figma. Figmote reads and edits the canvas through a local Figma plugin.

## Install with a prompt

**Recommended.** Send this prompt to an agent such as Codex that can run terminal commands on the same machine as Figma Desktop:

```text
Install or update Figmote from https://github.com/Duoasa/Figmote.
Read the README and check my Node.js version. For a fresh install, clone the repo, then run npm ci and npm link.
For an update, reuse the existing checkout, state directory and port. Start figmote serve and keep it running.
Give me the full path to manifest.json. Show me how to import it in Figma Desktop and run Figmote · Local in my target file.
Set a unique FIGMOTE_SESSION for this conversation. Run figmote status. If several files are connected, confirm which
one I want and bind it using figmote select. Then read my current page or selection.
```

## Manual installation

On the Mac running Figma Desktop, install Node.js 22 or newer, then run:

```sh
git clone https://github.com/Duoasa/Figmote.git
cd Figmote
npm ci
npm link
figmote serve
```

1. Keep the service running. In Figma Desktop choose **Plugins → Development → Import plugin from manifest…** and import the `manifest.json` path printed in the terminal.
2. Run **Figmote · Local** in the target file and keep its window open.
3. Ask your agent to run the following from your project workspace. Use a unique session name for each conversation and reuse it for every call in that conversation.

```sh
export FIGMOTE_SESSION="design-review-01"
figmote status
figmote call get_selection
```

With multiple files connected, get the target connection ID from `figmote status` and run `figmote select CONNECTION_ID`. To update, run `git pull --ff-only` and `npm ci` in the original checkout, restart the service, then reopen the Figma plugin. The default port is 3055. If it is occupied, use `figmote serve --port 3057`.

## Features

<table>
<tr>
<td width="50%" valign="top">
<h3>🎨 UI creation and layout</h3>
<ul>
<li><strong>Canvas reading</strong>: selections, pages, layers, text, dimensions, layout, styles and component context; queries by name, property and page.</li>
<li><strong>UI creation and editing</strong>: build from requirements, recreate screenshot references, derive pages from existing UI, and import native nodes or JSON scenes.</li>
<li><strong>Layout and interaction</strong>: Auto Layout, fixed sizing and positioning, constraints, overlays, layer locks and prototype interactions.</li>
<li><strong>Fonts and icons</strong>: font lookup, batch resolution and fallbacks, plus built-in vector icons.</li>
</ul>
</td>
<td width="50%" valign="top">
<h3>🧩 Design systems and references</h3>
<ul>
<li><strong>Components and design systems</strong>: components, sets, variants, instance properties and overrides; search and reuse components, styles and accessible team variable libraries.</li>
<li><strong>Variables and themes</strong>: create variables, add modes, set values and aliases, bind variables, and read dependencies and mode information.</li>
<li><strong>Design references</strong>: bind, replace and unbind specs or artboards; names and thumbnails in the plugin, with the same references available to read and update from your agent.</li>
<li><strong>Design specifications</strong>: extract, save and edit local visual specifications; read and edit native Specs documents and comments when the editor exposes the API.</li>
</ul>
</td>
</tr>
<tr>
<td width="50%" valign="top">
<h3>🔍 Visual checks and assets</h3>
<ul>
<li><strong>Screenshots and reference comparison</strong>: optional image returns, size controls, side-by-side and overlay images, pixel/color differences, and key layout properties.</li>
<li><strong>Design diffs</strong>: save snapshots and baselines to compare later structure, style and content changes.</li>
<li><strong>Assets</strong>: image and SVG import, image-fill replacement, PNG/JPG/SVG/PDF export, original-image extraction, and node-to-file mappings.</li>
</ul>
</td>
<td width="50%" valign="top">
<h3>🎬 Motion and canvas types</h3>
<ul>
<li><strong>Native motion</strong>: keyframes, text animation, animation styles and timelines; motion reading and partial CSS conversion.</li>
<li><strong>Video export</strong>: MP4, GIF and WebM through the editor&#x27;s native export API.</li>
<li><strong>FigJam</strong>: read boards and create editable shapes, text and connectors from structured graphs or a Mermaid flowchart subset.</li>
<li><strong>Slides</strong>: editable slides, titles, body content, theme layouts and notes in the connected presentation.</li>
<li><strong>Shaders</strong>: discover available shaders, find their use in the file, and import/apply existing shaders.</li>
</ul>
</td>
</tr>
<tr>
<td width="50%" valign="top">
<h3>🛠️ Web, code and batch work</h3>
<ul>
<li><strong>Webpage import</strong>: capture pages with a local browser and convert supported DOM content into editable layers.</li>
<li><strong>Design to code</strong>: semantic design context, CSS and assets; project component, token and icon indexing, plus local component-to-code mappings.</li>
<li><strong>Code Layer reading</strong>: read the exposed external properties of existing Code Layers.</li>
<li><strong>Scripts and batches</strong>: canvas scripts, batch edits, local recipes, step-based tasks and checkpoint resumption.</li>
</ul>
</td>
<td width="50%" valign="top">
<h3>🔌 Connections and recovery</h3>
<ul>
<li><strong>Error recovery</strong>: structured errors and repair hints, operation status, write journals, idempotency, scoped inspection, and cleanup of eligible nodes created by failed operations.</li>
<li><strong>Connection and help</strong>: paired companion generation, document selection, reconnection, capability discovery, runtime status, call timing and bundled guides.</li>
</ul>
</td>
</tr>
</table>

## Documentation and contributions

[Agent guide](skills/figma-workbench/SKILL.md) · [Capabilities](CAPABILITIES.md) · [Issues](https://github.com/Duoasa/Figmote/issues)

Thanks to [heeq666](https://github.com/heeq666) and [miztizm](https://github.com/miztizm) for their feedback and contributions to the original local plugin.

[MIT](LICENSE) · Copyright © 2026 Duoasa.

## Demo

<!-- Demo media -->
