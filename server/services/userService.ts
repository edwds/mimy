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
    findByEmail: (email: string): Promise<User | undefined> => {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
                if (err) reject(err);
                else resolve(row as User);
            });
        });
    },

    findById: (id: number): Promise<User | undefined> => {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
                if (err) reject(err);
                else resolve(row as User);
            });
        });
    },

    createUser: (email: string, name: string, photo: string): Promise<User> => {
        return new Promise((resolve, reject) => {
            const stmt = db.prepare('INSERT INTO users (email, name, photo) VALUES (?, ?, ?)');
            stmt.run(email, name, photo, function (err: Error) {
                if (err) reject(err);
                else {
                    db.get('SELECT * FROM users WHERE id = ?', [this.lastID], (err, row) => {
                        if (err) reject(err);
                        else resolve(row as User);
                    });
                }
            });
            stmt.finalize();
        });
    },

    updateUser: (id: number, data: Partial<User>): Promise<User | undefined> => {
        return new Promise((resolve, reject) => {
            const keys = Object.keys(data).filter(k => k !== 'id' && k !== 'email' && k !== 'created_at');
            if (keys.length === 0) return resolve(undefined);

            const setClause = keys.map(k => `${k} = ?`).join(', ');
            const values = keys.map(k => (data as any)[k]);
            values.push(id);

            db.run(`UPDATE users SET ${setClause} WHERE id = ?`, values, function (err) {
                if (err) reject(err);
                else {
                    // Return updated user
                    UserService.findById(id).then(resolve).catch(reject);
                }
            });
        });
    },

    saveQuizResult: (userId: number, profile: any, cluster: any): Promise<void> => {
        return new Promise((resolve, reject) => {
            db.run(
                'INSERT INTO quiz_results (user_id, profile_json, cluster_json) VALUES (?, ?, ?)',
                [userId, JSON.stringify(profile), JSON.stringify(cluster)],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    },

    getLatestResult: (userId: number): Promise<any> => {
        return new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM quiz_results WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
                [userId],
                (err, row: any) => {
                    if (err) reject(err);
                    else {
                        if (!row) resolve(null);
                        else {
                            const clusterSnapshot = JSON.parse(row.cluster_json);
                            const clusterId = clusterSnapshot.cluster_id;

                            // Fetch fresh cluster info from DB
                            db.get('SELECT * FROM clusters WHERE cluster_id = ?', [clusterId], (err, clusterRow: any) => {
                                if (err) {
                                    // Fallback to snapshot if db error
                                    console.error('Failed to fetch fresh cluster, using snapshot:', err);
                                    resolve({
                                        ...row,
                                        profile: JSON.parse(row.profile_json),
                                        cluster: clusterSnapshot
                                    });
                                } else if (clusterRow) {
                                    resolve({
                                        ...row,
                                        profile: JSON.parse(row.profile_json),
                                        cluster: clusterRow // Use fresh data
                                    });
                                } else {
                                    // Fallback if not found in DB
                                    resolve({
                                        ...row,
                                        profile: JSON.parse(row.profile_json),
                                        cluster: clusterSnapshot
                                    });
                                }
                            });
                        }
                    }
                }
            );
        });
    }
};
