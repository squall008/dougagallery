import React from 'react';
import { useNavigate } from 'react-router-dom';

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

interface VideoCardProps {
    video: Video;
}

const VideoCard: React.FC<VideoCardProps> = ({ video }) => {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(`/video/${video.id}`);
    };

    return (
        <div className="video-card" onClick={handleClick}>
            <div className="video-thumbnail">
                <span style={{ fontSize: '3.5rem' }}>🎬</span>
                <div style={{
                    position: 'absolute',
                    bottom: '0',
                    left: '0',
                    right: '0',
                    height: '50%',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                    display: 'flex',
                    alignItems: 'flex-end',
                    padding: '1rem',
                    opacity: 0,
                    transition: 'var(--transition)'
                }} className="card-overlay">
                    <span style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>VIEW NOW</span>
                </div>
            </div>
            <div className="video-info">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <h3 className="video-title" style={{ flex: 1 }}>{video.title}</h3>
                </div>

                <div className="video-meta">
                    <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{video.username}</span>
                    <span style={{ opacity: 0.5 }}>•</span>
                    <span>{video.views} views</span>
                </div>

                {video.category_name && (
                    <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontSize: '1rem' }}>📁</span> {video.category_name}
                    </div>
                )}

                {video.tags && video.tags.length > 0 && (
                    <div className="video-tags" style={{ marginTop: '1rem' }}>
                        {video.tags.slice(0, 3).map((tag, index) => (
                            <span key={index} className="tag">
                                {tag}
                            </span>
                        ))}
                        {video.tags.length > 3 && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', alignSelf: 'center' }}>
                                +{video.tags.length - 3}
                            </span>
                        )}
                    </div>
                )}
            </div>

            <style>{`
                .video-card:hover .card-overlay {
                    opacity: 1;
                }
            `}</style>
        </div>
    );
};

export default VideoCard;
