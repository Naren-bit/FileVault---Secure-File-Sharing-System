import axios from 'axios';

const API_URL = '/api';

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true, // Required for httpOnly cookies
    headers: {
        'Content-Type': 'application/json'
    }
});

// Auth API
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    verifyMFA: (token) => api.post('/auth/verify-mfa', { token }),
    getMe: () => api.get('/auth/me'),
    logout: () => api.post('/auth/logout'),
    // Key Exchange - Get user's public key
    getPublicKey: (userId) => api.get(`/auth/public-key/${userId}`)
};

// Files API
export const filesAPI = {
    getFiles: (params) => api.get('/files', { params }),
    upload: (formData, password) => api.post('/files/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
            'X-Encryption-Password': password
        }
    }),
    download: (fileId, password) => api.post(`/files/${fileId}/download`, { password }, {
        responseType: 'blob',
        headers: {
            'X-Encryption-Password': password
        }
    }),
    // RSA Key Exchange Download
    keyExchangeDownload: (fileId, guestPublicKey) => api.post(`/files/${fileId}/key-exchange`, {
        guestPublicKey
    }),
    share: (fileId, expiryMinutes) => api.post(`/files/${fileId}/share`, { expiryMinutes }),
    delete: (fileId) => api.delete(`/files/${fileId}`),
    getSharedFile: (token) => api.get(`/files/share/${token}`)
};

// Admin API
export const adminAPI = {
    getStats: () => api.get('/admin/stats'),
    getLogs: (params) => api.get('/admin/logs', { params }),
    getUsers: (params) => api.get('/admin/users', { params }),
    updateUserRole: (userId, role) => api.put(`/admin/users/${userId}/role`, { role }),
    unlockUser: (userId) => api.post(`/admin/users/${userId}/unlock`)
};

export default api;

