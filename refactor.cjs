const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const mockDataPath = path.join(srcDir, 'data', 'mockData.ts');
const typesDir = path.join(srcDir, 'types');
const typesPath = path.join(typesDir, 'index.ts');
const initialDataPath = path.join(srcDir, 'data', 'initialData.ts');

if (!fs.existsSync(typesDir)) {
  fs.mkdirSync(typesDir);
}

const mockDataContent = fs.readFileSync(mockDataPath, 'utf8');

// Separate types from constants
const lines = mockDataContent.split('\n');
let typesContent = '';
let dataContent = "import type { User, Coverage, Task, Alert, CalendarEvent, Notification, Proposal, StaffSchedule, InstagramPost, NewsRadarItem } from '../types';\n\n";

let isDataSection = false;
let skipLines = 0;

for (let i = 0; i < lines.length; i++) {
  if (skipLines > 0) {
    skipLines--;
    continue;
  }
  let line = lines[i];
  if (line.startsWith('export const INITIAL_')) {
    isDataSection = true;
  }
  if (isDataSection) {
    if (line.includes('export const INITIAL_NEWS_RADAR')) {
      dataContent += 'export const INITIAL_NEWS_RADAR: NewsRadarItem[] = [];\n';
      // skip until ]
      let openBrackets = line.includes('[') ? 1 : 0;
      let j = i + 1;
      while (openBrackets > 0 && j < lines.length) {
        if (lines[j].includes('[')) openBrackets++;
        if (lines[j].includes(']')) openBrackets--;
        j++;
      }
      skipLines = j - i - 1;
    } else {
      dataContent += line + '\n';
    }
  } else {
    typesContent += line + '\n';
  }
}

fs.writeFileSync(typesPath, typesContent);
fs.writeFileSync(initialDataPath, dataContent);

// Delete mockData.ts
fs.unlinkSync(mockDataPath);

// Update all imports in src
function updateImports(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      updateImports(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      
      // Match multiline imports from mockData
      const importRegex = /import\s+(?:type\s+)?{([^}]+)}\s+from\s+'\.\.\/data\/mockData';/g;
      const importRegex2 = /import\s+(?:type\s+)?{([^}]+)}\s+from\s+'\.\.\/\.\.\/data\/mockData';/g;
      
      function replacer(match, imports, isDoubleDot) {
        const parts = imports.split(',').map(s => s.trim()).filter(Boolean);
        const types = parts.filter(p => !p.startsWith('INITIAL_') && !p.startsWith('type '));
        const initials = parts.filter(p => p.startsWith('INITIAL_'));
        const typeImports = parts.filter(p => p.startsWith('type ')).map(p => p.replace('type ', ''));
        
        let res = '';
        const allTypes = [...types, ...typeImports];
        const prefix = isDoubleDot ? '../../' : '../';
        if (allTypes.length > 0) res += `import type { ${allTypes.join(', ')} } from '${prefix}types';\n`;
        if (initials.length > 0) res += `import { ${initials.join(', ')} } from '${prefix}data/initialData';\n`;
        return res;
      }

      if (content.includes('data/mockData')) {
        content = content.replace(importRegex, (m, g1) => replacer(m, g1, false));
        content = content.replace(importRegex2, (m, g1) => replacer(m, g1, true));
        changed = true;
      }
      
      if (changed) {
        fs.writeFileSync(fullPath, content);
      }
    }
  }
}

updateImports(srcDir);
