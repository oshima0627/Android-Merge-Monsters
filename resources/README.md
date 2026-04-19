# アプリアイコンの差し替え手順

ストア掲載のアイコンと、端末にインストールしたアプリのアイコンが
違う場合は、この手順で **アプリ本体側のアイコン** を入れ替えます。

## 1. 元画像を 3 枚用意する

ブラウザで `tools/generate-icon.html` を開き、画面上部の
「Capacitor Assets 用 (推奨)」のボタンから 3 枚をダウンロードして、
このフォルダー (`resources/`) に下記の名前で置きます。

| ファイル名 | 用途 | サイズ |
| --- | --- | --- |
| `icon.png` | 旧端末・ストア用の通常アイコン | 1024×1024 |
| `icon-foreground.png` | Adaptive Icon の前景 (Android 8.0以降) | 1024×1024 |
| `icon-background.png` | Adaptive Icon の背景 | 1024×1024 |

> 自分でデザインした画像を使う場合も、上記 3 枚をこの名前で置けばOKです。
> Adaptive Icon の前景は、中央の **66%** の範囲だけが必ず表示されるので、
> モンスターやロゴはその範囲内に収めてください。

## 2. 全サイズを自動生成する

ターミナルで以下を実行します。

```bash
npm install            # 初回のみ (@capacitor/assets を入れる)
npm run icons:generate # 各解像度のアイコンを自動生成
npx cap sync android   # Android プロジェクトに反映
```

これで `android/app/src/main/res/mipmap-*` フォルダーの中身が
新しいアイコンに置き換わります。

## 3. AAB を作り直してアップロード

Android Studio で **Build → Generate Signed Bundle / APK** から
新しい AAB を作成し、Google Play Console で新しいバージョンとして
アップロードしてください。

> 注意: ストア掲載の 512×512 アイコンは Play Console の
> 「ストアの設定」で別にアップロードします。
> 端末に表示されるアイコンと **同じ絵柄** を選んでおくと安心です。
