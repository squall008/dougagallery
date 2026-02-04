import sqlite3 from 'sqlite3';
import { Pool } from 'pg';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
const isPostgres = !!DATABASE_URL;

if (isPostgres) {
  const redactedUrl = DATABASE_URL?.replace(/:([^@]+)@/, ':****@');
  console.log('Database URL detected:', redactedUrl);
}

// --- SQLite Setup ---
const dbDir = path.join(__dirname, '../../data');
if (!isPostgres && !fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'video_gallery.db');
const sqliteDb = isPostgres ? null : new sqlite3.Database(dbPath);

// Promisify SQLite methods
const dbRun = sqliteDb ? promisify(sqliteDb.run.bind(sqliteDb)) as (sql: string, params?: any) => Promise<any> : null;
const dbGet = sqliteDb ? promisify(sqliteDb.get.bind(sqliteDb)) as (sql: string, params?: any) => Promise<any> : null;
const dbAll = sqliteDb ? promisify(sqliteDb.all.bind(sqliteDb)) as (sql: string, params?: any) => Promise<any[]> : null;
const dbExec = sqliteDb ? promisify(sqliteDb.exec.bind(sqliteDb)) as (sql: string) => Promise<void> : null;

// --- PostgreSQL Setup ---
const pool = isPostgres ? new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Render/Heroku PostgreSQL
  }
}) : null;

if (isPostgres) {
  console.log('Database connected: PostgreSQL');
} else {
  console.log(`Database connected: ${dbPath} (SQLite)`);
}

// クエリヘッダーインターフェース
interface QueryResult {
  rows: any[];
  rowCount: number;
}

// クエリヘルパー関数（PostgreSQL互換）
export const query = async (text: string, params: any[] = []): Promise<QueryResult> => {
  if (isPostgres && pool) {
    const res = await pool.query(text, params);
    return {
      rows: res.rows,
      rowCount: res.rowCount || 0,
    };
  }

  // SQLite implementation (compatibility layer)
  try {
    if (!sqliteDb || !dbAll) throw new Error('SQLite database not initialized');
    let sqliteQuery = text.trim();
    let sqliteParams: any[] = [];

    console.log('--- DB Query Start ---');
    console.log('Original SQL:', sqliteQuery);
    console.log('Original Params:', params);

    // $1, $2, ... を ? に置換し、パラメータの順番を合わせる
    // 正規表現でプレースホルダーをすべて抽出
    const matches = sqliteQuery.match(/\$\d+/g);
    if (matches) {
      // 出現順に ? に置換し、対応する値を sqliteParams に入れる
      const seenMatches: string[] = [];
      // 置換用の一時的な文字列などを使わず、一気に処理するために
      // 全ての $k を ? に変えつつ、params[k-1] を sqliteParams に追加
      // ただし、単純に replace すると順番が保証されないので注意が必要

      // 手法: プレースホルダーをトークンとして扱う
      let index = 0;
      sqliteQuery = sqliteQuery.replace(/\$\d+/g, (match) => {
        const paramIdx = parseInt(match.substring(1)) - 1;
        sqliteParams.push(params[paramIdx]);
        return '?';
      });
      console.log('Replaced SQL:', sqliteQuery);
      console.log('Mapped Params:', sqliteParams);
    } else {
      sqliteParams = [...params];
    }

    // RETURNING 句の簡易エミュレーション
    const returningMatch = sqliteQuery.match(/RETURNING\s+(.+)$/i);
    const hasReturning = !!returningMatch;
    if (hasReturning) {
      sqliteQuery = sqliteQuery.replace(/RETURNING\s+.+$/i, '').trim();
      console.log('Emulating RETURNING. Cleaned SQL:', sqliteQuery);
    }

    // SELECT クエリの実行
    if (sqliteQuery.toUpperCase().startsWith('SELECT')) {
      const rows = await dbAll(sqliteQuery, sqliteParams);
      console.log('SELECT result rows:', rows.length);
      return { rows, rowCount: rows.length };
    }

    // INSERT/UPDATE/DELETE の実行
    return new Promise((resolve, reject) => {
      if (!sqliteDb) return reject(new Error('SQLite database not initialized'));
      sqliteDb.run(sqliteQuery, sqliteParams, function (err) {
        if (err) {
          console.error('DB Run Error:', err);
          return reject(err);
        }

        const lastID = (this as any).lastID;
        const changes = (this as any).changes;
        console.log(`DB Run Result - lastID: ${lastID}, changes: ${changes}`);

        if (hasReturning && lastID && sqliteQuery.toUpperCase().startsWith('INSERT')) {
          const tableName = getTableName(text);
          console.log(`Fetching the inserted row from ${tableName} with rowid ${lastID}...`);
          sqliteDb.all(`SELECT * FROM ${tableName} WHERE rowid = ?`, [lastID], (err: any, rows: any) => {
            if (err) {
              console.error('Fetch inserted row error:', err);
              return reject(err);
            }
            console.log('Fetch inserted row result:', rows?.length, 'rows');
            resolve({ rows: rows || [], rowCount: changes || 0 });
          });
        } else {
          resolve({ rows: [], rowCount: changes || 0 });
        }
      });
    });
  } catch (error) {
    console.error('Database query helper internal error:', error);
    throw error;
  } finally {
    console.log('--- DB Query End ---');
  }
};

