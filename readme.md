# Keycloak SSO & TODOリスト デモアプリケーション

Keycloakを使用したシングルサインオン（SSO）と、TODOリスト機能を実装したマルチアプリケーションのデモです。Docker Composeで全ての環境を構築します。

## 🚀 システム構成

### コンテナ構成（7コンテナ）

- **Keycloak**: 認証プロバイダー (v24.0)
- **PostgreSQL (Keycloak用)**: Keycloakデータベース
- **PostgreSQL (App1用)**: アプリ1のTODOデータベース
- **PostgreSQL (App2用)**: アプリ2のTODOデータベース
- **Webapp1**: Node.js/Expressアプリ（ポート3000、紫テーマ）
- **Webapp2**: Node.js/Expressアプリ（ポート3001、ピンクテーマ）

## ✨ 主な機能

### 🔐 認証機能（SSO対応）

- **シングルサインオン**: 1度のログインで両アプリにアクセス可能
- **ユーザー登録**: 新規ユーザーのセルフサインアップ
- **Googleアカウント認証**: Google OAuth 2.0を使用したソーシャルログイン
- **プロファイル表示**: 認証後のユーザー情報表示
- **セキュアなログアウト**: Keycloakセッションも含めた完全なログアウト

### 📝 TODOリスト機能

- **独立したデータ管理**: 各アプリ専用のデータベース
- **CRUD操作**: TODO項目の作成・読取・更新・削除
- **リアルタイム更新**: Ajaxによる画面更新
- **ユーザー分離**: 各ユーザーのTODOは完全に分離

### 🎨 UI/UX

- **統一ナビゲーション**: 全ページ共通のナビゲーションバー
- **直感的な導線**: TODOリストへの目立つアクセスボタン
- **テーマ分離**: アプリごとに異なるカラーテーマ

## 📋 前提条件

- Docker & Docker Compose
- ポート 3000, 8080 が空いていること

## ⚙️ セットアップ

### Google OAuth 2.0の設定（オプション）

Googleアカウント認証を使用する場合：

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 新しいプロジェクトを作成または既存プロジェクトを選択
3. 「APIとサービス」→「認証情報」→「認証情報を作成」→「OAuth 2.0 クライアント ID」
4. アプリケーションの種類: 「ウェブアプリケーション」を選択
5. 承認済みのリダイレクトURIに追加:
   ```
   http://localhost:8080/realms/demo/broker/google/endpoint
   ```
6. `.env` ファイルを作成し、取得したクライアントIDとシークレットを設定:
   ```bash
   cp .env.example .env
   # .envファイルを編集して、GOOGLE_CLIENT_IDとGOOGLE_CLIENT_SECRETを設定
   ```

### 方法1: 自動セットアップ（推奨）

```bash
# 初期化スクリプトを実行
./init.sh
```

このスクリプトは以下を自動で実行します：
- 既存コンテナのクリーンアップ
- Dockerイメージのビルド
- 全コンテナの起動
- Keycloakへのrealm設定のインポート
- 起動確認とアクセス情報の表示

### 方法2: 手動セットアップ

```bash
# 1. コンテナを起動
docker-compose up -d

# 2. Keycloakが起動するまで待機（約30秒）
sleep 30

# 3. 動作確認
curl http://localhost:3000
```

### アクセスURL

- **アプリ1（紫テーマ）**: http://localhost:3000
- **アプリ2（ピンクテーマ）**: http://localhost:3001
- **Keycloak管理コンソール**: http://localhost:8080

## 🔑 デフォルトアカウント

### Keycloak管理者

- ユーザー名: `admin`
- パスワード: `admin`

### デモユーザー (デモRealm)

- ユーザー名: `demo`
- パスワード: `demo123`

※ 新規ユーザーは「サインアップ」ボタンから登録できます

## 🎮 使い方

### シングルサインオン（SSO）の確認

1. アプリ1 (http://localhost:3000) でログイン
2. アプリ2 (http://localhost:3001) にアクセス
3. 自動的にログイン済みとして認識されます

### TODOリストの使用

1. ログイン後、「TODOリストを管理」ボタンをクリック
2. タスクを追加・編集・削除
3. 各アプリのTODOリストは独立して管理されます

### 新規ユーザー登録

1. いずれかのアプリにアクセス
2. 「サインアップ」ボタンをクリック
3. 必要情報を入力して登録
4. 登録後、自動的に両アプリにログイン

## 🔧 カスタマイズ

### Keycloak設定の変更

`keycloak/realm-export.json` を編集して、Realm設定をカスタマイズできます。
変更後は `docker-compose down -v && docker-compose up -d` で再起動してください。

### 新しいユーザーの追加

#### 方法1: アプリケーションから登録

- トップページの「新規登録」ボタンから直接登録可能

#### 方法2: Keycloak管理コンソールから追加

1. Keycloak管理コンソール (http://localhost:8080) にログイン
2. Demo Realmを選択
3. Users → Add userで新規ユーザーを作成

### セキュリティ設定の変更

現在の設定（開発用）:

- メール確認: 無効
- 自己登録: 有効
- パスワードリセット: 有効

本番環境では以下の設定を推奨:

- メール確認を有効化
- SMTP設定の追加
- CAPTCHA/reCAPTCHAの導入
- パスワードポリシーの強化

## 🛑 停止と削除

```bash
# 停止
docker-compose down

# 完全削除（データベース含む）
docker-compose down -v
```

## 📁 プロジェクト構造

```
.
├── docker-compose.yml       # Docker Compose設定
├── init.sh                 # 自動セットアップスクリプト
├── .env.example            # 環境変数テンプレート
├── keycloak/
│   └── realm-export.json   # Keycloak Realm設定（自動インポート）
└── webapp/
    ├── Dockerfile          # Webアプリコンテナ設定
    ├── package.json        # Node.js依存関係
    ├── server.js           # Expressサーバー
    ├── routes/
    │   └── todos.js        # TODO API エンドポイント
    ├── db/
    │   └── init.sql        # データベース初期化
    └── views/              # EJSテンプレート
        ├── index.ejs       # ホームページ
        ├── profile.ejs     # プロファイルページ
        ├── todos.ejs       # TODOリスト画面
        └── partials/
            └── nav.ejs     # ナビゲーションバー
```

## 🐛 トラブルシューティング

### Keycloakが起動しない

- PostgreSQLが正常に起動しているか確認: `docker-compose logs postgres`
- ポート8080が他のアプリケーションで使用されていないか確認

### ログインできない

- Keycloakのログを確認: `docker-compose logs keycloak`
- ブラウザのCookieをクリアして再試行

### Webアプリが起動しない

- Node.jsアプリのログを確認: `docker-compose logs webapp`
- 環境変数が正しく設定されているか確認
