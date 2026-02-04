import React, { useState, useEffect } from 'react';
import { videoAPI, categoryAPI, tagAPI } from '../services/api';
import VideoCard from '../components/VideoCard';

interface Video {
    id: number;
    title: string;
    description: string;
    username: string;
    category_name: string;
    tags: string[];
    views: number;
    created_at: string;
}

interface Category {
    id: number;
    name: string;
}

interface Tag {
    id: number;
    name: string;
}

const Dashboard: React.FC = () => {
    const [videos, setVideos] = useState<Video[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedTags, setSelectedTags] = useState<number[]>([]);
    const [sort, setSort] = useState('newest');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchCategories();
        fetchTags();
    }, []);

    useEffect(() => {
        fetchVideos();
    }, [search, selectedCategory, selectedTags, sort, page]);

    const fetchCategories = async () => {
        try {
            const response = await categoryAPI.getCategories();
            setCategories(response.data.categories);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    };

    const fetchTags = async () => {
        try {
            const response = await tagAPI.getTags();
            setTags(response.data.tags);
        } catch (error) {
            console.error('Failed to fetch tags:', error);
        }
    };

    const fetchVideos = async () => {
        setLoading(true);
        try {
            const params: any = {
                search,
                sort,
                page,
                limit: 12,
            };

            if (selectedCategory) {
                params.category = selectedCategory;
            }

            if (selectedTags.length > 0) {
                params.tags = selectedTags.join(',');
            }

            const response = await videoAPI.getVideos(params);
            setVideos(response.data.videos);
            setTotalPages(response.data.pagination.totalPages);
        } catch (error) {
            console.error('Failed to fetch videos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTagToggle = (tagId: number) => {
        setSelectedTags((prev) =>
            prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
        );
        setPage(1);
    };

    return (
        <div style={{ padding: '3rem 0' }}>
            {/* 検索・フィルタ */}
            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '3rem' }}>
                <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                    <input
                        type="text"
                        placeholder="🔍 動画を検索..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        style={{ fontSize: '1.2rem', padding: '1.2rem 1.5rem' }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <select
                        value={selectedCategory}
                        onChange={(e) => {
                            setSelectedCategory(e.target.value);
                            setPage(1);
                        }}
                        className="btn-secondary"
                        style={{ padding: '0.6rem 1rem', borderRadius: '8px' }}
                    >
                        <option value="">すべてのカテゴリ</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.name}
                            </option>
                        ))}
                    </select>

                    <select
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                        className="btn-secondary"
                        style={{ padding: '0.6rem 1rem', borderRadius: '8px' }}
                    >
                        <option value="newest">新しい順</option>
                        <option value="oldest">古い順</option>
                        <option value="views">再生回数順</option>
                    </select>
                </div>

                {tags.length > 0 && (
                    <div style={{ marginTop: '1.5rem' }}>
                        <div style={{ color: 'var(--text-dim)', marginBottom: '0.8rem', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            タグでフィルタ
                        </div>
                        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                            {tags.map((tag) => (
                                <button
                                    key={tag.id}
                                    onClick={() => handleTagToggle(tag.id)}
                                    className="tag"
                                    style={{
                                        cursor: 'pointer',
                                        background: selectedTags.includes(tag.id) ? 'var(--primary)' : 'var(--bg-surface-light)',
                                        color: selectedTags.includes(tag.id) ? 'white' : 'var(--text-muted)',
                                        border: '1px solid ' + (selectedTags.includes(tag.id) ? 'var(--primary)' : 'var(--border)'),
                                        transition: 'var(--transition)'
                                    }}
                                >
                                    {tag.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* 動画一覧 */}
            {loading ? (
                <div className="loading">
                    <div className="spinner"></div>
                </div>
            ) : videos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '6rem 0', color: 'var(--text-dim)' }}>
                    <div style={{ fontSize: '5rem', marginBottom: '1.5rem' }}>📹</div>
                    <h2 style={{ color: 'var(--text-muted)' }}>動画が見つかりませんでした</h2>
                </div>
            ) : (
                <>
                    <div className="grid grid-3">
                        {videos.map((video) => (
                            <VideoCard key={video.id} video={video} />
                        ))}
                    </div>

                    {/* ページネーション */}
                    {totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginTop: '4rem' }}>
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="btn btn-secondary"
                                style={{ opacity: page === 1 ? 0.3 : 1 }}
                            >
                                前へ
                            </button>
                            <span style={{ display: 'flex', alignItems: 'center', padding: '0 1.5rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                                {page} <span style={{ margin: '0 0.5rem', opacity: 0.5 }}>/</span> {totalPages}
                            </span>
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="btn btn-secondary"
                                style={{ opacity: page === totalPages ? 0.3 : 1 }}
                            >
                                次へ
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Dashboard;
