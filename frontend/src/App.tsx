import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import VideoDetail from './pages/VideoDetail';
import Upload from './pages/Upload';
import Favorites from './pages/Favorites';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Header />
        <main className="container">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/video/:id" element={<VideoDetail />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/favorites" element={<Favorites />} />
            {/* 認証ページへのアクセスはトップへ */}
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="/register" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </Router>
    </AuthProvider>
  );
};

export default App;
