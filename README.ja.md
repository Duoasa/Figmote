<div align="center">

![Figmote：エージェントで Figma のキャンバスを操作](assets/brand/github-header.png)

# Figmote

**自然言語で Figma を操作。ローカルプラグインでキャンバスを何度でも読み書きでき、Figma MCP の利用枠を消費しません。**

[简体中文](README.md) · [English](README.en.md) · **日本語**

[プロンプトでインストール（推奨）](#プロンプトでインストール) · [手動インストール](#手動インストール) · [機能](#機能)

</div>

ローカルコマンドを実行できるエージェントと Figma を接続します。Figmote はローカルの Figma プラグインを通じてキャンバスを読み取り、編集します。

## プロンプトでインストール

**推奨の方法です。** 次の文章を、Figma Desktop と同じマシンでターミナルを操作できるエージェント（Codex など）に送ってください。

```text
https://github.com/Duoasa/Figmote から Figmote をインストール、または更新してください。
README を読み、Node.js のバージョンを確認してください。初回はリポジトリをクローンし、npm ci と npm link を実行してください。
更新時は元のディレクトリ、データ保存先、ポートを引き継いでください。figmote serve を起動し、実行したままにしてください。
manifest.json のフルパスを示し、Figma Desktop でインポートして対象ファイルで Figmote · Local を起動する手順を案内してください。
この会話専用の FIGMOTE_SESSION を設定し、figmote status を実行してください。複数のファイルが接続されている場合は、
対象を確認してから figmote select で選択してください。最後に現在のページまたは選択範囲を読み取ってください。
```

## 手動インストール

Figma Desktop を使う Mac に Node.js 22 以降をインストールし、以下を実行します。

```sh
git clone https://github.com/Duoasa/Figmote.git
cd Figmote
npm ci
npm link
figmote serve
```

1. サービスを起動したまま、Figma Desktop で **Plugins → Development → Import plugin from manifest…** を選び、ターミナルに表示された `manifest.json` を読み込みます。
2. 対象のファイルで **Figmote · Local** を起動し、ウィンドウを開いたままにします。
3. エージェントの作業ディレクトリで次のコマンドを実行します。会話ごとに固有のセッション名を設定し、その会話の呼び出しで同じ値を使います。

```sh
export FIGMOTE_SESSION="design-review-01"
figmote status
figmote call get_selection
```

複数のファイルを接続した場合は `figmote status` で対象ファイルの接続 ID を確認し、`figmote select CONNECTION_ID` を実行します。更新時は元のリポジトリで `git pull --ff-only` と `npm ci` を実行し、サービスと Figma プラグインを再起動します。既定のポートは 3055 です。使用中の場合は `figmote serve --port 3057` で別のポートを指定できます。

## 機能

<table>
<tr>
<td width="50%" valign="top">
<h3>🎨 UI の作成とレイアウト</h3>
<ul>
<li><strong>キャンバスの読み取り</strong>：選択範囲、ページ、レイヤー、テキスト、寸法、レイアウト、スタイル、コンポーネント情報。名前・属性・ページで検索。</li>
<li><strong>UI の作成・編集</strong>：要件からの生成、スクリーンショットの再現、既存 UI からの派生ページ作成、ネイティブノードと JSON シーンの読み込み。</li>
<li><strong>レイアウトと操作</strong>：Auto Layout、固定サイズ・位置、制約、重なり、レイヤーロック、プロトタイプの操作。</li>
<li><strong>フォントとアイコン</strong>：フォント検索、一括解決と代替フォント選択、内蔵ベクターアイコン。</li>
</ul>
</td>
<td width="50%" valign="top">
<h3>🧩 デザインシステムと参照</h3>
<ul>
<li><strong>コンポーネントとデザインシステム</strong>：コンポーネント、セット、バリアント、インスタンス属性とオーバーライド。コンポーネント・スタイル・アクセス可能なチーム変数ライブラリの検索と再利用。</li>
<li><strong>変数とテーマ</strong>：変数作成、モード追加、値・エイリアスの設定、変数のバインド、依存関係とモード情報の読み取り。</li>
<li><strong>デザイン参照</strong>：仕様やアートボードの紐付け・変更・解除。プラグインに名前とサムネイルを表示し、同じ参照をエージェントからも読み取り・更新可能。</li>
<li><strong>デザイン仕様</strong>：ローカルのビジュアル仕様の抽出・保存・編集。エディターが API を提供する場合、ネイティブ Specs 文書とコメントを読み書き。</li>
</ul>
</td>
</tr>
<tr>
<td width="50%" valign="top">
<h3>🔍 ビジュアル確認と素材</h3>
<ul>
<li><strong>スクリーンショットと参照画像の比較</strong>：必要に応じた画像返却、サイズ指定、並列・重ね合わせ画像、ピクセル・色の差分、主要レイアウト属性の読み取り。</li>
<li><strong>デザイン差分</strong>：スナップショットと基準を保存し、構造・スタイル・内容の変更を比較。</li>
<li><strong>素材の入出力</strong>：画像・SVG の読み込み、画像塗りの置換、PNG・JPG・SVG・PDF の書き出し、元画像の抽出、ノードとファイルの対応付け。</li>
</ul>
</td>
<td width="50%" valign="top">
<h3>🎬 モーションと各種キャンバス</h3>
<ul>
<li><strong>ネイティブモーション</strong>：キーフレーム、文字アニメーション、アニメーションスタイル、タイムラインの編集。モーションの読み取りと一部属性の CSS 変換。</li>
<li><strong>動画出力</strong>：エディターのネイティブ API による MP4・GIF・WebM の書き出し。</li>
<li><strong>FigJam</strong>：ボードの読み取り、編集可能な図形・テキスト・接続線の作成。構造化データと Mermaid フローチャートのサブセットに対応。</li>
<li><strong>Slides</strong>：接続中のプレゼンテーションに、編集可能なスライド、タイトル、本文、テーマレイアウト、ノートを作成。</li>
<li><strong>Shaders</strong>：利用可能な Shader の検索、ファイル内の使用箇所の確認、既存 Shader の読み込みと適用。</li>
</ul>
</td>
</tr>
<tr>
<td width="50%" valign="top">
<h3>🛠️ Web・コード・一括操作</h3>
<ul>
<li><strong>Web ページの読み込み</strong>：ローカルブラウザーでページを取得し、対応する DOM 内容を編集可能なレイヤーへ変換。</li>
<li><strong>デザインからコードへ</strong>：意味情報を含むデザイン構造、CSS、素材の取得。プロジェクトのコンポーネント・Token・アイコン索引と、ローカルのコンポーネント／コード対応付け。</li>
<li><strong>コードレイヤーの読み取り</strong>：既存 Code Layers の公開された外部属性を取得。</li>
<li><strong>スクリプトと一括操作</strong>：キャンバススクリプト、一括編集、ローカルレシピ、段階的タスク、チェックポイントからの再開。</li>
</ul>
</td>
<td width="50%" valign="top">
<h3>🔌 接続とエラー回復</h3>
<ul>
<li><strong>エラー回復</strong>：構造化エラーと修正案、操作状態、書き込みログ、冪等性、対象範囲の確認、失敗した操作が作成した条件適合ノードの削除。</li>
<li><strong>接続とヘルプ</strong>：ペアリング済みプラグインの生成、ファイル選択、再接続、機能照会、実行状態、呼び出し時間、内蔵ガイド。</li>
</ul>
</td>
</tr>
</table>

## ドキュメント

[使い方](skills/figma-workbench/SKILL.md) · [機能の詳細](CAPABILITIES.md) · [問題を報告](https://github.com/Duoasa/Figmote/issues)

[MIT](LICENSE) · Copyright © 2026 Duoasa.
