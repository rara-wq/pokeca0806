# ポケモンカード検索ツール

Googleスプレッドシートに保存されたポケモンカードデータを検索・閲覧するWebアプリケーションです。

## 機能

- カード番号による検索（部分一致対応）
- カード情報の表示（画像、番号、名前、レアリティ、タイプ、説明、価格）
- レスポンシブデザイン（PC・スマートフォン対応）
- Google Sheets API サービスアカウント認証

## アーキテクチャ

- **フロントエンド**: HTML, CSS, JavaScript
- **バックエンド**: Node.js + Express.js
- **データソース**: Google Sheets API

## クイックスタート

1. 依存関係をインストール:
```bash
npm install
```

2. 環境変数を設定（詳細は `setup-guide.md` を参照）:
```bash
cp .env.example .env
# .envファイルを編集してAPIキーを設定
```

3. サーバーを起動:
```bash
npm start
```

4. http://localhost:3000 でアクセス

## ファイル構成

- `index.html` - フロントエンドHTML
- `style.css` - スタイルシート
- `script.js` - フロントエンドJavaScript
- `server.js` - バックエンドAPI
- `package.json` - Node.js設定
- `setup-guide.md` - 詳細セットアップ手順

## 使用方法

1. 検索窓にカード番号を入力（例：073）
2. 検索ボタンをクリックまたはEnterキーを押下
3. 検索結果が表示されます