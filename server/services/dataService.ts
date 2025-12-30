import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseTSV } from '../utils/fileParser';
import db from '../db/database';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let cachedMatchMap: Map<string, number> | null = null;

export const DataService = {
  getMatchMap: (): Map<string, number> => {
    if (cachedMatchMap) {
      return cachedMatchMap;
    }

    const tsvPath = path.join(__dirname, '../data/match.tsv');
    const tsvText = fs.readFileSync(tsvPath, 'utf-8');
    cachedMatchMap = parseTSV(tsvText);

    return cachedMatchMap;
  },

  getClusters: async (): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      db.all("SELECT * FROM clusters", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  getClusterById: async (id: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      db.get("SELECT * FROM clusters WHERE cluster_id = ?", [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  clearCache: (): void => {
    cachedMatchMap = null;
  },
};


