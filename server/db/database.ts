import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { shops } from './seeds';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Vercel environment check
const isVercel = process.env.VERCEL === '1';

// Database path: User /tmp in production (Vercel) because the fs is read-only
const dbPath = isVercel
    ? path.join('/tmp', 'mimy.db')
    : path.join(__dirname, 'mimy.db');

console.log('Using database at:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initializeTables();
    }
});

function initializeTables() {
    db.serialize(() => {
        // Users Table
        db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      name TEXT,
      nickname TEXT,
      bio TEXT,
      photo TEXT,
      profileImage TEXT,
      birth_date TEXT,
      gender TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

        // Add profileImage column if it doesn't exist (for existing databases)
        db.run("ALTER TABLE users ADD COLUMN profileImage TEXT", (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.error('Error altering users table (profileImage):', err.message);
            }
        });

        // Add defaultRankingVisibility column
        db.run("ALTER TABLE users ADD COLUMN defaultRankingVisibility TEXT DEFAULT 'public'", (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.error('Error altering users table (defaultRankingVisibility):', err.message);
            }
        });

        // Add rankingVisibilityLimit column
        db.run("ALTER TABLE users ADD COLUMN rankingVisibilityLimit INTEGER", (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.error('Error altering users table (rankingVisibilityLimit):', err.message);
            }
        });

        // Add birth_date column
        db.run("ALTER TABLE users ADD COLUMN birth_date TEXT", (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.error('Error altering users table (birth_date):', err.message);
            }
        });

        // Add gender column
        db.run("ALTER TABLE users ADD COLUMN gender TEXT", (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.error('Error altering users table (gender):', err.message);
            }
        });

        // Quiz Results Table
        db.run(`CREATE TABLE IF NOT EXISTS quiz_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      profile_json TEXT,
      cluster_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

        // Reviews Table
        db.run(`CREATE TABLE IF NOT EXISTS reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT,
            shop_id INTEGER,
            establishment_name TEXT,
            category TEXT,
            images_json TEXT,
            visit_date TEXT,
            companions_json TEXT,
            satisfaction TEXT,
            text TEXT,
            keywords_json TEXT,
            rank INTEGER,
            visit_count INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(shop_id) REFERENCES shops(id)
        )`);

        // Add rankingVisibility column to reviews
        db.run("ALTER TABLE reviews ADD COLUMN rankingVisibility TEXT", (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.error('Error altering reviews table (rankingVisibility):', err.message);
            }
        });

        // Rank column is already included in CREATE TABLE
        // db.run("ALTER TABLE reviews ADD COLUMN rank INTEGER");

        // Rankings Table (Fast Index)
        db.run(`CREATE TABLE IF NOT EXISTS rankings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT,
      category TEXT,
      rankings_json TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(email, category)
    )`);

        // Index for fast ranking lookup
        db.run(`CREATE INDEX IF NOT EXISTS idx_reviews_user_category_rank ON reviews(email, category, rank)`);

        // Shops Table (Mock Data)
        db.run(`CREATE TABLE IF NOT EXISTS shops (
            id TEXT PRIMARY KEY,
            shopRef TEXT,
            shopName TEXT,
            shopNameEn TEXT,
            shopNameKo TEXT,
            shopNameJp TEXT,
            detailEn TEXT,
            detailKo TEXT,
            detailJp TEXT,
            foodKind TEXT,
            categoryEnum TEXT,
            landName TEXT,
            landEnum TEXT,
            priceRange TEXT,
            lat TEXT,
            lon TEXT
        )`, (err) => {
            if (err) console.error('Error creating shops table:', err.message);
            else {
                // Check if table is empty
                db.get("SELECT count(*) as count FROM shops", (err, row: { count: number }) => {
                    if (err) console.error('Error checking shops count:', err);
                    else if (row.count === 0) {
                        console.log('Populating shops table with mock data...');
                        console.log('Populating shops table with mock data...');
                        try {
                            const stmt = db.prepare("INSERT INTO shops (id, shopRef, shopName, shopNameEn, shopNameKo, shopNameJp, detailEn, detailKo, detailJp, foodKind, categoryEnum, landName, landEnum, priceRange, lat, lon) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                            db.serialize(() => {
                                (shops as any[]).forEach((item) => {
                                    stmt.run(
                                        item.id,
                                        item.shopRef,
                                        item.shopName || item.shopNameKo || '',
                                        item.shopNameEn || '',
                                        item.shopNameKo || '',
                                        item.shopNameJp || '',
                                        item.detailEn || '',
                                        item.detailKo || '',
                                        item.detailJp || '',
                                        item.foodKind || item.categoryEnum || '',
                                        item.categoryEnum || '',
                                        item.landName || item.landEnum || '',
                                        item.landEnum || '',
                                        item.priceRange || '',
                                        item.lat.toString(),
                                        item.lon.toString()
                                    );
                                });
                                stmt.finalize();
                                console.log('Shops populated successfully.');
                            });
                        } catch (e) {
                            console.error('Failed to populate shops:', e);
                        }
                    }
                });
            }
        });

        // MyList Table
        db.run(`CREATE TABLE IF NOT EXISTS mylists (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT,
            shop_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(shop_id) REFERENCES shops(id),
            UNIQUE(email, shop_id)
        )`);

        // Likes Table
        db.run(`CREATE TABLE IF NOT EXISTS likes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            review_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id),
            FOREIGN KEY(review_id) REFERENCES reviews(id),
            UNIQUE(user_id, review_id)
        )`);

        // Clusters Table
        db.run(`CREATE TABLE IF NOT EXISTS clusters (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cluster_id TEXT,
            cluster_medoid_value TEXT,
            cluster_name TEXT,
            cluster_tagline TEXT
        )`, (err) => {
            if (err) console.error('Error creating clusters table:', err.message);
            else {
                db.get("SELECT count(*) as count FROM clusters", (err, row: { count: number }) => {
                    if (!err && row && row.count === 0) {
                        console.log('Populating clusters table...');
                        try {
                            const clusterPath = path.resolve(process.cwd(), 'server/data/cluster.json');
                            console.log('Loading clusters from:', clusterPath);
                            // We will keep cluster.json in server/data for now as it might be raw data, 
                            // but if you want to move it too, let me know.
                            // For now, I'll keep this path or move it if needed.
                            if (fs.existsSync(clusterPath)) {
                                const clusterData = JSON.parse(fs.readFileSync(clusterPath, 'utf-8'));
                                const stmt = db.prepare("INSERT INTO clusters (cluster_id, cluster_medoid_value, cluster_name, cluster_tagline) VALUES (?, ?, ?, ?)");
                                db.serialize(() => {
                                    db.run("BEGIN TRANSACTION");
                                    clusterData.forEach((c: any) => {
                                        stmt.run(c.cluster_id, c.cluster_medoid_value, c.cluster_name, c.cluster_tagline);
                                    });
                                    db.run("COMMIT", (err) => {
                                        if (err) console.error("Cluster seed commit failed:", err);
                                        stmt.finalize();
                                        console.log('Clusters populated successfully.');
                                    });
                                });
                            } else {
                                console.error('cluster.json not found for seeding.');
                            }
                        } catch (e) {
                            console.error('Failed to populate clusters:', e);
                        }
                    }
                });
            }
        });
        // Keywords Table
        db.run(`CREATE TABLE IF NOT EXISTS keywords (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT,
            code TEXT UNIQUE,
            text TEXT
        )`, (err) => {
            if (err) console.error('Error creating keywords table:', err.message);
            else {
                db.get("SELECT count(*) as count FROM keywords", (err, row: { count: number }) => {
                    if (!err && row && row.count === 0) {
                        const keywordData = [
                            { category: 'taste', code: 'TASTE_DELICIOUS', text: '맛있어요' },
                            { category: 'taste', code: 'TASTE_LARGE_PORTION', text: '양이 많아요' },
                            { category: 'taste', code: 'TASTE_VALUE', text: '가성비 최고' },
                            { category: 'taste', code: 'TASTE_FRESH', text: '재료가 신선해요' },
                            { category: 'taste', code: 'TASTE_FAST', text: '음식이 빨리 나와요' },
                            { category: 'atmosphere', code: 'ATM_GOOD', text: '분위기 맛집' },
                            { category: 'atmosphere', code: 'ATM_KIND', text: '친절해요' },
                            { category: 'atmosphere', code: 'ATM_PHOTO', text: '사진 찍기 좋은' },
                            { category: 'atmosphere', code: 'ATM_PARKING', text: '주차 편리' },
                            { category: 'atmosphere', code: 'ATM_QUIET', text: '조용해요' },
                            { category: 'atmosphere', code: 'ATM_DATE', text: '데이트 코스' },
                            { category: 'atmosphere', code: 'ATM_SPECIAL', text: '특별한 날' },
                            { category: 'atmosphere', code: 'ATM_SOLO', text: '혼밥 가능' },
                            { category: 'atmosphere', code: 'ATM_SPACIOUS', text: '매장이 넓어요' }
                        ];

                        const stmt = db.prepare("INSERT INTO keywords (category, code, text) VALUES (?, ?, ?)");
                        keywordData.forEach(kw => stmt.run(kw.category, kw.code, kw.text));
                        stmt.finalize();
                        console.log('Keywords populated with codes.');
                    }
                });
            }
        });

        // Comments Table
        db.run(`CREATE TABLE IF NOT EXISTS comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            review_id INTEGER,
            user_id INTEGER,
            text TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(review_id) REFERENCES reviews(id),
            FOREIGN KEY(user_id) REFERENCES users(id)
        )`);

        db.run(`CREATE INDEX IF NOT EXISTS idx_comments_review_id ON comments(review_id)`);
    });
}

export default db;
