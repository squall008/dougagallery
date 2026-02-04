import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header: React.FC = () => {
    const { isAuthenticated } = useAuth();
    const location = useLocation();

    return (
        <header className="header">
            <div className="container header-content">
                <Link to="/" className="logo">
                    <span>🎬</span>
                    <span style={{ letterSpacing: '-0.03em' }}>VideoGallery</span>
                </Link>

                <nav className="nav-links">
                    <Link
                        to="/"
                        className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
                    >
                        ホーム
                    </Link>
                    {isAuthenticated && (
                        <>
                            <Link
                                to="/upload"
                                className={`nav-link ${location.pathname === '/upload' ? 'active' : ''}`}
                            >
                                アップロード
                            </Link>
                            <Link
                                to="/favorites"
                                className={`nav-link ${location.pathname === '/favorites' ? 'active' : ''}`}
                            >
                                お気に入り
                            </Link>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
};

export default Header;
