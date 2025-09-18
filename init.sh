#!/bin/bash

set -e

echo "🚀 Keycloak認証サンドボックスを起動しています..."

# 既存のコンテナを停止してクリーンアップ
echo "📦 既存のコンテナをクリーンアップ..."
docker-compose down -v

# Dockerイメージをビルド
echo "🔨 Dockerイメージをビルド中..."
docker-compose build

# コンテナを起動
echo "🐳 コンテナを起動中..."
docker-compose up -d

# Keycloakが起動するまで待機
echo "⏳ Keycloakの起動を待っています..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
  if docker exec keycloak /opt/keycloak/bin/kcadm.sh config credentials --server http://localhost:8080 --realm master --user admin --password admin >/dev/null 2>&1; then
    echo "✅ Keycloakが起動しました"
    break
  fi
  attempt=$((attempt + 1))
  echo "  待機中... ($attempt/$max_attempts)"
  sleep 5
done

if [ $attempt -eq $max_attempts ]; then
  echo "❌ Keycloakの起動がタイムアウトしました"
  exit 1
fi

# Realmがインポートされているか確認
echo "🔍 Realmの設定を確認中..."
if docker exec keycloak /opt/keycloak/bin/kcadm.sh get realms/demo >/dev/null 2>&1; then
  echo "✅ Demo Realmが正常にインポートされました"
else
  echo "⚠️  Demo Realmが見つかりません。手動でインポートが必要です"
  echo "   realm-export.jsonファイルをKeycloakのUIからインポートしてください"
fi

# アプリケーションの起動確認
echo "🔍 アプリケーションの起動を確認中..."
sleep 5

if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|302"; then
  echo "✅ アプリ1が正常に起動しました"
else
  echo "⚠️  アプリ1の起動を確認できません"
fi

if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 | grep -q "200\|302"; then
  echo "✅ アプリ2が正常に起動しました"
else
  echo "⚠️  アプリ2の起動を確認できません"
fi

echo ""
echo "🎉 セットアップ完了!"
echo ""
echo "📝 アクセス情報:"
echo "  - Keycloak管理コンソール: http://localhost:8080"
echo "    - ユーザー名: admin"
echo "    - パスワード: admin"
echo ""
echo "  - アプリ1: http://localhost:3000"
echo "  - アプリ2: http://localhost:3001"
echo ""
echo "  - デモユーザー:"
echo "    - ユーザー名: demo"
echo "    - パスワード: demo123"
echo ""
echo "💡 ヒント: 新規ユーザーはサインアップボタンから登録できます"