// テーブル名を抽出するヘルパー
function getTableName(sql: string): string {
  const match = sql.match(/(?:INTO|UPDATE|FROM)\s+(\w+)/i);
  return match ? match[1] : '';
}

// データベース初期化
export const initDatabase = async () => {
  if (isPostgres && pool) {
    try {
      const { rows } = await pool.query("SELECT to_regclass('public.users') as table_exists");
      if (!rows[0].table_exists) {
        console.log('PostgreSQL: Initializing schema...');
        const sqlPath = path.join(__dirname, '../migrations/init.sql');
        if (fs.existsSync(sqlPath)) {
          const sql = fs.readFileSync(sqlPath, 'utf8');
          await pool.query(sql);
          console.log('PostgreSQL: Schema initialized successfully.');
        } else {
          console.warn('PostgreSQL: init.sql not found at', sqlPath);
        }
      }
    } catch (error) {
      console.error('PostgreSQL initialization error:', error);
    }
    return;
  }

  if (!dbExec || !dbGet || !dbRun) return;

  try {
    await dbExec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await dbExec(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await dbExec(`
      CREATE TABLE IF NOT EXISTS videos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        category_id INTEGER,
        title TEXT NOT NULL,
        description TEXT,
        filename TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER,
        duration INTEGER,
        thumbnail_path TEXT,
        views INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
      );
    `);

    await dbExec(`
      CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await dbExec(`
      CREATE TABLE IF NOT EXISTS video_tags (
        video_id INTEGER NOT NULL,
        tag_id INTEGER NOT NULL,
        PRIMARY KEY (video_id, tag_id),
        FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
      );
    `);

    await dbExec(`
      CREATE TABLE IF NOT EXISTS favorites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        video_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, video_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
      );
    `);

    // インデックス作成
    await dbExec('CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);');
    await dbExec('CREATE INDEX IF NOT EXISTS idx_videos_category_id ON videos(category_id);');
    await dbExec('CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);');
    await dbExec('CREATE INDEX IF NOT EXISTS idx_video_tags_video_id ON video_tags(video_id);');
    await dbExec('CREATE INDEX IF NOT EXISTS idx_video_tags_tag_id ON video_tags(tag_id);');

    // 初期カテゴリデータ
    const result = await dbGet('SELECT COUNT(*) as count FROM categories');
    if (result && result.count === 0) {
      const categories = [
        ['エンターテイメント', 'エンターテイメント関連の動画'],
        ['教育', '教育・学習関連の動画'],
        ['音楽', '音楽関連の動画'],
        ['スポーツ', 'スポーツ関連の動画'],
        ['ゲーム', 'ゲーム関連の動画'],
        ['その他', 'その他の動画'],
      ];

      for (const cat of categories) {
        await dbRun('INSERT INTO categories (name, description) VALUES (?, ?)', cat);
      }
      console.log('Initial categories inserted');
    }

    // デフォルト匿名ユーザーの作成
    const userResult = await dbGet('SELECT COUNT(*) as count FROM users');
    if (userResult && userResult.count === 0) {
      await dbRun(
        'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
        ['anonymous', 'anonymous@example.com', 'no-password']
      );
      console.log('Default anonymous user created');
    }

    console.log('Database initialized successfully (SQLite)');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

export default sqliteDb;
