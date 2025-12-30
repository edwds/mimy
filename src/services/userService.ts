import { UserProfile, QuizResult } from '../types';
import { ApiService } from './api';

let currentUser: UserProfile | null = null;
const USER_KEY = 'mimy_user_id';

export const UserService = {
  // Login with google simulation
  login: async (email: string, name: string, photo: string): Promise<UserProfile> => {
    const user = await ApiService.login(email, name, photo);
    localStorage.setItem(USER_KEY, user.id.toString());

    // Transform backend user to frontend UserProfile
    currentUser = {
      ...user,
      profileImage: user.photo,
      birthDate: user.birth_date,
      gender: user.gender
    };
    return currentUser!;
  },

  // Check valid session
  initUser: async (): Promise<UserProfile | null> => {
    const userId = localStorage.getItem(USER_KEY);
    if (!userId) return null;
    try {
      const user = await ApiService.getUser(Number(userId));
      currentUser = {
        ...user,
        profileImage: user.photo,
        birthDate: user.birth_date,
        gender: user.gender
      };
      return currentUser;
    } catch (e) {
      console.error('Failed to restore session:', e);
      localStorage.removeItem(USER_KEY);
      return null;
    }
  },

  saveUser: async (user: UserProfile): Promise<void> => {
    if (!currentUser) return;
    const updated = await ApiService.updateUser(Number(localStorage.getItem(USER_KEY)), {
      nickname: user.nickname,
      bio: user.bio,
      photo: user.profileImage,
      birth_date: user.birthDate,
      gender: user.gender
    } as any);
    currentUser = { ...currentUser, ...updated };
  },

  getUser: (): UserProfile | null => {
    return currentUser;
  },

  saveQuizResult: async (result: QuizResult): Promise<void> => {
    const userId = Number(localStorage.getItem(USER_KEY));
    if (!userId) throw new Error('No user logged in');
    await ApiService.saveQuizResult(userId, result.profile, result.cluster);
  },

  getLatestResult: async (email: string): Promise<QuizResult | null> => {
    // We are using userId now, ignoring email arg for backend call
    const userId = Number(localStorage.getItem(USER_KEY));
    if (!userId) return null;
    return await ApiService.getLatestResult(userId);
  },

  clearAuth: (): void => {
    localStorage.removeItem(USER_KEY);
    currentUser = null;
  },

  logout: (): void => {
    UserService.clearAuth();
  },
};

