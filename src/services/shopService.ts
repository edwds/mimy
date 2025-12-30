import { Shop } from '../types';

const API_BASE = 'http://localhost:3001/api';

export const ShopService = {
    searchShops: async (query: string): Promise<Shop[]> => {
        if (!query) return [];
        const response = await fetch(`${API_BASE}/shops/search?q=${encodeURIComponent(query)}`);
        if (!response.ok) return [];
        return response.json();
    },

    getExploreShops: async (): Promise<Shop[]> => {
        const response = await fetch(`${API_BASE}/shops/explore`);
        if (!response.ok) return [];
        return response.json();
    },

    getMyList: async (email: string): Promise<any[]> => {
        const response = await fetch(`${API_BASE}/shops/mylist/${email}`);
        if (!response.ok) return [];
        return response.json();
    },

    addToMyList: async (email: string, shopId: number | string): Promise<void> => {
        const response = await fetch(`${API_BASE}/shops/mylist`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, shopId })
        });
        if (!response.ok && response.status !== 409) {
            throw new Error('Failed to add to MyList');
        }
    },

    removeFromMyList: async (email: string, shopId: number | string): Promise<void> => {
        const response = await fetch(`${API_BASE}/shops/mylist/${email}/${shopId}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to remove from MyList');
    }
};
