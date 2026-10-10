import { Template } from '../types';
import { DEFAULT_TEMPLATES } from '../defaultTemplates';

export const BACKUP_URL_PARAMS = ['code', 'modelos', 'templates', 'backup', 'data'] as const;
export type BackupUrlParamName = typeof BACKUP_URL_PARAMS[number];

export interface ExtractedUrlBackup {
  code: string;
  param: string;
  fullUrl: string;
}

export interface BackupPackage {
  version: string;
  updatedAt?: string;
  templates: {
    title: string;
    content: string;
    category?: string;
    variablePresets?: Record<string, string[]>;
    order?: number;
    usageCount?: number;
  }[];
}

export interface ParsedBackupPayload {
  version: string;
  updatedAt?: string;
  templates: Template[];
}

export interface UrlUpdateDecision {
  shouldOffer: boolean;
  reason:
    | 'new_version'
    | 'initial_import'
    | 'newer_content'
    | 'already_synced'
    | 'older_version'
    | 'same_version_identical'
    | 'invalid_code'
    | 'no_code'
    | 'dismissed';
  isNewerVersion: boolean;
  isInitialImport: boolean;
  urlVersion: string;
  localVersion: string;
  templateCount: number;
  code: string;
  param: string;
  templates: Template[];
}

/**
 * Compares two semantic/numeric version strings (e.g., "2.0" vs "1.0", "1.2" vs "1.1").
 * Returns:
 *   1 if vA > vB (vA is newer)
 *  -1 if vA < vB (vA is older)
 *   0 if equal
 */
export function compareVersions(vA?: string, vB?: string): number {
  if (!vA && !vB) return 0;
  if (!vA) return -1;
  if (!vB) return 1;

  const cleanA = vA.replace(/^[^\d.]+/i, '').trim();
  const cleanB = vB.replace(/^[^\d.]+/i, '').trim();

  const partsA = cleanA.split('.').map((p) => parseInt(p, 10) || 0);
  const partsB = cleanB.split('.').map((p) => parseInt(p, 10) || 0);

  const len = Math.max(partsA.length, partsB.length);
  for (let i = 0; i < len; i++) {
    const numA = partsA[i] !== undefined ? partsA[i] : 0;
    const numB = partsB[i] !== undefined ? partsB[i] : 0;
    if (numA > numB) return 1;
    if (numA < numB) return -1;
  }
  return 0;
}

/**
 * System major version (1 for current app release).
 */
export const SYSTEM_MAJOR_VERSION = 1;

export interface AutoVersionInfo {
  version: string;
  hasChanged: boolean;
  changeType: 'none' | 'new_or_removed_model' | 'edited_content';
}

/**
 * Gets the current active template version saved in this browser. Defaults to "1.1.0".
 */
export function getLocalTemplateVersion(): string {
  try {
    if (typeof window === 'undefined') return '1.1.0';
    const stored = localStorage.getItem('quick_text_current_version');
    return stored && stored.trim() ? stored.trim() : '1.1.0';
  } catch {
    return '1.1.0';
  }
}

/**
 * Sets the active template version in this browser.
 */
export function setLocalTemplateVersion(version: string): void {
  try {
    if (typeof window === 'undefined') return;
    const clean = version ? version.trim() : '1.1.0';
    localStorage.setItem('quick_text_current_version', clean);
  } catch (err) {
    console.error('Erro ao salvar versão local:', err);
  }
}

/**
 * Records the current templates baseline in localStorage so future modifications
 * can be detected and automatically incremented.
 */
export function recordSavedTemplateState(templates: Template[], version?: string): void {
  try {
    if (typeof window === 'undefined') return;
    const currentFingerprint = generateTemplatesFingerprint(templates);
    const currentTitles = templates.map((t) => t.title.trim().toLowerCase()).sort();
    localStorage.setItem('quick_text_last_saved_fingerprint', currentFingerprint);
    localStorage.setItem('quick_text_last_saved_count', String(templates.length));
    localStorage.setItem('quick_text_last_saved_titles', JSON.stringify(currentTitles));
    if (version) {
      setLocalTemplateVersion(version);
    }
  } catch (err) {
    console.error('Erro ao registrar estado base dos templates:', err);
  }
}

