# 新潟大学 発車案内サイネージ

新潟大学 情報理工棟から新潟方面へ向かう際の発車案内ボードです。
JR の駅サイネージ風 UI で、iPad・27インチ・14インチモニターでの常時表示を想定しています。

公開 URL: `https://ryo-sasa.github.io/`

## 仕組み

GitHub Pages は静的ホスティングのため、元の `app.py`（Python サーバー）はそのままでは動きません。
また JR・新潟交通の運行情報サイトは CORS 非対応で、ブラウザから直接取得できません。
そこで以下の構成にしています。

- **GitHub Actions** が15分ごとに運行情報をスクレイピングし、`data/status.json` を更新・コミット
- `index.html` は同一オリジンの `./data/status.json` を読み込むだけ（CORS 問題なし）
- 平日／土休日の判定は、ブラウザから `holidays-jp.github.io` の祝日 API を直接取得
- 運行情報が取得できないときも、発車案内ボードは内蔵時刻表で完全に動作します

## ファイル構成

```
ryo-sasa.github.io/
├── index.html                      … 発車案内ボード本体（ルートに置く）
├── data/
│   └── status.json                 … 運行情報（Actions が自動更新）
├── scripts/
│   └── fetch_status.py             … 運行情報スクレイピング（app.py のサーバー部分を除いたもの）
├── .github/
│   └── workflows/
│       └── update-status.yml       … 15分ごとに status.json を更新するワークフロー
└── README.md
```

## セットアップ手順

1. このリポジトリ（`ryo-sasa.github.io`）に上記ファイルをそのまま配置して `main` へ push
2. **Settings → Pages** で、Source を `main` ブランチのルートに設定
3. **Settings → Actions → General → Workflow permissions** で
   「Read and write permissions」を有効化（Actions が `status.json` をコミットできるようにするため）
4. **Actions** タブで `update-status` ワークフローを一度手動実行（`Run workflow`）して動作確認

スケジュール実行（cron）は、ワークフローがデフォルトブランチ（`main`）に存在して初めて有効になります。

## 時刻表の更新

時刻表は `index.html` 内の `schedules` オブジェクトにまとまっています。
ダイヤ改正の際はこの部分を書き換えてください（バス＝新大西門 W21西小針線、
univ＝新潟大学前駅 JR越後線、uchino＝内野駅 JR越後線）。

## 注意点

- 運行情報の更新ごとに `data/status.json` のコミットが増えます（15分間隔、運用上は許容範囲）
- JR・新潟交通のサイトが Actions ランナーの IP をブロックする場合があります。
  その場合 `status.json` は「取得失敗」となりますが、発車案内ボード自体は内蔵時刻表で動作します
- 常時表示モニターの焼き付き対策として、画面全体に超低速のドリフトアニメーションを入れています
