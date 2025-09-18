# Keycloak認証サンドボックス - 開発ガイド

## プロジェクト概要
このプロジェクトは、Keycloakを使用したシングルサインオン（SSO）とTODOリスト機能を実装したマルチアプリケーションのデモです。Docker Composeで完全自動セットアップが可能です。

## アーキテクチャ

### コンテナ構成（7コンテナ）
- **PostgreSQL (Keycloak用)**: Keycloakのデータストア
- **PostgreSQL (App1用)**: アプリ1のTODOデータベース
- **PostgreSQL (App2用)**: アプリ2のTODOデータベース
- **Keycloak** (port 8080): 認証プロバイダー
- **Webapp1** (port 3000): Node.js/Expressアプリ（紫テーマ）
- **Webapp2** (port 3001): Node.js/Expressアプリ（ピンクテーマ）

### 認証フロー
1. ユーザーがWebアプリにアクセス
2. ログイン/サインアップボタンでKeycloakにリダイレクト
3. Keycloakで認証後、コールバックURLに戻る
   - 通常認証: ユーザー名/パスワード
   - ソーシャル認証: Googleアカウント
4. アプリがトークンを取得してセッションを確立

## 重要な設定

### URL設定の使い分け
- **ブラウザからのアクセス**: `http://localhost:8080` を使用
- **サーバー間通信**: `http://keycloak:8080` を使用（コンテナ名）

webapp/server.js:51-77 でこの使い分けを実装しています。

### Keycloak設定
- Realm名: `demo`
- Client ID: `webapp` / `webapp2`
- Client Secret: `secret` / `secret2`
- 自動インポート: `keycloak/realm-export.json`
- Google OAuth: 環境変数で設定（`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`）

## 開発時の注意事項

### 新機能追加時
1. Keycloak側の設定変更が必要な場合は、kcadm.shコマンドを使用
2. UIの変更後は必ず `docker-compose restart webapp` を実行
3. 本番環境向けの変更は、セキュリティ設定を必ず確認

### トラブルシューティング
- **ログイン後のリダイレクトエラー**: URLのlocalhost/keycloak設定を確認
- **新規登録が機能しない**: Realmのregistration設定を確認
- **セッションエラー**: SESSION_SECRET環境変数を確認

## セットアップと初期化

### Google認証の設定（オプション）
```bash
# 1. .envファイルを作成
cp .env.example .env

# 2. Google Cloud ConsoleでOAuth 2.0クライアントを作成
# 3. .envファイルにクライアントIDとシークレットを設定
```

### 自動セットアップ（推奨）
```bash
# 初期化スクリプトを実行（完全自動）
./init.sh
```

### 手動セットアップ
```bash
# コンテナ起動（realm設定は自動インポート）
docker-compose up -d
```

### 完全リセット
```bash
# データベースを含めて完全削除
docker-compose down -v
# 再セットアップ
./init.sh
```

## 今後の改善点
- [ ] メール確認機能の実装
- [x] ソーシャルログインの追加（Google OAuth実装済み）
- [ ] MFA（多要素認証）の導入
- [ ] ロールベースアクセス制御の実装
