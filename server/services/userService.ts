import db from '../db/database';

export interface User {
    id: number;
    email: string;
    name: string;
    nickname?: string;
    bio?: string;
    photo?: string;
    profileImage?: string;
    birth_date?: string;
    gender?: string;
    defaultRankingVisibility?: string;
    rankingVisibilityLimit?: number;
    created_at?: string;
}

export const UserService = {
    findByEmail: async (email: string): Promise<User | undefined> => {
        const result = await db.execute({
            sql: 'SELECT * FROM users WHERE email = ?',
            args: [email]
        });
        return result.rows[0] as unknown as User | undefined;
    },

    findById: async (id: number): Promise<User | undefined> => {
        const result = await db.execute({
            sql: 'SELECT * FROM users WHERE id = ?',
            args: [id]
        });
        return result.rows[0] as unknown as User | undefined;
    },

    createUser: async (email: string, name: string, photo: string): Promise<User> => {
        const result = await db.execute({
            sql: 'INSERT INTO users (email, name, photo) VALUES (?, ?, ?)',
            args: [email, name, photo]
        });
        const lastId = Number(result.lastInsertRowid);
        const user = await UserService.findById(lastId);
        if (!user) throw new Error('Failed to retrieve created user');
        return user;
    },

    updateUser: async (id: number, data: Partial<User>): Promise<User | undefined> => {
        const keys = Object.keys(data).filter(k => k !== 'id' && k !== 'email' && k !== 'created_at');
        if (keys.length === 0) return undefined;

        const setClause = keys.map(k => `${k} = ?`).join(', ');
        const values = keys.map(k => (data as any)[k]);
        values.push(id);

        await db.execute({
            sql: `UPDATE users SET ${setClause} WHERE id = ?`,
            args: values
        });

        return UserService.findById(id);
    },

    saveQuizResult: async (userId: number, profile: any, cluster: any): Promise<void> => {
        await db.execute({
            sql: 'INSERT INTO quiz_results (user_id, profile_json, cluster_json) VALUES (?, ?, ?)',
            args: [userId, JSON.stringify(profile), JSON.stringify(cluster)]
        });
    },

    getLatestResult: async (userId: number): Promise<any> => {
        const result = await db.execute({
            sql: 'SELECT * FROM quiz_results WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
            args: [userId]
        });

        const row = result.rows[0] as any;
        if (!row) return null;

        const clusterSnapshot = JSON.parse(row.cluster_json);
        const clusterId = clusterSnapshot.cluster_id;

        try {
            const clusterResult = await db.execute({
                sql: 'SELECT * FROM clusters WHERE cluster_id = ?',
                args: [clusterId]
            });
            const clusterRow = clusterResult.rows[0];

            if (clusterRow) {
                return {
                    ...row,
                    profile: JSON.parse(row.profile_json),
                    cluster: clusterRow // Use fresh data
                };
            }
        } catch (err) {
            console.error('Failed to fetch fresh cluster, using snapshot:', err);
        }

        // Fallback to snapshot
        return {
            ...row,
            profile: JSON.parse(row.profile_json),
            cluster: clusterSnapshot
        };
    }
};