/**
 * Automatically computes the version based on changes:
 * - If NO changes from last saved state: retains current version.
 * - If models were ADDED or REMOVED: bumps minor version (e.g. 1.1 -> 1.2 or 1.1.x -> 1.2.0).
 * - If models were EDITED (same count/titles, different content): bumps patch version (e.g. 1.1.0 -> 1.1.1 -> 1.1.2).
 * When `commit` is true, persists the new version and state into localStorage.
 */
export function computeAutomaticVersion(templates: Template[], commit = false): AutoVersionInfo {
  try {
    const currentFingerprint = generateTemplatesFingerprint(templates);
    const currentCount = templates.length;
    const currentTitles = templates.map((t) => t.title.trim().toLowerCase()).sort();

    const storedVersion = getLocalTemplateVersion();
    const lastFingerprint = localStorage.getItem('quick_text_last_saved_fingerprint');
    const lastCountStr = localStorage.getItem('quick_text_last_saved_count');
    const lastTitlesRaw = localStorage.getItem('quick_text_last_saved_titles');

    // Initial state setup if never saved before
    if (!lastFingerprint) {
      if (commit) {
        recordSavedTemplateState(templates, storedVersion);
      }
      return {
        version: storedVersion,
        hasChanged: false,
        changeType: 'none',
      };
    }

    // 1. If nothing changed compared to last saved baseline
    if (lastFingerprint === currentFingerprint) {
      return {
        version: storedVersion,
        hasChanged: false,
        changeType: 'none',
      };
    }

    // 2. Identify type of change: Added/Removed models vs Content edit
    const lastCount = lastCountStr !== null ? parseInt(lastCountStr, 10) : currentCount;
    const lastTitles: string[] = lastTitlesRaw ? JSON.parse(lastTitlesRaw) : [];

    const countChanged = currentCount !== lastCount;
    const titlesChanged =
      currentTitles.length !== lastTitles.length ||
      currentTitles.some((t, i) => t !== lastTitles[i]);

    const isModelAddedOrRemoved = countChanged || titlesChanged;

    // Parse stored version into parts [major, minor, patch]
    const clean = storedVersion.replace(/^[^\d.]+/i, '').trim();
    const parts = clean.split('.').map((p) => parseInt(p, 10) || 0);
    const major = SYSTEM_MAJOR_VERSION;
    let minor = parts[1] !== undefined ? parts[1] : 1;
    let patch = parts[2] !== undefined ? parts[2] : 0;

    let nextVersion = storedVersion;
    let changeType: AutoVersionInfo['changeType'] = 'none';

    if (isModelAddedOrRemoved) {
      // Structure changed: added or removed model -> bump minor (1.1 -> 1.2), reset patch to 0
      minor += 1;
      patch = 0;
      nextVersion = `${major}.${minor}.${patch}`;
      changeType = 'new_or_removed_model';
    } else {
      // Content changed without adding/removing models -> bump patch (1.1.1 -> 1.1.2)
      patch += 1;
      nextVersion = `${major}.${minor}.${patch}`;
      changeType = 'edited_content';
    }

    if (commit) {
      recordSavedTemplateState(templates, nextVersion);
    }

    return {
      version: nextVersion,
      hasChanged: true,
      changeType,
    };
  } catch (err) {
    console.error('Erro ao calcular versão automática:', err);
    return {
      version: getLocalTemplateVersion(),
      hasChanged: false,
      changeType: 'none',
    };
  }
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
 * Creates encoded Base64 string for templates with version metadata.
 */
export function createBackupBase64(templates: Template[], version = '1.0'): string {
  try {
    const cleanVersion = version && version.trim() ? version.trim() : '1.0';
    const payload: BackupPackage = {
      version: cleanVersion,
      updatedAt: new Date().toISOString(),
      templates: templates.map(({ title, content, category, variablePresets, order }, idx) => ({
        title,
        content,
        category,
        variablePresets: variablePresets || {},
        order: typeof order === 'number' ? order : idx + 1,
      })),
    };
    const jsonStr = JSON.stringify(payload);
    return btoa(unescape(encodeURIComponent(jsonStr)));
  } catch (e) {
    console.error('Erro ao criar base64 do backup:', e);
    return '';
  }
}

/**
 * Updates the browser's address bar with the base64 backup code without page reload.
 */
export function updateBrowserUrlWithBackup(base64Code: string, preferParam?: string, version?: string): boolean {
  try {
    if (typeof window === 'undefined') return false;
    const existing = extractBackupCodeFromUrl();
    const paramName = preferParam || (existing ? existing.param : 'code');
    const url = new URL(window.location.href);
    url.searchParams.set(paramName, base64Code);
    window.history.replaceState(null, '', url.toString());

    if (version) {
      setLocalTemplateVersion(version);
    }
    // Mark this code as synced locally so this browser never prompts the author about its own code
    markCodeAsSyncedLocally(base64Code, version);
    return true;
  } catch (err) {
    console.error('Erro ao atualizar URL no navegador:', err);
    return false;
  }
}

/**
 * Generates a normalized fingerprint for a list of templates.
 */
export function generateTemplatesFingerprint(templates: Template[]): string {
  return templates
    .map((t) => `${t.title.trim().toLowerCase()}:::${t.content.trim()}:::${t.category?.trim().toLowerCase() || ''}`)
    .sort()
    .join('|||');
}

/**
 * Normalizes a base64 code string to a compact hash/signature for comparison.
 */
export function normalizeCodeKey(rawCode: string): string {
  return rawCode.trim().replace(/\s+/g, '').slice(0, 128);
}

/**
 * Marks a backup code as already known/synced in this browser so it is never prompted again.
 */
export function markCodeAsSyncedLocally(rawCode: string, version?: string): void {
  try {
    if (typeof window === 'undefined' || !rawCode) return;
    const key = normalizeCodeKey(rawCode);
    const existingRaw = localStorage.getItem('quick_text_synced_codes');
    const existing: string[] = existingRaw ? JSON.parse(existingRaw) : [];
    if (!existing.includes(key)) {
      existing.push(key);
      if (existing.length > 50) existing.shift();
      localStorage.setItem('quick_text_synced_codes', JSON.stringify(existing));
    }
    localStorage.setItem('quick_text_last_synced_code', key);

    if (version) {
      setLocalTemplateVersion(version);
    }
  } catch (e) {
    console.error('Erro ao salvar código sincronizado:', e);
  }
}

/**
 * Dismisses a specific backup code so the user is not prompted again for this exact version.
 */
export function dismissUrlBackupCode(rawCode: string): void {
  try {
    if (typeof window === 'undefined' || !rawCode) return;
    const key = normalizeCodeKey(rawCode);
    localStorage.setItem('quick_text_dismissed_code', key);
    localStorage.setItem('quick_text_url_notice_dismissed_date', new Date().toISOString().slice(0, 10));
  } catch (e) {
    console.error('Erro ao descartar código da URL:', e);
  }
}

/**
 * Checks if a code was explicitly dismissed by the user.
 */
export function isCodeDismissed(rawCode: string): boolean {
  try {
    if (typeof window === 'undefined' || !rawCode) return false;
    const key = normalizeCodeKey(rawCode);
    const dismissed = localStorage.getItem('quick_text_dismissed_code');
    return dismissed === key;
  } catch {
    return false;
  }
}

/**
 * Verifies whether a code from the URL has already been imported, synced or passed through this device.
 */
export function isCodeAlreadySyncedOrKnown(rawCode: string): boolean {
  try {
    if (typeof window === 'undefined' || !rawCode) return false;
    const key = normalizeCodeKey(rawCode);
    const lastKey = localStorage.getItem('quick_text_last_synced_code');
    if (lastKey === key) return true;

    const existingRaw = localStorage.getItem('quick_text_synced_codes');
    if (existingRaw) {
      const existing: string[] = JSON.parse(existingRaw);
      if (existing.includes(key)) return true;
    }
  } catch {
    // fallback
  }
  return false;
}

/**
 * Decodes and validates base64 / encoded JSON backup string into a structured payload with version.
 */
export function parseAndValidateBackupPayload(rawStr: string): ParsedBackupPayload | null {
  try {
    let trimmed = rawStr.trim();
    if (!trimmed) return null;

    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
      trimmed = trimmed.slice(1, -1).trim();
    }

    try {
      if (trimmed.includes('%')) {
        trimmed = decodeURIComponent(trimmed);
      }
    } catch {
      // ignore
    }

    let decoded = '';
    try {
      decoded = decodeURIComponent(escape(atob(trimmed)));
    } catch {
      try {
        decoded = decodeURIComponent(escape(atob(trimmed.replace(/ /g, '+'))));
      } catch {
        try {
          decoded = atob(trimmed);
        } catch {
          try {
            decoded = atob(trimmed.replace(/ /g, '+'));
          } catch {
            decoded = decodeURIComponent(trimmed);
          }
        }
      }
    }

    const parsed = JSON.parse(decoded);

    let rawTemplates: unknown[] = [];
    let detectedVersion = '1.0';
    let detectedUpdatedAt: string | undefined;

    if (Array.isArray(parsed)) {
      // Legacy or flat array format
      rawTemplates = parsed;
      detectedVersion = '1.0';
    } else if (parsed && typeof parsed === 'object') {
      const p = parsed as Record<string, unknown>;
      detectedVersion = p.version ? String(p.version).trim() : '1.0';
      detectedUpdatedAt = p.updatedAt ? String(p.updatedAt) : undefined;

      if (Array.isArray(p.templates)) {
        rawTemplates = p.templates;
      } else if (Array.isArray(p.modelos)) {
        rawTemplates = p.modelos;
      } else if (Array.isArray(p.data)) {
        rawTemplates = p.data;
      } else {
        return null;
      }
    }

    const validated: Template[] = [];
    for (let i = 0; i < rawTemplates.length; i++) {
      const item = rawTemplates[i] as Record<string, unknown>;
      if (!item || typeof item !== 'object') continue;
      if (!item.title || !item.content) {
        continue;
      }
      validated.push({
        id: `tpl-${Date.now()}-${Math.random().toString(36).substr(2, 5)}-${i}`,
        title: String(item.title),
        content: String(item.content),
        category: String(item.category || 'Geral'),
        usageCount: Number(item.usageCount || 0),
        createdAt: new Date().toISOString(),
        variablePresets: (item.variablePresets as Record<string, string[]>) || {},
        order: typeof item.order === 'number' ? item.order : i + 1,
      });
    }

    if (validated.length === 0) return null;

    return {
      version: detectedVersion,
      updatedAt: detectedUpdatedAt,
      templates: validated,
    };
  } catch (err) {
    console.error('Erro na validação do payload de backup:', err);
    return null;
  }
}

