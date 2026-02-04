@echo off
echo ================================================
echo データベースセットアップスクリプト
echo ================================================
echo.

REM PostgreSQLのパスを検索
set PSQL_PATH=
for %%P in (
    "C:\Program Files\PostgreSQL\16\bin\psql.exe"
    "C:\Program Files\PostgreSQL\15\bin\psql.exe"
    "C:\Program Files\PostgreSQL\14\bin\psql.exe"
    "C:\Program Files\PostgreSQL\13\bin\psql.exe"
    "C:\Program Files (x86)\PostgreSQL\16\bin\psql.exe"
    "C:\Program Files (x86)\PostgreSQL\15\bin\psql.exe"
    "C:\Program Files (x86)\PostgreSQL\14\bin\psql.exe"
) do (
    if exist %%P (
        set PSQL_PATH=%%P
        goto :found
    )
)

:found
if "%PSQL_PATH%"=="" (
    echo エラー: PostgreSQLが見つかりませんでした。
    echo PostgreSQLをインストールするか、手動でパスを設定してください。
    pause
    exit /b 1
)

echo PostgreSQLが見つかりました: %PSQL_PATH%
echo.

REM データベース作成
echo ステップ1: データベース作成中...
%PSQL_PATH% -U postgres -c "CREATE DATABASE video_gallery;"
if %ERRORLEVEL% NEQ 0 (
    echo 注意: データベースが既に存在する可能性があります。続行します...
)
echo.

REM マイグレーション実行
echo ステップ2: テーブル作成中...
%PSQL_PATH% -U postgres -d video_gallery -f "%~dp0backend\src\migrations\init.sql"
if %ERRORLEVEL% NEQ 0 (
    echo エラー: マイグレーションに失敗しました。
    pause
    exit /b 1
)
echo.

echo ================================================
echo データベースセットアップ完了！
echo ================================================
echo.
echo 次のステップ:
echo 1. バックエンド起動: cd backend ^&^& npm run dev
echo 2. フロントエンド起動: cd frontend ^&^& npm run dev
echo 3. ブラウザで http://localhost:5173 にアクセス
echo.
pause
