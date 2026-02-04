import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface User {
    id: number;
    username: string;
    email: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (email: string, password: string) => Promise<void>;
    register: (username: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // 常に匿名ユーザーとして扱う
    const [user] = useState<User | null>({
        id: 1,
        username: 'anonymous',
        email: 'anonymous@example.com'
    });
    const [token] = useState<string | null>('anonymous-token');
    const [loading] = useState(false);

    const login = async () => {
        console.warn('Login is disabled');
    };

    const register = async () => {
        console.warn('Register is disabled');
    };

    const logout = () => {
        console.warn('Logout is disabled');
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                login,
                register,
                logout,
                isAuthenticated: true,
                loading,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
