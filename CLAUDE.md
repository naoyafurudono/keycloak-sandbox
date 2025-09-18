# Keycloak認証サンドボックス - 開発ガイド

## プロジェクト概要
このプロジェクトは、Keycloakを使用したOpenID Connect認証のデモアプリケーションです。Docker Composeで構成され、ユーザー登録、認証、プロファイル管理機能を提供します。

## アーキテクチャ

### コンテナ構成
- **PostgreSQL** (port 5432): Keycloakのデータストア
- **Keycloak** (port 8080): 認証プロバイダー
- **Webapp** (port 3000): Node.js/Expressアプリケーション

### 認証フロー
1. ユーザーがWebアプリにアクセス
2. ログイン/サインアップボタンでKeycloakにリダイレクト
3. Keycloakで認証後、コールバックURLに戻る
4. アプリがトークンを取得してセッションを確立

## 重要な設定

### URL設定の使い分け
- **ブラウザからのアクセス**: `http://localhost:8080` を使用
- **サーバー間通信**: `http://keycloak:8080` を使用（コンテナ名）

webapp/server.js:51-77 でこの使い分けを実装しています。

### Keycloak設定
- Realm名: `demo`
- Client ID: `webapp`
- Client Secret: `secret`（.envで変更可能）

## 開発時の注意事項

### 新機能追加時
1. Keycloak側の設定変更が必要な場合は、kcadm.shコマンドを使用
2. UIの変更後は必ず `docker-compose restart webapp` を実行
3. 本番環境向けの変更は、セキュリティ設定を必ず確認

### トラブルシューティング
- **ログイン後のリダイレクトエラー**: URLのlocalhost/keycloak設定を確認
- **新規登録が機能しない**: Realmのregistration設定を確認
- **セッションエラー**: SESSION_SECRET環境変数を確認

## テスト環境の初期化

```bash
# 完全リセット
docker-compose down -v
docker-compose up -d

# Keycloak設定の再適用
docker exec keycloak /opt/keycloak/bin/kcadm.sh config credentials --server http://localhost:8080 --realm master --user admin --password admin
docker exec keycloak /opt/keycloak/bin/kcadm.sh update realms/demo -s registrationAllowed=true
```

## 今後の改善点
- [ ] メール確認機能の実装
- [ ] ソーシャルログインの追加
- [ ] MFA（多要素認証）の導入
- [ ] ロールベースアクセス制御の実装
