# 🎬 動画ギャラリー Webアプリ

TypeScript + React + Node.js + PostgreSQLで構築された、フルスタック動画ギャラリーアプリケーションです。

## 🌟 機能

- ✅ ユーザー認証（登録・ログイン・JWT）
- ✅ 動画アップロード（MP4対応、最大500MB）
- ✅ タグ・カテゴリ管理
- ✅ 検索・フィルタ機能
- ✅ お気に入り機能
- ✅ レスポンシブUI（モバイル・タブレット・デスクトップ対応）
- ✅ 動画ストリーミング再生

## 🛠️ 技術スタック

### フロントエンド
- React 19
- TypeScript
- Vite
- React Router
- Axios

### バックエンド
- Node.js
- Express
- TypeScript
- PostgreSQL
- JWT認証
- Multer（ファイルアップロード）

## 📋 前提条件

- Node.js 18以上
- PostgreSQL 14以上
- npm または yarn

## 🚀 セットアップ手順

### 1. データベースのセットアップ

PostgreSQLをインストールし、データベースを作成します。

```bash
# PostgreSQLにログイン
psql -U postgres

# データベース作成
CREATE DATABASE video_gallery;

# 終了
\q
```

マイグレーションを実行してテーブルを作成します。

```bash
psql -U postgres -d video_gallery -f backend/src/migrations/init.sql
```

### 2. バックエンドのセットアップ

```bash
cd backend

# 依存関係のインストール
npm install

# 環境変数の設定
copy .env.example .env
```

`.env`ファイルを編集して、データベース接続情報を設定します。

```env
PORT=5000
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/video_gallery
JWT_SECRET=your-secret-key-change-this-in-production
```

バックエンドサーバーを起動します。

```bash
npm run dev
```

サーバーは `http://localhost:5000` で起動します。

### 3. フロントエンドのセットアップ

新しいターミナルウィンドウを開きます。

```bash
cd frontend

# 依存関係のインストール
npm install

# 開発サーバーを起動
npm run dev
```

フロントエンドは `http://localhost:5173` で起動します。

## 📖 使い方

1. **ユーザー登録**
   - `http://localhost:5173/register` にアクセス
   - ユーザー名、メールアドレス、パスワードを入力して登録

2. **ログイン**
   - `http://localhost:5173/login` にアクセス
   - メールアドレスとパスワードでログイン

3. **動画アップロード**
   - ログイン後、「アップロード」ボタンをクリック
   - MP4ファイルを選択し、タイトル、説明、カテゴリ、タグを入力
   - アップロードボタンをクリック

4. **動画検索・フィルタ**
   - ダッシュボードの検索バーでキーワード検索
   - カテゴリやタグでフィルタリング
   - ソート順を変更（新しい順、古い順、再生回数順）

5. **動画再生**
   - 動画カードをクリックして詳細ページへ
   - 動画プレーヤーで再生

6. **お気に入り**
   - 動画詳細ページでお気に入りボタンをクリック
   - 「お気に入り」ページで一覧表示

## 📁 プロジェクト構造

```
ecliptic-cosmic/
├── backend/
│   ├── src/
│   │   ├── config/          # データベース設定
│   │   ├── middleware/      # 認証・アップロードミドルウェア
│   │   ├── routes/          # APIルート
│   │   ├── migrations/      # DBマイグレーション
│   │   └── server.ts        # エントリーポイント
│   └── uploads/             # 動画ファイル保存先
├── frontend/
│   ├── src/
│   │   ├── components/      # 再利用可能なコンポーネント
│   │   ├── pages/           # ページコンポーネント
│   │   ├── services/        # APIクライアント
│   │   ├── context/         # React Context
│   │   └── App.tsx          # メインアプリ
│   └── public/
└── README.md
```

## 🔧 API エンドポイント

### 認証
- `POST /api/auth/register` - ユーザー登録
- `POST /api/auth/login` - ログイン
- `GET /api/auth/me` - 現在のユーザー情報取得

### 動画
- `GET /api/videos` - 動画一覧取得（検索・フィルタ対応）
- `GET /api/videos/:id` - 動画詳細取得
- `POST /api/videos` - 動画アップロード（認証必要）
- `PUT /api/videos/:id` - 動画更新（認証必要）
- `DELETE /api/videos/:id` - 動画削除（認証必要）
- `GET /api/videos/:id/stream` - 動画ストリーミング

### カテゴリ
- `GET /api/categories` - カテゴリ一覧取得
- `POST /api/categories` - カテゴリ作成（認証必要）

### タグ
- `GET /api/tags` - タグ一覧取得
- `POST /api/tags` - タグ作成（認証必要）

### お気に入り
- `GET /api/favorites` - お気に入り一覧取得（認証必要）
- `POST /api/favorites/:videoId` - お気に入り追加（認証必要）
- `DELETE /api/favorites/:videoId` - お気に入り削除（認証必要）
- `GET /api/favorites/check/:videoId` - お気に入り状態確認（認証必要）

## 🎨 デザイン

- ダークテーマ
- モダンなグラデーション
- レスポンシブデザイン
- スムーズなアニメーション
- 直感的なUI/UX

## 📝 ライセンス

MIT

## 👨‍💻 開発者向け

### ビルド

```bash
# バックエンド
cd backend
npm run build
npm start

# フロントエンド
cd frontend
npm run build
npm run preview
```

### 環境変数

バックエンドの環境変数（`.env`）:
- `PORT` - サーバーポート（デフォルト: 5000）
- `DATABASE_URL` - PostgreSQL接続URL
- `JWT_SECRET` - JWT署名用シークレットキー

## 🐛 トラブルシューティング

### データベース接続エラー
- PostgreSQLが起動していることを確認
- `.env`ファイルの`DATABASE_URL`が正しいことを確認
- データベース`video_gallery`が作成されていることを確認

### ファイルアップロードエラー
- `backend/uploads/`ディレクトリが存在することを確認
- ファイルサイズが500MB以下であることを確認
- MP4形式の動画であることを確認

### CORS エラー
- バックエンドが`http://localhost:5000`で起動していることを確認
- フロントエンドが`http://localhost:5173`で起動していることを確認
