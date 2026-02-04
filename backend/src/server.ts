import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { initDatabase } from './config/database';
import videoRoutes from './routes/videos';
import categoryRoutes from './routes/categories';
import tagRoutes from './routes/tags';
import favoriteRoutes from './routes/favorites';

dotenv.config();

// データベース初期化
initDatabase();


const app = express();
const PORT = process.env.PORT || 5000;

// ミドルウェア
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// アップロードディレクトリの静的配信
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// APIルート
app.use('/api/videos', videoRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/favorites', favoriteRoutes);

// フロントエンドの静的配信（本番環境）
if (process.env.NODE_ENV === 'production') {
    const frontendDist = path.join(__dirname, '../../frontend/dist');
    if (fs.existsSync(frontendDist)) {
        app.use(express.static(frontendDist));
        app.get('*', (req: Request, res: Response) => {
            if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
                res.sendFile(path.join(frontendDist, 'index.html'));
            }
        });
    }
}

// ヘルスチェック
app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'OK', message: 'Video Gallery API is running' });
});

// エラーハンドリング
app.use((err: any, req: Request, res: Response, next: any) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'サーバーエラーが発生しました',
    });
});

// サーバー起動
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 API endpoint: http://localhost:${PORT}/api`);
});

export default app;
