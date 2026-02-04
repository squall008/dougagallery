import React, { useState, useEffect } from 'react';
import { videoAPI, favoriteAPI } from '../services/api';
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

const Favorites: React.FC = () => {
    const [favorites, setFavorites] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFavorites();
    }, []);

    const fetchFavorites = async () => {
        try {
            const response = await favoriteAPI.getFavorites();
            setFavorites(response.data.favorites);
        } catch (error) {
            console.error('Failed to fetch favorites:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '4rem 0' }}>
            <div style={{ marginBottom: '3rem' }}>
                <h1 style={{ marginBottom: '1rem' }}>お気に入り動画</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>あなたが保存した動画コレクションです。</p>
            </div>

            {loading ? (
                <div className="loading">
                    <div className="spinner"></div>
                </div>
            ) : favorites.length === 0 ? (
                <div className="glass-panel" style={{ textAlign: 'center', padding: '6rem 0', color: 'var(--text-dim)' }}>
                    <div style={{ fontSize: '5rem', marginBottom: '1.5rem' }}>❤️</div>
                    <h2 style={{ color: 'var(--text-muted)' }}>お気に入りの動画はまだありません</h2>
                    <p style={{ marginTop: '1rem' }}>気になる動画を見つけて保存してみましょう！</p>
                </div>
            ) : (
                <div className="grid grid-3">
                    {favorites.map((video) => (
                        <VideoCard key={video.id} video={video} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Favorites;
