import { Router, Request, Response } from 'express';
import { query } from '../config/database';
import { upload } from '../middleware/upload';
import fs from 'fs';
import path from 'path';

const router = Router();

// 動画一覧取得（検索・フィルタ対応）
router.get('/', async (req: Request, res: Response) => {
    try {
        const {
            search = '',
            category,
            tags,
            sort = 'newest',
            page = '1',
            limit = '12',
        } = req.query;

        const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

        let queryText = `
      SELECT v.*, u.username, c.name as category_name,
        string_agg(t.name, ',') as tags_list
      FROM videos v
      JOIN users u ON v.user_id = u.id
      LEFT JOIN categories c ON v.category_id = c.id
      LEFT JOIN video_tags vt ON v.id = vt.video_id
      LEFT JOIN tags t ON vt.tag_id = t.id
      WHERE 1=1
    `;

        const params: any[] = [];
        let paramIndex = 1;

        if (search) {
            queryText += ` AND (v.title LIKE $${paramIndex} OR v.description LIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        if (category) {
            queryText += ` AND v.category_id = $${paramIndex}`;
            params.push(category);
            paramIndex++;
        }

        if (tags) {
            const tagIds = (tags as string).split(',').map(Number);
            const placeholders = tagIds.map((_, i) => `$${paramIndex + i}`).join(',');
            queryText += ` AND v.id IN (
                SELECT video_id FROM video_tags WHERE tag_id IN (${placeholders})
            )`;
            params.push(...tagIds);
            paramIndex += tagIds.length;
        }

        queryText += ' GROUP BY v.id, u.username, c.name';

        switch (sort) {
            case 'oldest':
                queryText += ' ORDER BY v.created_at ASC';
                break;
            case 'views':
                queryText += ' ORDER BY v.views DESC';
                break;
            case 'newest':
            default:
                queryText += ' ORDER BY v.created_at DESC';
                break;
        }

        queryText += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(parseInt(limit as string), offset);

        const result = await query(queryText, params);

        const videos = result.rows.map(video => ({
            ...video,
            tags: video.tags_list ? video.tags_list.split(',') : []
        }));

        let countQuery = 'SELECT COUNT(DISTINCT v.id) as count FROM videos v WHERE 1=1';
        const countParams: any[] = [];
        let countParamIndex = 1;

        if (search) {
            countQuery += ` AND (v.title LIKE $${countParamIndex} OR v.description LIKE $${countParamIndex})`;
            countParams.push(`%${search}%`);
            countParamIndex++;
        }

        if (category) {
            countQuery += ` AND v.category_id = $${countParamIndex}`;
            countParams.push(category);
            countParamIndex++;
        }

        if (tags) {
            const tagIds = (tags as string).split(',').map(Number);
            const placeholders = tagIds.map((_, i) => `$${countParamIndex + i}`).join(',');
            countQuery += ` AND v.id IN (
                SELECT video_id FROM video_tags WHERE tag_id IN (${placeholders})
            )`;
            countParams.push(...tagIds);
        }

        const countResult = await query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].count);

        res.json({
            videos,
            pagination: {
                page: parseInt(page as string),
                limit: parseInt(limit as string),
                total,
                totalPages: Math.ceil(total / parseInt(limit as string)),
            },
        });
    } catch (error) {
        console.error('Get videos error:', error);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
});

// 動画詳細取得
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const result = await query(
            `SELECT v.*, u.username, c.name as category_name,
                string_agg(t.id || ':' || t.name, ',') as tags_info
            FROM videos v
            JOIN users u ON v.user_id = u.id
            LEFT JOIN categories c ON v.category_id = c.id
            LEFT JOIN video_tags vt ON v.id = vt.video_id
            LEFT JOIN tags t ON vt.tag_id = t.id
            WHERE v.id = $1
            GROUP BY v.id, u.username, c.name`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: '動画が見つかりません' });
        }

        const video = { ...result.rows[0] };
        video.tags = video.tags_info ? video.tags_info.split(',').map((info: string) => {
            const [tid, name] = info.split(':');
            return { id: parseInt(tid), name };
        }) : [];

        await query('UPDATE videos SET views = views + 1 WHERE id = $1', [id]);

        res.json({ video });
    } catch (error) {
        console.error('Get video error:', error);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
});

// 動画アップロード
router.post('/', upload.single('video'), async (req: Request, res: Response) => {
    try {
        console.log('--- Upload Start ---');
        if (!req.file) {
            console.error('No file in request');
            return res.status(400).json({ error: '動画ファイルが必要です' });
        }

        const { title, description, category_id, tags } = req.body;
        console.log('Request body:', { title, category_id, tags });
        console.log('File:', req.file.path);

        if (!title) {
            console.error('Title is missing');
            if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: 'タイトルは必須です' });
        }

        const anonymousUserId = 1;

        console.log('Inserting video records...');
        const videoResult = await query(
            `INSERT INTO videos (user_id, category_id, title, description, filename, file_path, file_size)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [
                anonymousUserId,
                category_id || null,
                title,
                description || null,
                req.file.filename,
                req.file.path,
                req.file.size,
            ]
        );

        console.log('Video insert result rows length:', videoResult.rows.length);

        if (videoResult.rows.length === 0) {
            throw new Error('動画の保存に成功しましたが、データの取得に失敗しました');
        }

        const video = videoResult.rows[0];

        if (tags) {
            console.log('Processing tags:', tags);
            const tagArray = typeof tags === 'string' ? JSON.parse(tags) : tags;
            for (const tagName of tagArray) {
                await query(
                    'INSERT INTO tags (name) VALUES ($1) ON CONFLICT(name) DO UPDATE SET name = EXCLUDED.name',
                    [tagName.trim()]
                );

                const tagResult = await query('SELECT id FROM tags WHERE name = $1', [tagName.trim()]);
                const tagId = tagResult.rows[0].id;

                await query(
                    'INSERT INTO video_tags (video_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                    [video.id, tagId]
                );
            }
        }

        console.log('--- Upload Success ---');
        res.status(201).json({ video });
    } catch (error: any) {
        console.error('--- Upload Failed ---');
        console.error('Error detail:', error);
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ error: error.message || 'サーバーエラーが発生しました' });
    }
});

