export function extractVariables(content: string): string[] {
  const regexCurly = /\{\{([^{}]+)\}\}/g;
  const regexBracket = /\[\[([^[\]]+)\]\]/g;
  
  const matchesCurly = [...content.matchAll(regexCurly)].map(m => m[1].trim());
  const matchesBracket = [...content.matchAll(regexBracket)].map(m => m[1].trim());
  
  const allVars = [...matchesCurly, ...matchesBracket];
  return Array.from(new Set(allVars)).filter(v => v.length > 0);
}

export function isMultilineVariable(content: string, varName: string): boolean {
  const escaped = varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\[\\[\\s*${escaped}\\s*\\]\\]`);
  return regex.test(content);
}

export function replaceVariables(content: string, values: Record<string, string>): string {
  let result = content;
  Object.entries(values).forEach(([key, val]) => {
    // Escape special characters to avoid breaking regex
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Replace {{key}}
    const regexCurly = new RegExp(`\\{\\{\\s*${escapedKey}\\s*\\}\\}`, 'g');
    result = result.replace(regexCurly, val !== undefined ? val : `{{${key}}}`);
    
    // Replace [[key]]
    const regexBracket = new RegExp(`\\[\\[\\s*${escapedKey}\\s*\\]\\]`, 'g');
    result = result.replace(regexBracket, val !== undefined ? val : `[[${key}]]`);
  });
  return result;
}

