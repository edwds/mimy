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
    const result = await db.execute("SELECT * FROM clusters");
    return result.rows;
  },

  getClusterById: async (id: string): Promise<any> => {
    const result = await db.execute({
      sql: "SELECT * FROM clusters WHERE cluster_id = ?",
      args: [id]
    });
    return result.rows[0];
  },

  clearCache: (): void => {
    cachedMatchMap = null;
  },
};