// 動画更新
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { title, description, category_id, tags } = req.body;

        const videoCheck = await query('SELECT id FROM videos WHERE id = $1', [id]);
        if (videoCheck.rows.length === 0) {
            return res.status(404).json({ error: '動画が見つかりません' });
        }

        await query(
            `UPDATE videos SET title = $1, description = $2, category_id = $3, updated_at = CURRENT_TIMESTAMP
             WHERE id = $4`,
            [title, description || null, category_id || null, id]
        );

        if (tags !== undefined) {
            await query('DELETE FROM video_tags WHERE video_id = $1', [id]);
            const tagArray = typeof tags === 'string' ? JSON.parse(tags) : tags;
            for (const tagName of tagArray) {
                await query(
                    'INSERT INTO tags (name) VALUES ($1) ON CONFLICT(name) DO UPDATE SET name = EXCLUDED.name',
                    [tagName.trim()]
                );
                const tagResult = await query('SELECT id FROM tags WHERE name = $1', [tagName.trim()]);
                const tagId = tagResult.rows[0].id;

                await query('INSERT INTO video_tags (video_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [id, tagId]);
            }
        }

        res.json({ message: '動画を更新しました' });
    } catch (error) {
        console.error('Update video error:', error);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
});

// 動画削除
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const videoCheck = await query('SELECT file_path FROM videos WHERE id = $1', [id]);
        if (videoCheck.rows.length === 0) {
            return res.status(404).json({ error: '動画が見つかりません' });
        }

        const filePath = videoCheck.rows[0].file_path;
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        await query('DELETE FROM videos WHERE id = $1', [id]);
        res.json({ message: '動画を削除しました' });
    } catch (error) {
        console.error('Delete video error:', error);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
});

// 動画ファイル配信
router.get('/:id/stream', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await query('SELECT file_path FROM videos WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: '動画が見つかりません' });

        const filePath = result.rows[0].file_path;
        if (!fs.existsSync(filePath)) return res.status(404).json({ error: '動画ファイルが見つかりません' });

        const stat = fs.statSync(filePath);
        const fileSize = stat.size;
        const range = req.headers.range;

        if (range) {
            const parts = range.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunksize = end - start + 1;
            const file = fs.createReadStream(filePath, { start, end });
            res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': 'video/mp4',
            });
            file.pipe(res);
        } else {
            res.writeHead(200, {
                'Content-Length': fileSize,
                'Content-Type': 'video/mp4',
            });
            fs.createReadStream(filePath).pipe(res);
        }
    } catch (error) {
        console.error('Stream video error:', error);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
});

export default router;
