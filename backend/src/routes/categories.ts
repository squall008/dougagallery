import { Router, Request, Response } from 'express';
import { query } from '../config/database';

const router = Router();

// カテゴリ一覧取得
router.get('/', async (req: Request, res: Response) => {
    try {
        const result = await query('SELECT * FROM categories ORDER BY name');
        res.json({ categories: result.rows });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
});

// カテゴリ作成
router.post('/', async (req: Request, res: Response) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'カテゴリ名は必須です' });
        }

        const result = await query(
            'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *',
            [name, description || null]
        );

        res.status(201).json({ category: result.rows[0] });
    } catch (error: any) {
        if (error.code === '23505') {
            return res.status(400).json({ error: 'このカテゴリ名は既に存在します' });
        }
        console.error('Create category error:', error);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
});

export default router;
