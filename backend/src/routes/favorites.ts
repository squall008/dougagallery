import { Router, Request, Response } from 'express';
import { query } from '../config/database';

const router = Router();

// デフォルトユーザー(ID:1)を使用
const anonymousUserId = 1;

// お気に入り一覧取得
router.get('/', async (req: Request, res: Response) => {
    try {
        const result = await query(
            `SELECT v.*, u.username, c.name as category_name
      FROM favorites f
      JOIN videos v ON f.video_id = v.id
      JOIN users u ON v.user_id = u.id
      LEFT JOIN categories c ON v.category_id = c.id
      WHERE f.user_id = $1
      ORDER BY f.created_at DESC`,
            [anonymousUserId]
        );

        res.json({ favorites: result.rows });
    } catch (error) {
        console.error('Get favorites error:', error);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
});

// お気に入り追加
router.post('/:videoId', async (req: Request, res: Response) => {
    try {
        const { videoId } = req.params;

        // 動画の存在確認
        const videoCheck = await query('SELECT id FROM videos WHERE id = $1', [videoId]);
        if (videoCheck.rows.length === 0) {
            return res.status(404).json({ error: '動画が見つかりません' });
        }

        await query(
            'INSERT INTO favorites (user_id, video_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [anonymousUserId, videoId]
        );

        res.status(201).json({ message: 'お気に入りに追加しました' });
    } catch (error) {
        console.error('Add favorite error:', error);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
});

// お気に入り削除
router.delete('/:videoId', async (req: Request, res: Response) => {
    try {
        const { videoId } = req.params;

        await query('DELETE FROM favorites WHERE user_id = $1 AND video_id = $2', [
            anonymousUserId,
            videoId,
        ]);

        res.json({ message: 'お気に入りから削除しました' });
    } catch (error) {
        console.error('Remove favorite error:', error);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
});

// お気に入り状態確認
router.get('/check/:videoId', async (req: Request, res: Response) => {
    try {
        const { videoId } = req.params;

        const result = await query(
            'SELECT id FROM favorites WHERE user_id = $1 AND video_id = $2',
            [anonymousUserId, videoId]
        );

        res.json({ isFavorite: result.rows.length > 0 });
    } catch (error) {
        console.error('Check favorite status error:', error);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
});

export default router;
