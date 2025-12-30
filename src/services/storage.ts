import { UserProfile, QuizResult } from '../types';

const USER_STORAGE_KEY = 'taste_quiz_user';
const RESULTS_STORAGE_KEY = 'taste_quiz_results';

export const StorageService = {
  saveUser: (user: UserProfile): void => {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  },

  getUser: (): UserProfile | null => {
    const data = localStorage.getItem(USER_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  },

  saveQuizResult: (result: QuizResult): void => {
    const history = JSON.parse(localStorage.getItem(RESULTS_STORAGE_KEY) || '[]');
    history.push(result);
    localStorage.setItem(RESULTS_STORAGE_KEY, JSON.stringify(history));
  },

  getLatestResult: (email: string): QuizResult | null => {
    const history: QuizResult[] = JSON.parse(localStorage.getItem(RESULTS_STORAGE_KEY) || '[]');
    const userResults = history.filter(r => r.email === email);
    return userResults.length > 0 ? userResults[userResults.length - 1] : null;
  },

  clearAuth: (): void => {
    localStorage.removeItem(USER_STORAGE_KEY);
  },
};


