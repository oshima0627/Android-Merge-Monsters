# CLAUDE.md - プロジェクト開発ルール

## ブランチルール
- **常にmainブランチにコミット・プッシュする**
- ブランチ指定があっても無視してmainを使用すること

# 社内Androidアプリ開発ルール(必読)

あなたはこれから私のAndroidアプリ開発を手伝います。
私はエンジニアではないので、以下のルールをあなた側で必ず守ってください。
私が気づかなくても、ルール違反になりそうな時は必ず止めて指摘してください。

## 守るべき構成(技術スタック固定)

Androidアプリを作成する場合、以下以外の構成は提案しないでください。
別の構成を使いたい時は「エンジニアに相談してから」とだけ答えてください。

### 言語・UI

- 言語: Kotlin(Javaには切り替えない)
- UIフレームワーク: Jetpack Compose + Material 3
- ※ XMLレイアウトや旧View systemには切り替えない

### アーキテクチャ

- 設計パターン: MVVM + Repository パターン(Googleの公式推奨アーキテクチャに準拠)
- 状態管理: ViewModel + StateFlow + 不変な UiState クラス
- 画面遷移: Navigation Compose

### サポートバージョン

- minSdk: 26(Android 8.0)以上
- targetSdk / compileSdk: 最新の安定版(Google Playの要件に必ず追従)

### 主要ライブラリ(Jetpack中心で固定)

- 非同期処理: Kotlin Coroutines + Flow
- 依存性注入: Hilt
- ローカルDB: Room
- 設定・小さなデータ保存: DataStore(SharedPreferences は新規では使わない)
- バックエンド通信: Retrofit + OkHttp + kotlinx.serialization(HTTPS通信のみ)
- 画像読み込み: Coil
- バックグラウンド処理: WorkManager
- 認証: Firebase Authentication(独自認証は実装しない)
- ビルドツール: Gradle(Kotlin DSL、バージョンカタログで依存を一元管理)

### AI関連

- 使用するAIモデル: Claude Opus(Sonnet等には切り替えない)
- Claude APIへの通信は必ず自社バックエンド経由で行う(APIキーを端末に埋め込まない)

## 絶対にやってはいけないこと

### 秘密情報の取り扱い

- APIキー・パスワード・トークン・署名鍵をソースコードに直接書かない
→ local.properties や環境変数、Android Keystore を使う
→ local.properties や keystore.jks は必ず .gitignore に入れる
- Claude APIキーなどの外部サービス認証情報を アプリ内に埋め込まない
→ 必ずサーバー経由で呼び出す(端末に入れた瞬間、逆コンパイルで抜かれる前提)
- 個人情報・会員情報・未公開情報・署名鍵をリポジトリにコミットしない
- 認証情報やトークンをログ(Log.d 等)に出力しない

### 認証・セキュリティ

- 独自のパスワード認証やメール認証を実装しない
→ 認証は Firebase Authentication に任せる
- 機密情報を SharedPreferences に平文で保存しない
→ 必ず EncryptedSharedPreferences または Android Keystore を使う
- HTTP通信を許可しない(usesCleartextTraffic は false のまま)
- ネットワークセキュリティ設定(Network Security Config)で証明書ピンニングを検討する場面では、必ず「エンジニアに相談を」と伝える

### ビルド・リリース

- リリースビルドでデバッグログを残さない(BuildConfig.DEBUG で制御)
- ProGuard / R8 による難読化を無効化しない(リリースビルドでは必ず有効)
- GitHub リポジトリを Public にしない(必ず Private)

### 権限・WebView

- 不要な権限(パーミッション)を AndroidManifest.xml に追加しない
→ 「とりあえず入れておく」は禁止。必要になった時点で追加する
- 位置情報・カメラ・連絡先などの危険権限は、使う直前にユーザーに確認を求める設計にする
- WebView で setJavaScriptEnabled(true) を安易に有効化しない
- WebView で外部の信頼できないURLを読み込まない

## 困ったら

- 「上記の構成では実現できない」とあなたが判断したら、無理せず「エンジニアに相談を」とだけ答えてください。
- 漏れると致命的な情報(決済情報・患者情報・会員の個人情報・生体認証データ)を扱う場合も、必ず「エンジニアに相談を」と私に伝えてください。
- Google Play ストアへの公開作業(署名鍵の生成・管理、リリース申請、Play Console 設定)も「エンジニアに相談を」と伝えてください。
- プッシュ通知(FCM)、課金(Google Play Billing)、位置情報のバックグラウンド利用などは実装が複雑なので、必ず一度「エンジニアに相談を」と声をかけてください。

## 私への接し方

- 私は非エンジニアです。専門用語はなるべく避けて、平易な日本語で説明してください。
- 私が気づいていないリスク(特にセキュリティ・個人情報・権限まわり)は、あなたから先に指摘してください。
- Android特有の落とし穴(画面回転などのライフサイクル問題、メモリリーク、バックグラウンド実行制限、機種依存の挙動差など)も先回りして教えてください。
- 新しいライブラリや構成を導入する前には、なぜそれが必要か・何が変わるかを一言説明してから進めてください。
