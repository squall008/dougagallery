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
                <div style={{
                    position: 'relative',
                    marginBottom: '2.5rem',
                    background: '#000',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                    boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0,0,0,0.5)',
                    border: '1px solid var(--border-bright)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    maxHeight: 'calc(100vh - 100px)', // 画面の高さに収める
                    minHeight: '400px'
                }}>
                    <video
                        controls
                        autoPlay
                        style={{
                            width: '100%',
                            height: 'auto',
                            maxHeight: 'calc(100vh - 100px)',
                            maxWidth: '100%',
                            objectFit: 'contain',
                            display: 'block'
                        }}
                        src={videoAPI.getStreamUrl(video.id)}
                    >
                        お使いのブラウザは動画タグをサポートしていません。
                    </video>
                </div>

                {/* 動画情報セクション */}
                <div className="glass-panel" style={{ padding: '2.5rem', border: '1px solid var(--border-bright)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
                        <div style={{ flex: 1, minWidth: '300px' }}>
                            <h1 style={{ marginBottom: '1rem', fontSize: '2.2rem', background: 'linear-gradient(to right, #fff, var(--text-muted))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{video.title}</h1>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                                <span style={{ background: 'var(--bg-surface-light)', padding: '0.4rem 1rem', borderRadius: '30px', border: '1px solid var(--border)', color: 'var(--primary)', fontWeight: 600 }}>
                                    👤 {video.username}
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <span style={{ fontSize: '1.2rem' }}>👁️</span> {video.views.toLocaleString()} views
                                </span>
                                <span style={{ opacity: 0.6 }}>{new Date(video.created_at).toLocaleDateString('ja-JP')}</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <button
                                onClick={handleShare}
                                className="btn btn-secondary"
                                style={{ minWidth: '130px', position: 'relative', borderRadius: 'var(--radius-md)' }}
                            >
                                {copied ? '✅ コピー完了' : '🔗 共有リンク'}
                                {copied && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '-45px',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        background: 'var(--primary)',
                                        color: 'white',
                                        padding: '0.5rem 1rem',
                                        borderRadius: 'var(--radius-sm)',
                                        fontSize: '0.8rem',
                                        fontWeight: 700,
                                        whiteSpace: 'nowrap',
                                        boxShadow: '0 10px 20px rgba(0,0,0,0.3)',
                                        animation: 'fadeOut 2s forwards'
                                    }}>
                                        リンクをコピーしました！
                                    </div>
                                )}
                            </button>
                            <button
                                onClick={handleFavoriteToggle}
                                className={isFavorite ? 'btn btn-primary' : 'btn btn-secondary'}
                                style={{ minWidth: '150px', borderRadius: 'var(--radius-md)' }}
                            >
                                {isFavorite ? '❤️ お気に入り済' : '🤍 お気に入り'}
                            </button>
                            {user && user.id === video.user_id && (
                                <button
                                    onClick={handleDelete}
                                    className="btn btn-secondary"
                                    style={{ color: 'var(--accent)', borderColor: 'hsla(330, 100%, 60%, 0.2)', borderRadius: 'var(--radius-md)' }}
                                >
                                    🗑️ 削除
                                </button>
                            )}
                        </div>
                    </div>

                    <div style={{ height: '1px', background: 'linear-gradient(to right, var(--border-bright), transparent)', margin: '2.5rem 0' }}></div>

                    {video.description && (
                        <div style={{ marginBottom: '3rem' }}>
                            <h3 style={{ color: 'var(--text-dim)', marginBottom: '1.2rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.15em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ width: '20px', height: '1px', background: 'var(--primary)' }}></span>
                                概要
                            </h3>
                            <p style={{ lineHeight: 1.8, color: 'var(--text-main)', fontSize: '1.05rem', whiteSpace: 'pre-wrap', paddingLeft: '1.5rem', borderLeft: '2px solid var(--border)' }}>
                                {video.description}
                            </p>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '4rem', flexWrap: 'wrap' }}>
                        {video.category_name && (
                            <div>
                                <h3 style={{ color: 'var(--text-dim)', marginBottom: '1rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>カテゴリ</h3>
                                <span style={{
                                    padding: '0.5rem 1.2rem',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    borderRadius: '12px',
                                    background: 'var(--bg-surface-light)',
                                    border: '1px solid var(--border)',
                                    fontSize: '0.95rem',
                                    fontWeight: 500
                                }}>
                                    <span style={{ color: 'var(--secondary)' }}>#</span> {video.category_name}
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
