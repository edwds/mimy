import { AxisKey, Cluster, UserProfile, QuizResult } from '../types';

const API_BASE_URL = '/api';

export const ApiService = {
  matchCluster: async (profile: Record<AxisKey, number>): Promise<Cluster> => {
    try {
      const response = await fetch(`${API_BASE_URL}/match-cluster`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profile }),
      });

      if (!response.ok) {
        throw new Error(`Failed to match cluster: ${response.statusText}`);
      }

      const cluster = await response.json();
      return cluster;
    } catch (error) {
      console.error('Error matching cluster:', error);
      throw error;
    }
  },

  getClusters: async (): Promise<Cluster[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/clusters`);

      if (!response.ok) {
        throw new Error(`Failed to fetch clusters: ${response.statusText}`);
      }

      const clusters = await response.json();
      return clusters;
    } catch (error) {
      console.error('Error fetching clusters:', error);
      throw error;
    }
  },

  login: async (email: string, name: string, photo: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, photo }),
    });
    if (!response.ok) throw new Error('Login failed');
    return response.json();
  },

  getUser: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/users/${id}`);
    if (!response.ok) throw new Error('Get user failed');
    return response.json();
  },

  updateUser: async (id: number, data: Partial<UserProfile>) => {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Update failed');
    return response.json();
  },

  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error('Upload failed');
    const data = await response.json();
    return data.imageUrl;
  },

  saveQuizResult: async (userId: number, profile: any, cluster: any) => {
    const response = await fetch(`${API_BASE_URL}/quiz`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, profile, cluster }),
    });
    if (!response.ok) throw new Error('Save quiz failed');
    return response.json();
  },

  getLatestResult: async (userId: number) => {
    const response = await fetch(`${API_BASE_URL}/quiz/${userId}`);
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error('Get result failed');
    }
    return response.json();
  },

  getFeed: async (userId: number, page: number = 1): Promise<any[]> => {
    const response = await fetch(`${API_BASE_URL}/feed/${userId}?page=${page}`);
    if (!response.ok) return [];
    return response.json();
  },

  toggleLike: async (reviewId: string | number, userId: number): Promise<{ liked: boolean; count: number }> => {
    const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (!response.ok) throw new Error('Toggle like failed');
    return response.json();
  },

  getComments: async (reviewId: string | number): Promise<any[]> => {
    const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}/comments`);
    if (!response.ok) return [];
    return response.json();
  },

  addComment: async (reviewId: string | number, userId: number, text: string) => {
    const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, text }),
    });
    if (!response.ok) throw new Error('Add comment failed');
    return response.json();
  },

  deleteComment: async (commentId: number, userId: number) => {
    const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (!response.ok) throw new Error('Delete comment failed');
    return response.json();
  }
};

