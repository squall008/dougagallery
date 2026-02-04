import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
    baseURL: API_BASE_URL,
});

// リクエストインターセプター（認証トークンを自動付与）
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// レスポンスインターセプター（エラーハンドリング）
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// 認証API
export const authAPI = {
    register: (data: { username: string; email: string; password: string }) =>
        api.post('/auth/register', data),
    login: (data: { email: string; password: string }) =>
        api.post('/auth/login', data),
    getMe: () => api.get('/auth/me'),
};

// 動画API
export const videoAPI = {
    getVideos: (params?: any) => api.get('/videos', { params }),
    getVideo: (id: number) => api.get(`/videos/${id}`),
    uploadVideo: (formData: FormData, onUploadProgress?: (progressEvent: any) => void) =>
        api.post('/videos', formData, {
            onUploadProgress,
        }),
    updateVideo: (id: number, data: any) => api.put(`/videos/${id}`, data),
    deleteVideo: (id: number) => api.delete(`/videos/${id}`),
    getStreamUrl: (id: number) => `${API_BASE_URL}/videos/${id}/stream`,
};

// カテゴリAPI
export const categoryAPI = {
    getCategories: () => api.get('/categories'),
    createCategory: (data: { name: string; description?: string }) =>
        api.post('/categories', data),
};

// タグAPI
export const tagAPI = {
    getTags: () => api.get('/tags'),
    createTag: (data: { name: string }) => api.post('/tags', data),
};

// お気に入りAPI
export const favoriteAPI = {
    getFavorites: () => api.get('/favorites'),
    addFavorite: (videoId: number) => api.post(`/favorites/${videoId}`),
    removeFavorite: (videoId: number) => api.delete(`/favorites/${videoId}`),
    checkFavorite: (videoId: number) => api.get(`/favorites/check/${videoId}`),
};

export default api;
