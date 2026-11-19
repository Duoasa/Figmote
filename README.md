<div align="center">

![Figmote：用 Agent 操作 Figma 画板](assets/brand/github-header.png)

# Figmote

**用自然语言读懂、创建和修改 Figma 设计。**

**简体中文** · [English](README.en.md) · [日本語](README.ja.md)

[提示词安装（推荐）](#提示词安装) · [手动安装](#手动安装) · [功能](#功能)

</div>

连接能在本机执行命令的 Agent 与 Figma。Figmote 通过本地 Figma 插件读取和修改画板。

## 提示词安装

**推荐使用提示词安装。** 复制下面这段话，发给能在 Figma Desktop 所在机器上运行终端命令的 Agent，例如 Codex：

```text
请从 https://github.com/Duoasa/Figmote 安装或升级 Figmote。
先读仓库 README，检查本机 Node.js 版本。首次安装请克隆仓库，运行 npm ci 和 npm link；
升级时沿用原目录、数据路径和端口。运行 figmote serve，保持服务在线。
请给我 manifest.json 的完整路径，指导我在 Figma Desktop 导入，并在目标文件中运行 Figmote · Local。
为当前对话设置独立的 FIGMOTE_SESSION。连接后运行 figmote status；
如果打开了多个文件，请让我确认目标，再用 figmote select 绑定文件。最后读取当前页面或选区。
```

## 手动安装

在运行 Figma Desktop 的 Mac 上安装 Node.js 22 或更高版本，然后运行：

```sh
git clone https://github.com/Duoasa/Figmote.git
cd Figmote
npm ci
npm link
figmote serve
```

1. 保持服务运行。在 Figma Desktop 选择 **Plugins → Development → Import plugin from manifest…**，导入终端打印的 `manifest.json`。
2. 在目标文件运行 **Figmote · Local**，保持插件窗口打开。
3. 让 Agent 在设计项目目录执行以下命令。每个对话使用独立的会话名，同一对话的每次调用沿用该值。

```sh
export FIGMOTE_SESSION="design-review-01"
figmote status
figmote call get_selection
```

连接多个文件时，先从 `figmote status` 取得目标文件的连接 ID，再运行 `figmote select CONNECTION_ID`。升级时在原仓库目录运行 `git pull --ff-only` 和 `npm ci`，重启服务并重新运行 Figma 插件。默认端口为 3055；端口已被占用时可使用 `figmote serve --port 3057`。

## 功能

<table>
<tr>
<td width="50%" valign="top">
<h3>🎨 UI 创作与布局</h3>
<ul>
<li><strong>画布读取</strong>：选区、页面、图层、文字、尺寸、布局、样式与组件上下文；按名称、属性和页面查询。</li>
<li><strong>UI 创建与编辑</strong>：根据需求生成页面、参考截图复刻 UI、复用现有页面衍生新界面；支持原生节点与 JSON 场景导入。</li>
<li><strong>布局与交互</strong>：Auto Layout、固定尺寸与定位、约束、叠层、图层锁定及原型交互。</li>
<li><strong>字体与图标</strong>：字体查询、批量匹配与回退，内置常用矢量图标。</li>
</ul>
</td>
<td width="50%" valign="top">
<h3>🧩 设计系统与参考</h3>
<ul>
<li><strong>组件与设计系统</strong>：组件、组件集、变体、实例属性和覆盖项；搜索并复用组件、样式与可访问的团队变量库。</li>
<li><strong>变量与主题</strong>：创建变量、增添模式、设置值与别名、绑定设计变量，读取依赖和模式信息。</li>
<li><strong>设计参考</strong>：绑定、换绑和解绑规范或画板；在插件中查看名称与缩略图，通过 Agent 读取或更新同一份设计参考。</li>
<li><strong>设计规范</strong>：提取、保存和修改本地视觉规范；在编辑器提供接口时读写原生 Specs 文档与批注。</li>
</ul>
</td>
</tr>
<tr>
<td width="50%" valign="top">
<h3>🔍 视觉验证与素材</h3>
<ul>
<li><strong>截图与参考图对照</strong>：按需回图、尺寸控制、并排图、叠加图和像素/颜色差异；读取关键布局属性。</li>
<li><strong>设计变更对比</strong>：保存设计快照与基线，对照后续结构、样式及内容变化。</li>
<li><strong>素材导入导出</strong>：图片、SVG、图片填充替换；PNG、JPG、SVG、PDF 导出，原图提取及节点与文件映射。</li>
</ul>
</td>
<td width="50%" valign="top">
<h3>🎬 动效与多种画布</h3>
<ul>
<li><strong>原生动效</strong>：关键帧、文字动画、动画样式与时间线编辑；读取动效并将部分属性转换为 CSS。</li>
<li><strong>视频导出</strong>：通过编辑器原生接口导出 MP4、GIF、WebM。</li>
<li><strong>FigJam</strong>：读取白板，创建可编辑的形状、文字和连接线；支持结构化图表与 Mermaid 流程图子集。</li>
<li><strong>Slides</strong>：在当前演示文件中生成可编辑幻灯片、标题、正文、主题布局和备注。</li>
<li><strong>Shaders</strong>：发现可用 Shader、查询文件中的使用位置，导入并应用已有 Shader。</li>
</ul>
</td>
</tr>
<tr>
<td width="50%" valign="top">
<h3>🛠️ 网页、代码与批量操作</h3>
<ul>
<li><strong>网页导入</strong>：通过本机浏览器捕获网页，将支持的 DOM 内容转成可编辑图层。</li>
<li><strong>设计稿到代码</strong>：读取语义设计上下文、CSS 与素材；索引项目组件、Token 和图标，管理本地组件与代码映射。</li>
<li><strong>代码层读取</strong>：读取现有 Code Layers 的外部属性。</li>
<li><strong>脚本与批量操作</strong>：画布脚本、批量修改、本地脚本配方、分步任务与断点续跑。</li>
</ul>
</td>
<td width="50%" valign="top">
<h3>🔌 连接与恢复</h3>
<ul>
<li><strong>错误恢复</strong>：结构化错误与修复建议、操作状态、写入日志、幂等去重、局部核查及符合条件的失败新建节点清理。</li>
<li><strong>连接与帮助</strong>：生成配对插件、多文件选择、断线重连、能力查询、运行状态和调用耗时；内置使用指南。</li>
</ul>
</td>
</tr>
</table>

## 文档

[使用指南](skills/figma-workbench/SKILL.md) · [能力说明](CAPABILITIES.md) · [反馈问题](https://github.com/Duoasa/Figmote/issues)

[MIT](LICENSE) · Copyright © 2026 Duoasa.
