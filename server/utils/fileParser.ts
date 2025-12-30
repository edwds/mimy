export function parseTSV(tsvText: string): Map<string, number> {
  const lines = tsvText.trim().split('\n');
  const matchMap = new Map<string, number>();
  
  // 헤더 스킵
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const parts = line.split('\t');
    if (parts.length >= 2) {
      const value = parts[0].trim();
      const clusterId = parseInt(parts[1].trim());
      if (value && !isNaN(clusterId)) {
        matchMap.set(value, clusterId);
      }
    }
  }
  
  return matchMap;
}

export function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // 이스케이프된 따옴표
        current += '"';
        i++; // 다음 따옴표 건너뛰기
      } else {
        // 따옴표 시작/끝
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

export function parseCSV(csvText: string): any[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = parseCSVLine(lines[0]);
  
  return lines.slice(1).map((line, idx) => {
    const values = parseCSVLine(line);
    const row: any = {};
    headers.forEach((h, i) => {
      row[h] = values[i] || '';
    });
    
    return {
      id: parseInt(row.id) || idx + 1,
      boldness: parseFloat(row.boldness) || 0,
      acidity: parseFloat(row.acidity) || 0,
      richness: parseFloat(row.richness) || 0,
      experimental: parseFloat(row.experimental) || 0,
      spiciness: parseFloat(row.spiciness) || 0,
      sweetness: parseFloat(row.sweetness) || 0,
      umami: parseFloat(row.umami) || 0,
      name_ko: row.name_ko || '알 수 없는 캐릭터',
      tagline_ko: row.tagline_ko || '설명이 없습니다.',
    };
  });
}


