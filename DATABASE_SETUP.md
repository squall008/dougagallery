# データベースセットアップ手順

## オプション1: pgAdmin を使用（推奨）

1. pgAdmin を起動
2. PostgreSQL サーバーに接続
3. 左側のツリーで「Databases」を右クリック → 「Create」→「Database...」
4. Database name: `video_gallery`
5. 「Save」をクリック

6. 作成したデータベース `video_gallery` を右クリック → 「Query Tool」
7. `backend/src/migrations/init.sql` ファイルの内容をコピー&ペースト
8. 実行ボタン（▶）をクリック

## オプション2: PowerShellでPostgreSQLのパスを指定

PostgreSQLのインストールディレクトリを確認し、以下のコマンドを実行:

```powershell
# PostgreSQLのパスを確認（通常は以下のいずれか）
# C:\Program Files\PostgreSQL\<version>\bin\psql.exe
# C:\Program Files (x86)\PostgreSQL\<version>\bin\psql.exe

# 例: PostgreSQL 15の場合
& "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -c "CREATE DATABASE video_gallery;"

# マイグレーション実行
& "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -d video_gallery -f backend/src/migrations/init.sql
```

## オプション3: 環境変数PATHに追加

1. Windowsの検索で「環境変数」を検索
2. 「システム環境変数の編集」を開く
3. 「環境変数」ボタンをクリック
4. システム変数の「Path」を選択して「編集」
5. 「新規」をクリックして PostgreSQL の bin ディレクトリを追加
   - 例: `C:\Program Files\PostgreSQL\15\bin`
6. OKで閉じる
7. PowerShellを再起動
8. 元のコマンドを実行

## データベースセットアップ完了後

バックエンドとフロントエンドを起動:

### バックエンド起動（ターミナル1）
```bash
cd backend
npm run dev
```

### フロントエンド起動（ターミナル2）
```bash
cd frontend
npm run dev
```

ブラウザで `http://localhost:5173` にアクセスしてアプリケーションを使用できます。
