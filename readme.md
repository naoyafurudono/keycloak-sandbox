# Keycloak認証デモアプリケーション

Keycloakを使用したOpenID Connect認証のデモアプリケーションです。Docker Composeで全ての環境を構築します。

## 🚀 構成

- **Keycloak**: 認証プロバイダー (v24.0)
- **PostgreSQL**: Keycloakデータベース (v15)
- **Node.js Webアプリ**: Express + OpenID Connect

## ✨ 機能

- **ユーザー認証**: OpenID Connectによる安全な認証
- **ユーザー登録**: 新規ユーザーのセルフサインアップ
- **プロファイル表示**: 認証後のユーザー情報表示
- **トークン管理**: アクセストークン・IDトークンの取得と表示
- **ログアウト**: シングルログアウト対応

## 📋 前提条件

- Docker & Docker Compose
- ポート 3000, 8080 が空いていること

## ⚙️ セットアップ

### 1. 環境変数の設定

```bash
cp .env.example .env
```

必要に応じて `.env` ファイルを編集してください。

### 2. アプリケーションの起動

```bash
docker-compose up -d
```

初回起動時は、Keycloakの初期設定に時間がかかる場合があります。

### 3. アクセス

- **Webアプリケーション**: http://localhost:3000
- **Keycloak管理コンソール**: http://localhost:8080

## 🔑 デフォルトアカウント

### Keycloak管理者

- ユーザー名: `admin`
- パスワード: `admin`

### デモユーザー (デモRealm)

1. 一般ユーザー
   - ユーザー名: `demo`
   - パスワード: `demo123`

2. 管理者ユーザー
   - ユーザー名: `admin`
   - パスワード: `admin123`

## 🎮 使い方

### 既存ユーザーでログイン

1. http://localhost:3000 にアクセス
2. 「ログイン」ボタンをクリック
3. デモユーザーの認証情報を入力
4. 認証後、プロファイル情報が表示されます

### 新規ユーザー登録

1. http://localhost:3000 にアクセス
2. 「新規登録」ボタンをクリック
3. 登録フォームに以下を入力:
   - ユーザー名
   - メールアドレス
   - パスワード（2回入力）
4. 登録完了後、自動的にログインされます

## 🔧 カスタマイズ

### Keycloak設定の変更

`keycloak/import/demo-realm.json` を編集して、Realm設定をカスタマイズできます。

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
├── .env.example            # 環境変数テンプレート
├── keycloak/
│   └── import/
│       └── demo-realm.json # Keycloak Realm設定
└── webapp/
    ├── Dockerfile          # Webアプリコンテナ設定
    ├── package.json        # Node.js依存関係
    ├── server.js           # Expressサーバー
    └── views/              # EJSテンプレート
        ├── index.ejs       # ホームページ
        └── profile.ejs     # プロファイルページ
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
