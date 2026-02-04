import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { videoAPI, favoriteAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface Video {
    id: number;
    title: string;
    description: string;
    username: string;
    user_id: number;
    category_name: string;
    tags: { id: number; name: string }[];
    views: number;
    created_at: string;
}

const VideoDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [video, setVideo] = useState<Video | null>(null);
    const [loading, setLoading] = useState(true);
    const [isFavorite, setIsFavorite] = useState(false);
    const [copied, setCopied] = useState(false);
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (id) {
            fetchVideo();
            if (isAuthenticated) {
                checkFavorite();
            }
        }
    }, [id, isAuthenticated]);

    const fetchVideo = async () => {
        try {
            const response = await videoAPI.getVideo(parseInt(id!));
            setVideo(response.data.video);
        } catch (error) {
            console.error('Failed to fetch video:', error);
        } finally {
            setLoading(false);
        }
    };

    const checkFavorite = async () => {
        try {
            const response = await favoriteAPI.checkFavorite(parseInt(id!));
            setIsFavorite(response.data.isFavorite);
        } catch (error) {
            console.error('Failed to check favorite:', error);
        }
    };

    const handleFavoriteToggle = async () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        try {
            if (isFavorite) {
                await favoriteAPI.removeFavorite(parseInt(id!));
                setIsFavorite(false);
            } else {
                await favoriteAPI.addFavorite(parseInt(id!));
                setIsFavorite(true);
            }
        } catch (error) {
            console.error('Failed to toggle favorite:', error);
        }
    };

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('この動画を削除してもよろしいですか?')) {
            return;
        }

        try {
            await videoAPI.deleteVideo(parseInt(id!));
            navigate('/');
        } catch (error) {
            console.error('Failed to delete video:', error);
            alert('動画の削除に失敗しました');
        }
    };

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
            </div>
        );
    }

    if (!video) {
        return (
            <div style={{ paddingTop: '5rem', textAlign: 'center' }}>
                <h2 style={{ color: 'var(--text-dim)' }}>動画が見つかりませんでした</h2>
                <button className="btn btn-primary" style={{ marginTop: '2rem' }} onClick={() => navigate('/')}>
                    ホームに戻る
                </button>
            </div>
        );
    }

    return (
        <div style={{ paddingTop: '2rem', paddingBottom: '5rem' }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                {/* 動画プレイヤー用コンテナ */}
                <div className="glass-panel" style={{
                    overflow: 'hidden',
                    borderRadius: 'var(--radius-lg)',
                    marginBottom: '2.5rem',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
                }}>
                    <video
                        controls
                        autoPlay
                        style={{ width: '100%', display: 'block', background: '#000' }}
                        src={videoAPI.getStreamUrl(video.id)}
                    >
                        お使いのブラウザは動画タグをサポートしていません。
                    </video>
                </div>

                {/* 動画情報セクション */}
                <div className="glass-panel" style={{ padding: '2.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
                        <div style={{ flex: 1, minWidth: '300px' }}>
                            <h1 style={{ marginBottom: '1rem', fontSize: '2.2rem' }}>{video.title}</h1>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                                <span style={{ background: 'var(--bg-surface-light)', padding: '0.3rem 0.8rem', borderRadius: '20px' }}>
                                    👤 {video.username}
                                </span>
                                <span>👁️ {video.views} views</span>
                                <span style={{ opacity: 0.5 }}>{new Date(video.created_at).toLocaleDateString('ja-JP')}</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={handleShare}
                                className="btn btn-secondary"
                                style={{ minWidth: '140px', position: 'relative' }}
                            >
                                {copied ? '✅ コピー完了' : '🔗 共有リンク'}
                                {copied && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '-40px',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        background: 'var(--success)',
                                        color: 'white',
                                        padding: '0.4rem 0.8rem',
                                        borderRadius: '4px',
                                        fontSize: '0.8rem',
                                        fontWeight: 600,
                                        whiteSpace: 'nowrap',
                                        animation: 'fadeOut 2s forwards'
                                    }}>
                                        リンクをコピーしました！
                                    </div>
                                )}
                            </button>
                            <button
                                onClick={handleFavoriteToggle}
                                className={isFavorite ? 'btn btn-primary' : 'btn btn-secondary'}
                                style={{ minWidth: '160px' }}
                            >
                                {isFavorite ? '❤️ Fav済み' : '🤍 お気に入り'}
                            </button>
                            {user && user.id === video.user_id && (
                                <button onClick={handleDelete} className="btn btn-secondary" style={{ color: 'var(--error)', borderColor: 'hsla(0, 85%, 60%, 0.2)' }}>
                                    🗑️ 削除
                                </button>
                            )}
                        </div>
                    </div>

                    <div style={{ height: '1px', background: 'var(--border)', margin: '2.5rem 0' }}></div>

                    {video.description && (
                        <div style={{ marginBottom: '2.5rem' }}>
                            <h3 style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>概要</h3>
                            <p style={{ lineHeight: 1.8, color: 'var(--text-main)', fontSize: '1.1rem', whiteSpace: 'pre-wrap' }}>
                                {video.description}
                            </p>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap' }}>
                        {video.category_name && (
                            <div>
                                <h3 style={{ color: 'var(--text-muted)', marginBottom: '0.8rem', fontSize: '0.9rem', textTransform: 'uppercase' }}>カテゴリ</h3>
                                <span className="btn-secondary" style={{ padding: '0.4rem 1rem', display: 'inline-block', borderRadius: '8px' }}>
                                    📁 {video.category_name}
                                </span>
                            </div>
                        )}

                        {video.tags && video.tags.length > 0 && (
                            <div style={{ flex: 1 }}>
                                <h3 style={{ color: 'var(--text-muted)', marginBottom: '0.8rem', fontSize: '0.9rem', textTransform: 'uppercase' }}>タグ</h3>
                                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                                    {video.tags.map((tag) => (
                                        <span key={tag.id} className="tag" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                                            #{tag.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <style>{`
                @keyframes fadeOut {
                    0% { opacity: 0; transform: translate(-50%, 10px); }
                    10% { opacity: 1; transform: translate(-50%, 0); }
                    80% { opacity: 1; }
                    100% { opacity: 0; }
                }
            `}</style>
        </div>
    );
};

export default VideoDetail;
