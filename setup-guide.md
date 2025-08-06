# セットアップガイド

## 1. Google Cloud Console でサービスアカウント作成

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. プロジェクトを作成または選択
3. Google Sheets API を有効化
4. 「IAM と管理」→「サービス アカウント」で新しいサービスアカウントを作成
5. サービスアカウントキーをJSONファイルとしてダウンロード

## 2. Googleスプレッドシートの共有設定

1. 対象のスプレッドシートを開く
2. 「共有」ボタンをクリック
3. サービスアカウントのメールアドレス（例：your-service@your-project.iam.gserviceaccount.com）を追加
4. 権限を「閲覧者」に設定

## 3. 環境変数の設定

1. `.env.example`をコピーして`.env`ファイルを作成
```bash
cp .env.example .env
```

2. ダウンロードしたサービスアカウントJSONファイルから以下の項目を`.env`ファイルにコピー：

```json
{
  "type": "service_account",
  "project_id": "your-project-id",        ← GOOGLE_PROJECT_ID
  "private_key_id": "key-id",             ← GOOGLE_PRIVATE_KEY_ID
  "private_key": "-----BEGIN PRIVATE...", ← GOOGLE_PRIVATE_KEY
  "client_email": "service@project.iam...", ← GOOGLE_CLIENT_EMAIL
  "client_id": "123456789"                ← GOOGLE_CLIENT_ID
}
```

3. `.env`ファイルの例：
```
SPREADSHEET_ID=1EBA8X0fcfUMR2mzqleydDBDx5FEM0tR6qrSicMjliUo
GOOGLE_PROJECT_ID=your-project-id
GOOGLE_PRIVATE_KEY_ID=your-private-key-id
GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nyour-private-key\n-----END PRIVATE KEY-----\n
GOOGLE_CLIENT_EMAIL=your-service@your-project-id.iam.gserviceaccount.com
GOOGLE_CLIENT_ID=123456789
PORT=3000
```

**注意**: `GOOGLE_PRIVATE_KEY`は改行文字を `\n` で記述してください。

## 4. アプリケーションの起動

```bash
npm install
npm start
```

ブラウザで http://localhost:3000 にアクセス

## 開発用

```bash
npm run dev
```

ファイル変更時に自動再起動します。