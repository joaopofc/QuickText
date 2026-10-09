import { Template } from '../types';

export const BACKUP_URL_PARAMS = ['code', 'modelos', 'templates', 'backup', 'data'] as const;
export type BackupUrlParamName = typeof BACKUP_URL_PARAMS[number];

export interface ExtractedUrlBackup {
  code: string;
  param: string;
  fullUrl: string;
}

/**
 * Searches the current URL (or a provided custom URL) for backup parameters:
 * "code", "modelos", "templates", "backup", or "data".
 */
export function extractBackupCodeFromUrl(urlStr?: string): ExtractedUrlBackup | null {
  try {
    const rawUrl = urlStr ? urlStr.trim() : (typeof window !== 'undefined' ? window.location.href : '');
    if (!rawUrl) return null;

    let url: URL;
    try {
      const origin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'https://dummy.app';
      if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
        url = new URL(rawUrl);
      } else {
        url = new URL(rawUrl.startsWith('/') || rawUrl.startsWith('?') || rawUrl.startsWith('#') ? rawUrl : '/' + rawUrl, origin);
      }
    } catch {
      url = new URL('https://dummy.app/' + (rawUrl.startsWith('?') || rawUrl.startsWith('#') ? rawUrl : '?' + rawUrl));
    }

    // 1. Search Query Parameters (case-insensitive)
    for (const [key, val] of url.searchParams.entries()) {
      const lowerKey = key.toLowerCase();
      if ((BACKUP_URL_PARAMS as readonly string[]).includes(lowerKey) && val && val.trim()) {
        return { code: val.trim(), param: lowerKey, fullUrl: rawUrl };
      }
    }

    // 2. Hash Query Parameters (e.g., #code=... or #/?templates=...)
    if (url.hash) {
      const hashContent = url.hash.replace(/^#\/?/, '');
      const queryPart = hashContent.includes('?') ? hashContent.split('?')[1] : hashContent;
      const hashParams = new URLSearchParams(queryPart);
      for (const [key, val] of hashParams.entries()) {
        const lowerKey = key.toLowerCase();
        if ((BACKUP_URL_PARAMS as readonly string[]).includes(lowerKey) && val && val.trim()) {
          return { code: val.trim(), param: lowerKey, fullUrl: rawUrl };
        }
      }
    }
  } catch (err) {
    console.error('Erro ao extrair parâmetros de URL:', err);
  }
  return null;
}

/**
 * Generates a full URL incorporating the base64 code with the given parameter name.
 */
export function generateBackupUrl(base64Code: string, paramName: BackupUrlParamName = 'code'): string {
  try {
    const origin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'https://app.local';
    const pathname = typeof window !== 'undefined' && window.location.pathname ? window.location.pathname : '/';
    const url = new URL(pathname, origin);
    url.searchParams.set(paramName, base64Code);
    return url.toString();
  } catch {
    return `?${paramName}=${encodeURIComponent(base64Code)}`;
  }
}

/**
 * Decodes and validates base64 / encoded JSON backup string into safe Template objects.
 */
export function parseAndValidateBackupCode(rawStr: string): Template[] | null {
  try {
    let trimmed = rawStr.trim();
    if (!trimmed) return null;

    // Remove wrapping quotes if present
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
      trimmed = trimmed.slice(1, -1).trim();
    }

    // URL decode if percent encoded
    try {
      if (trimmed.includes('%')) {
        trimmed = decodeURIComponent(trimmed);
      }
    } catch {
      // ignore
    }

    let decoded = '';
    // Strategy 1: Standard UTF-8 Base64 decode
    try {
      decoded = decodeURIComponent(escape(atob(trimmed)));
    } catch {
      // Strategy 2: Replace spaces with '+' (common query string pitfall)
      try {
        decoded = decodeURIComponent(escape(atob(trimmed.replace(/ /g, '+'))));
      } catch {
        // Strategy 3: Plain atob
        try {
          decoded = atob(trimmed);
        } catch {
          // Strategy 4: Plain atob with '+'
          try {
            decoded = atob(trimmed.replace(/ /g, '+'));
          } catch {
            // Strategy 5: Direct URI decoding if passed already decoded
            decoded = decodeURIComponent(trimmed);
          }
        }
      }
    }

    const parsed = JSON.parse(decoded);
    const list = Array.isArray(parsed) ? parsed : [parsed];
    const validated: Template[] = [];

    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      if (!item || typeof item !== 'object') continue;
      if (!item.title || !item.content) {
        throw new Error('Todos os modelos precisam ter "title" e "content".');
      }
      validated.push({
        id: `tpl-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        title: String(item.title),
        content: String(item.content),
        category: String(item.category || 'Geral'),
        usageCount: Number(item.usageCount || 0),
        createdAt: new Date().toISOString(),
        variablePresets: item.variablePresets || {},
        order: typeof item.order === 'number' ? item.order : i + 1,
      });
    }

    return validated.length > 0 ? validated : null;
  } catch (err) {
    console.error('Erro na validação do backup:', err);
    return null;
  }
}
