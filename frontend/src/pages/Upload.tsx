import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { videoAPI, categoryAPI } from '../services/api';

const Upload: React.FC = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [tags, setTags] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await categoryAPI.getCategories();
            setCategories(response.data.categories);
        } catch (err) {
            console.error('Failed to fetch categories:', err);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (selectedFile.type !== 'video/mp4') {
                setError('MP4形式の動画のみアップロード可能です');
                return;
            }
            if (selectedFile.size > 500 * 1024 * 1024) {
                setError('ファイルサイズは500MB以下にしてください');
                return;
            }
            setFile(selectedFile);
            setError('');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!file) {
            setError('動画ファイルを選択してください');
            return;
        }

        if (!title.trim()) {
            setError('タイトルを入力してください');
            return;
        }

        setUploading(true);
        setUploadProgress(0);

        try {
            const formData = new FormData();
            formData.append('video', file);
            formData.append('title', title);
            if (description) formData.append('description', description);
            if (categoryId) formData.append('category_id', categoryId);
            if (tags) {
                const tagArray = tags.split(',').map((t) => t.trim()).filter((t) => t);
                formData.append('tags', JSON.stringify(tagArray));
            }

            await videoAPI.uploadVideo(formData, (progressEvent) => {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                setUploadProgress(percentCompleted);
            });

            navigate('/');
        } catch (err: any) {
            console.error('Upload error:', err);
            setError(err.response?.data?.error || 'アップロードに失敗しました');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div style={{ padding: '4rem 0' }}>
            <div className="glass-panel card-form">
                <h2 style={{ marginBottom: '2rem', textAlign: 'center', fontSize: '2.5rem' }}>動画を公開する</h2>

                {error && (
                    <div className="message message-error" style={{ marginBottom: '2rem' }}>
                        ⚠️ {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>動画ファイル (MP4, Max 500MB)</label>
                        <div style={{
                            border: '2px dashed var(--border)',
                            borderRadius: 'var(--radius-md)',
                            padding: '2rem',
                            textAlign: 'center',
                            background: file ? 'var(--primary-glow)' : 'transparent',
                            transition: 'var(--transition)'
                        }}>
                            <input
                                type="file"
                                accept="video/mp4"
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                                id="video-input"
                            />
                            <label htmlFor="video-input" style={{ cursor: 'pointer', margin: 0, color: file ? 'var(--primary)' : 'var(--text-muted)' }}>
                                {file ? `✅ ${file.name}` : '📁 クリックして動画を選択してください'}
                            </label>
                        </div>
                    </div>

                    <div className="input-group">
                        <label>タイトル</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="キャッチーなタイトルを付けよう"
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label>説明</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="動画の見どころを紹介してください"
                            style={{ minHeight: '150px' }}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div className="input-group">
                            <label>カテゴリ</label>
                            <select
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                            >
                                <option value="">選択してください</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="input-group">
                            <label>タグ (カンマ区切り)</label>
                            <input
                                type="text"
                                value={tags}
                                onChange={(e) => setTags(e.target.value)}
                                placeholder="例: アニメ,音楽,チュートリアル"
                            />
                        </div>
                    </div>

                    {uploading && (
                        <div style={{ marginBottom: '2rem' }}>
                            <div style={{ height: '10px', background: 'var(--bg-deep)', borderRadius: '5px', overflow: 'hidden' }}>
                                <div style={{
                                    width: `${uploadProgress}%`,
                                    height: '100%',
                                    background: 'linear-gradient(to right, var(--primary), var(--secondary))',
                                    transition: 'width 0.3s ease'
                                }}></div>
                            </div>
                            <div style={{ textAlign: 'center', marginTop: '0.5rem', color: 'var(--primary)', fontWeight: 600 }}>
                                アップロード中... {uploadProgress}%
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={uploading}
                        style={{ width: '100%', marginTop: '1rem', padding: '1.2rem' }}
                    >
                        {uploading ? '処理中...' : '🚀 アップロードを開始する'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Upload;
