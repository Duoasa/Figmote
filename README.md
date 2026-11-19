# Figmote

Figmote lets local AI agents read, edit and visually verify native Figma designs through a paired Figma plugin. It brings the local workflow from [DSH to Figma](https://github.com/Duoasa/DSH-to-Figma) to agents that can run terminal commands on the same machine as Figma Desktop.

An agent calls the CLI or the JavaScript client. A local process binds its conversation to an open Figma file and forwards canvas operations to the plugin. The plugin runs the Figma Plugin API in that file. The agent needs neither DSH nor a Figma MCP server.

**中文快速上手**　Figmote 将 DSH to Figma 的本地设计能力开放给能执行本机命令的 Agent。按下方命令安装并运行 `figmote serve`，在 Figma Desktop 导入它打印的 `manifest.json`，然后在目标文件内运行 **Figmote · Local**。给当前对话设置独立的 `FIGMOTE_SESSION`，即可调用 `figmote call get_selection` 读取选区。完整工具清单见 [CAPABILITIES.md](CAPABILITIES.md)。

## Install and connect

Use Node.js 22 or newer with a local Unix socket. Initial development and packaging checks run on macOS. Install from this repository:

```sh
git clone https://github.com/Duoasa/Figmote.git
cd Figmote
npm ci
npm link
figmote serve
```

Keep the service running. It prints the **absolute path to manifest.json**. In Figma Desktop choose **Plugins → Development → Import plugin from manifest…**, pick that file, then run **Figmote · Local** inside the design file. Keep the plugin window open. The paired folder contains a machine-local credential; keep it private.

The companion uses loopback port 3055 by default. If another instance or DSH is using it, choose a free port with `figmote serve --port 3057`. Keep the same port on later starts. The default state directory is `~/.figmote`; use an absolute `FIGMOTE_HOME` to isolate another installation.

## Read and edit from an agent

From the intended project workspace, give each conversation a unique session name. Supply that same environment variable on every command if the host creates a fresh shell per call.

```sh
export FIGMOTE_SESSION=codex-design-review
figmote status
figmote call get_selection
```

A single connected file is selected on first use. With multiple files, run `figmote select CONNECTION_ID` using the ID returned by status. After a disconnect or a workspace change, confirm the target and select it again.

To create an editable frame, save the following as `card.js` in your workspace:

```js
const frame = figma.createFrame()
frame.name = 'Order summary'
frame.resize(320, 180)
return { id: frame.id, name: frame.name }
```

Run `figmote exec card.js`. To inspect the result, put the returned node ID in a JSON file such as `screenshot.json`:

```json
{"nodeId":"12:34","quality":"detail"}
```

```sh
figmote call get_screenshot --args-file screenshot.json
```

Open the image at the returned workspace path. Commands print structured JSON and return a nonzero exit code on errors. After a timeout or partial write, check the returned operation ID and recovery guidance before editing again. Keep the service alive during an operation. In-memory history is lost across a service restart; retained idempotency records survive. Inspect the affected canvas when a prior result is unknown.

## Agent integration

| Entry point | How to use it |
| --- | --- |
| Local terminal agents | Use the same CLI from Codex, Claude Code, Cursor or another host with a local shell. The user confirmed an independent Codex canvas read/write on the source local workflow before extraction. Other named clients are integration candidates pending individual editor tests. |
| JavaScript clients | Import `call` from `figmote/client` and pass a stable session ID and absolute workspace. Results include structured content and validated image blocks. |
| Native hosts | Import `startRuntime` from `figmote` to own a runtime lifecycle, or use the client to reuse an existing service. Choose only the tools your host exposes. |
| Agent skills | [Bundled instructions](skills/figma-workbench/SKILL.md) describe document selection, authoring, verification and recovery. |

```js
import { call } from 'figmote/client'

const selection = await call('get_selection', {}, {
  sessionId: 'design-review-42',
  workspace: process.cwd()
})
console.log(selection.structuredContent)
```

Run `figmote tools` to list the 43 local tools or `figmote tools use_figma` to inspect a schema. The [capability inventory](CAPABILITIES.md) covers components and variables, design references, screenshots and visual comparison, FigJam, Slides, motion, assets, workspace reuse, operation history and recovery. Capabilities depend on the editor and APIs exposed by the open file. A running local plugin is required for all canvas operations.

## Development

`npm run build` regenerates the Figma plugin bundle and checks package files. `npm test` runs the local bridge, runtime and CLI integration tests. Editor rendering and per-agent visual acceptance are separate checks. DSH-specific registration, profile resolution, and future DSH-side transport adaptations belong to the original repository.

Derived from [DSH to Figma 0.4.1](https://github.com/Duoasa/DSH-to-Figma/tree/20ae81a6196526159bbc3b1bea63e5aa3b5054dc). Distributed under the [MIT license](LICENSE). Bundled Feather icons retain their [license](assets/companion/FEATHER-LICENSE).