/**
 * Backward-compatible helper that returns only the Template array from the backup code.
 */
export function parseAndValidateBackupCode(rawStr: string): Template[] | null {
  const payload = parseAndValidateBackupPayload(rawStr);
  return payload ? payload.templates : null;
}

/**
 * Core Decision Engine for URL Template Updates.
 * Compares versions (e.g. 2.0 vs 1.0), verifies if code has already been applied,
 * and determines whether the floating notification should be shown.
 */
export function checkUrlUpdateStatus(rawCode?: string, currentTemplates: Template[] = []): UrlUpdateDecision {
  const emptyResult = (reason: UrlUpdateDecision['reason']): UrlUpdateDecision => ({
    shouldOffer: false,
    reason,
    isNewerVersion: false,
    isInitialImport: false,
    urlVersion: '1.0',
    localVersion: getLocalTemplateVersion(),
    templateCount: 0,
    code: '',
    param: 'code',
    templates: [],
  });

  const found = rawCode ? { code: rawCode, param: 'code', fullUrl: '' } : extractBackupCodeFromUrl();
  if (!found || !found.code.trim()) {
    return emptyResult('no_code');
  }

  // If user already dismissed this specific code, don't show
  if (isCodeDismissed(found.code)) {
    return emptyResult('dismissed');
  }

  // If this exact code was already applied or synced locally, don't show
  if (isCodeAlreadySyncedOrKnown(found.code)) {
    return emptyResult('already_synced');
  }

  // Parse payload from URL
  const payload = parseAndValidateBackupPayload(found.code);
  if (!payload || payload.templates.length === 0) {
    return emptyResult('invalid_code');
  }

  const localVersion = getLocalTemplateVersion();
  const urlVersion = payload.version || '1.0';

  // Check if current user is clean / only has default templates
  const isDefaultOrEmpty =
    currentTemplates.length === 0 ||
    (currentTemplates.length === DEFAULT_TEMPLATES.length &&
      currentTemplates.every((t) => t.id.startsWith('tpl-') && DEFAULT_TEMPLATES.some((d) => d.id === t.id)));

  if (isDefaultOrEmpty) {
    return {
      shouldOffer: true,
      reason: 'initial_import',
      isNewerVersion: false,
      isInitialImport: true,
      urlVersion,
      localVersion,
      templateCount: payload.templates.length,
      code: found.code,
      param: found.param,
      templates: payload.templates,
    };
  }

  // Compare versions:
  const versionComparison = compareVersions(urlVersion, localVersion);

  // If URL version is older than local version (e.g. URL 1.0 vs local 2.0), DO NOT SHOW!
  if (versionComparison < 0) {
    return {
      shouldOffer: false,
      reason: 'older_version',
      isNewerVersion: false,
      isInitialImport: false,
      urlVersion,
      localVersion,
      templateCount: payload.templates.length,
      code: found.code,
      param: found.param,
      templates: payload.templates,
    };
  }

  // Check fingerprint match
  const urlFingerprint = generateTemplatesFingerprint(payload.templates);
  const localFingerprint = generateTemplatesFingerprint(currentTemplates);

  if (urlFingerprint === localFingerprint) {
    // Current templates already match 100%! Mark code as known and don't offer.
    markCodeAsSyncedLocally(found.code, urlVersion);
    return {
      shouldOffer: false,
      reason: 'same_version_identical',
      isNewerVersion: false,
      isInitialImport: false,
      urlVersion,
      localVersion,
      templateCount: payload.templates.length,
      code: found.code,
      param: found.param,
      templates: payload.templates,
    };
  }

  // If URL version is STRICTLY NEWER than local version (e.g. URL 2.0 vs local 1.0)
  if (versionComparison > 0) {
    return {
      shouldOffer: true,
      reason: 'new_version',
      isNewerVersion: true,
      isInitialImport: false,
      urlVersion,
      localVersion,
      templateCount: payload.templates.length,
      code: found.code,
      param: found.param,
      templates: payload.templates,
    };
  }

  // If URL version EQUALS local version:
  // Check if local templates already contain all items from the URL with identical content
  const localMap = new Map<string, string>();
  currentTemplates.forEach((t) => {
    localMap.set(t.title.trim().toLowerCase(), t.content.trim());
  });

  let hasNewOrUpdated = false;
  for (const item of payload.templates) {
    const key = item.title.trim().toLowerCase();
    const localContent = localMap.get(key);
    if (localContent === undefined || localContent !== item.content.trim()) {
      hasNewOrUpdated = true;
      break;
    }
  }

  if (!hasNewOrUpdated) {
    markCodeAsSyncedLocally(found.code, urlVersion);
    return {
      shouldOffer: false,
      reason: 'same_version_identical',
      isNewerVersion: false,
      isInitialImport: false,
      urlVersion,
      localVersion,
      templateCount: payload.templates.length,
      code: found.code,
      param: found.param,
      templates: payload.templates,
    };
  }

  return {
    shouldOffer: true,
    reason: 'newer_content',
    isNewerVersion: false,
    isInitialImport: false,
    urlVersion,
    localVersion,
    templateCount: payload.templates.length,
    code: found.code,
    param: found.param,
    templates: payload.templates,
  };
}
