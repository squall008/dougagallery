import { Router, Request, Response } from 'express';
import { query } from '../config/database';

const router = Router();

// タグ一覧取得
router.get('/', async (req: Request, res: Response) => {
    try {
        const result = await query('SELECT * FROM tags ORDER BY name');
        res.json({ tags: result.rows });
    } catch (error) {
        console.error('Get tags error:', error);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
});

// タグ作成
router.post('/', async (req: Request, res: Response) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'タグ名は必須です' });
        }

        const result = await query(
            'INSERT INTO tags (name) VALUES ($1) RETURNING *',
            [name]
        );

        res.status(201).json({ tag: result.rows[0] });
    } catch (error: any) {
        if (error.code === '23505') {
            return res.status(400).json({ error: 'このタグは既に存在します' });
        }
        console.error('Create tag error:', error);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
});

export default router;
