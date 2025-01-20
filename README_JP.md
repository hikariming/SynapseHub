# SynapseHub - インテリジェント LLM API ゲートウェイ & 管理プラットフォーム

<div align="center">
  <h1>♻️</h1>
  <p><strong>ワンストップLLM API管理・オーケストレーションプラットフォーム</strong></p>
</div>

![SynapseHub ダッシュボードプレビュー](view.png)

[简体中文](README.md) | [English](README_EN.md) | 日本語

## 🌟 概要

SynapseHubは、企業や開発者が様々な大規模言語モデルと対話する方法を簡素化するための強力なLLM APIゲートウェイおよび管理プラットフォームです。複数のAPIキーの管理、異なるモデル間の負荷分散、モデル呼び出しの統合監視とログ記録など、あらゆるニーズに対応します。

## ✨ 主な機能

### 🚀 スマートルーティング & 負荷分散
- **マルチモデル統合**: OpenAIスタイル（Difyスタイル対応予定）LLMの統合アクセス
- **インテリジェント負荷分散**: ラウンドロビンやランダムなど、複数の負荷分散戦略をサポート

### 🔒 セキュリティ & アクセス制御
- **きめ細かな権限管理**: 包括的なユーザーロールと権限制御システム
- **APIキー管理**: 安全なAPIキーの保存と管理
- **リクエスト認証**: 複数の認証方式をサポート
- **アクセス監査ログ**: 詳細なリクエストログと監査機能

### 📊 モニタリング & 分析
- **リアルタイムモニタリング**: モデルのパフォーマンス、応答時間、エラー率を監視
- **使用統計**: 詳細なAPI呼び出し統計とコスト分析
- **ログ管理**: 集中化されたログ収集とクエリ
- **アラートシステム**: 設定可能なアラートルールと通知方法

## 🚀 クイックスタート

### 必要要件
- DockerとDocker Compose
- または個別インストール:
  - Node.js 16+
  - MongoDB 4.4+
  - Redis 6+

### Dockerデプロイメント
```bash
# リポジトリのクローン
git clone https://github.com/yourusername/synapsehub.git

# プロジェクトディレクトリに移動
cd synapsehub

# すべてのサービスを起動
docker-compose up -d

# サービスステータスの確認
docker-compose ps

# ログの表示
docker-compose logs -f
```

サービスポート:
- Web UI: http://localhost:3000
- APIサービス: http://localhost:3088
- MongoDB: localhost:26889
- Redis: localhost:6390

// ... (その他の部分は必要に応じて翻訳) ... 