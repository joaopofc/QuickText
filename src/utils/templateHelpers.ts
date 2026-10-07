export function extractVariables(content: string, values: Record<string, string> = {}): string[] {
  const extracted = new Set<string>();
  const queue = [content];
  const visited = new Set<string>();
  let iterations = 0;
  
  while (queue.length > 0 && iterations < 50) {
    iterations++;
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);
    
    const regexCurly = /\{\{([^{}]+)\}\}/g;
    const regexBracket = /\[\[([^[\]]+)\]\]/g;
    
    const matchesCurly = [...current.matchAll(regexCurly)].map(m => m[1].trim());
    const matchesBracket = [...current.matchAll(regexBracket)].map(m => m[1].trim());
    
    const allVars = [...matchesCurly, ...matchesBracket].filter(v => v.length > 0);
    allVars.forEach(v => {
      if (!extracted.has(v)) {
        extracted.add(v);
        if (values[v]) {
          queue.push(values[v]);
        }
      }
    });
  }
  return Array.from(extracted);
}

export function isMultilineVariable(content: string, varName: string): boolean {
  const escaped = varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\[\\[\\s*${escaped}\\s*\\]\\]`);
  return regex.test(content);
}

export function replaceVariables(content: string, values: Record<string, string>): string {
  let result = content;
  let previousResult = '';
  let iterations = 0;
  const maxIterations = 5;
  
  while (result !== previousResult && iterations < maxIterations) {
    previousResult = result;
    iterations++;
    
    Object.entries(values).forEach(([key, val]) => {
      // Escape special characters to avoid breaking regex
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Replace {{key}} - if val is undefined, replace with empty string
      const regexCurly = new RegExp(`\\{\\{\\s*${escapedKey}\\s*\\}\\}`, 'g');
      result = result.replace(regexCurly, val !== undefined ? val : '');
      
      // Replace [[key]] - if val is undefined, replace with empty string
      const regexBracket = new RegExp(`\\[\\[\\s*${escapedKey}\\s*\\]\\]`, 'g');
      result = result.replace(regexBracket, val !== undefined ? val : '');
    });
  }

  // Strip out any remaining unfilled placeholders (like unfilled nested subvariables)
  const regexCurlyRemaining = /\{\{[^{}]+\}\}/g;
  const regexBracketRemaining = /\[\[[^[\]]+\]\]/g;
  result = result.replace(regexCurlyRemaining, '');
  result = result.replace(regexBracketRemaining, '');

  return result;
}

