import { createClient } from '@libsql/client';
import path from 'path';
import { fileURLToPath } from 'url';
import { shops } from './seeds';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Turso configuration
const url = process.env.TURSO_DATABASE_URL || `file:${path.join(__dirname, 'mimy.db')}`;
const authToken = process.env.TURSO_AUTH_TOKEN;

console.log('Connecting to database at:', url);

const db = createClient({
    url,
    authToken,
});

async function initializeTables() {
    try {
        // Users Table
        await db.execute(`CREATE TABLE IF NOT EXISTS users (
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

        // Migration: Add columns one by one
        const userColumns = [
            { name: 'profileImage', type: 'TEXT' },
            { name: 'defaultRankingVisibility', type: "TEXT DEFAULT 'public'" },
            { name: 'rankingVisibilityLimit', type: 'INTEGER' },
            { name: 'birth_date', type: 'TEXT' },
            { name: 'gender', type: 'TEXT' }
        ];

        for (const col of userColumns) {
            try {
                await db.execute(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`);
            } catch (e: any) {
                // Ignore "duplicate column name" errors
            }
        }

        // Quiz Results Table
        await db.execute(`CREATE TABLE IF NOT EXISTS quiz_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            profile_json TEXT,
            cluster_json TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )`);

        // Reviews Table
        await db.execute(`CREATE TABLE IF NOT EXISTS reviews (
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

        try {
            await db.execute("ALTER TABLE reviews ADD COLUMN rankingVisibility TEXT");
        } catch (e) { }

        // Rankings Table
        await db.execute(`CREATE TABLE IF NOT EXISTS rankings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT,
            category TEXT,
            rankings_json TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(email, category)
        )`);

        await db.execute(`CREATE INDEX IF NOT EXISTS idx_reviews_user_category_rank ON reviews(email, category, rank)`);

        // Shops Table
        await db.execute(`CREATE TABLE IF NOT EXISTS shops (
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
        )`);

        const shopCount = await db.execute("SELECT count(*) as count FROM shops");
        if (Number(shopCount.rows[0].count) === 0) {
            console.log('Populating shops table with mock data...');
            const batches = (shops as any[]).map(item => ({
                sql: "INSERT INTO shops (id, shopRef, shopName, shopNameEn, shopNameKo, shopNameJp, detailEn, detailKo, detailJp, foodKind, categoryEnum, landName, landEnum, priceRange, lat, lon) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                args: [
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
                ]
            }));
            await db.batch(batches, "write");
            console.log('Shops populated successfully.');
        }

        // MyList Table
        await db.execute(`CREATE TABLE IF NOT EXISTS mylists (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT,
            shop_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(shop_id) REFERENCES shops(id),
            UNIQUE(email, shop_id)
        )`);

        // Likes Table
        await db.execute(`CREATE TABLE IF NOT EXISTS likes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            review_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id),
            FOREIGN KEY(review_id) REFERENCES reviews(id),
            UNIQUE(user_id, review_id)
        )`);

        // Clusters Table
        await db.execute(`CREATE TABLE IF NOT EXISTS clusters (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cluster_id TEXT,
            cluster_medoid_value TEXT,
            cluster_name TEXT,
            cluster_tagline TEXT
        )`);

        const clusterCount = await db.execute("SELECT count(*) as count FROM clusters");
        if (Number(clusterCount.rows[0].count) === 0) {
            console.log('Populating clusters table...');
            const clusterPath = path.resolve(process.cwd(), 'server/data/cluster.json');
            if (fs.existsSync(clusterPath)) {
                const clusterData = JSON.parse(fs.readFileSync(clusterPath, 'utf-8'));
                const batches = clusterData.map((c: any) => ({
                    sql: "INSERT INTO clusters (cluster_id, cluster_medoid_value, cluster_name, cluster_tagline) VALUES (?, ?, ?, ?)",
                    args: [c.cluster_id, c.cluster_medoid_value, c.cluster_name, c.cluster_tagline]
                }));
                await db.batch(batches, "write");
                console.log('Clusters populated successfully.');
            }
        }

        // Keywords Table
        await db.execute(`CREATE TABLE IF NOT EXISTS keywords (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT,
            code TEXT UNIQUE,
            text TEXT
        )`);

        const keywordCount = await db.execute("SELECT count(*) as count FROM keywords");
        if (Number(keywordCount.rows[0].count) === 0) {
            const keywordData = [
                ['taste', 'TASTE_DELICIOUS', '맛있어요'],
                ['taste', 'TASTE_LARGE_PORTION', '양이 많아요'],
                ['taste', 'TASTE_VALUE', '가성비 최고'],
                ['taste', 'TASTE_FRESH', '재료가 신선해요'],
                ['taste', 'TASTE_FAST', '음식이 빨리 나와요'],
                ['atmosphere', 'ATM_GOOD', '분위기 맛집'],
                ['atmosphere', 'ATM_KIND', '친절해요'],
                ['atmosphere', 'ATM_PHOTO', '사진 찍기 좋은'],
                ['atmosphere', 'ATM_PARKING', '주차 편리'],
                ['atmosphere', 'ATM_QUIET', '조용해요'],
                ['atmosphere', 'ATM_DATE', '데이트 코스'],
                ['atmosphere', 'ATM_SPECIAL', '특별한 날'],
                ['atmosphere', 'ATM_SOLO', '혼밥 가능'],
                ['atmosphere', 'ATM_SPACIOUS', '매장이 넓어요']
            ];
            const batches = keywordData.map(kw => ({
                sql: "INSERT INTO keywords (category, code, text) VALUES (?, ?, ?)",
                args: kw
            }));
            await db.batch(batches, "write");
            console.log('Keywords populated.');
        }

        // Comments Table
        await db.execute(`CREATE TABLE IF NOT EXISTS comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            review_id INTEGER,
            user_id INTEGER,
            text TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(review_id) REFERENCES reviews(id),
            FOREIGN KEY(user_id) REFERENCES users(id)
        )`);

        await db.execute(`CREATE INDEX IF NOT EXISTS idx_comments_review_id ON comments(review_id)`);

        console.log('All tables initialized successfully.');
    } catch (error) {
        console.error('Error during table initialization:', error);
    }
}

// Automatically initialize when file is loaded
initializeTables();

export default db;
