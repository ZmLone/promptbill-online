'use client';

import React, { useState, useMemo } from 'react';

export interface PendingQueueItem {
  queueId: string;
  type: 'new_model' | 'price_update' | 'benchmark_update';
  detectedAt: string;
  modelId: string;
  modelSlug: string;
  modelName: string;
  provider: string;
  sourceUrl?: string | null;
  summary: string;
  currentValues?: Record<string, unknown>;
  proposedValues?: Record<string, unknown>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  draftModel?: Record<string, any>;
}

export interface PendingQueuePayload {
  updatedAt: string | null;
  items: PendingQueueItem[];
}

interface EditableOverrides {
  score: string;
  tokPerSec: string;
  officialInput: string;
  officialOutput: string;
  cachedInput: string;
  cacheWrite: string;
  routerInput: string;
  routerOutput: string;
  batchDiscount: string;
  contextWindow: string;
  markVerified: boolean;
}

interface LiveEditState {
  score: string;
  tokPerSec: string;
  inputPer1M: string;
  outputPer1M: string;
  cachedInputPer1M: string;
  cacheWritePer1M: string;
  batchDiscount: string;
  longContextThresholdTokens: string;
  longContextMultiplierInput: string;
  longContextMultiplierOutput: string;
  rpmLimit: string;
  tpmLimit: string;
  tpdLimit: string;
  contextWindow: string;
  maxOutputTokens: string;
  family: string;
  tier: string;
  license: string;
  bestFor: string;
  notes: string;
  lifecycleStatus: string;
  successorSlug: string;
  archived: boolean;
  ag: string;
  co: string;
  re: string;
  mm: string;
  kn: string;
  ml: string;
  ifScore: string;
  ma: string;
  verified: boolean;
}

interface NewManualModelState {
  name: string;
  slug: string;
  provider: string;
  family: string;
  tier: string;
  license: string;
  contextWindow: string;
  maxOutputTokens: string;
  inputPer1M: string;
  outputPer1M: string;
  cachedInputPer1M: string;
  cacheWritePer1M: string;
  batchDiscount: string;
  longContextThresholdTokens: string;
  longContextMultiplierInput: string;
  longContextMultiplierOutput: string;
  score: string;
  tokPerSec: string;
  rpmLimit: string;
  tpmLimit: string;
  tpdLimit: string;
  bestFor: string;
  notes: string;
  verified: boolean;
}

interface BulkImportPatch {
  rowIndex: number;
  keyRaw: string;
  slugGuess: string;
  matchedSlug: string | null;
  matchedName: string | null;
  fields: Record<string, string | number>;
  warnings: string[];
  isDuplicate: boolean;
}

function slugify(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/^[^/]+\//, '')
    .replace(/[._\s]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

const COLUMN_ALIASES: Record<string, string> = {
  model: 'model',
  modelslug: 'model',
  slug: 'slug',
  id: 'slug',
  name: 'name',
  modelname: 'name',
  provider: 'provider',
  family: 'family',
  modelfamily: 'family',
  tier: 'tier',
  modeltier: 'tier',
  benchmarkscore: 'score',
  score: 'score',
  qualityscore: 'score',
  speed: 'tokPerSec',
  speedtoks: 'tokPerSec',
  tokpersec: 'tokPerSec',
  throughput: 'tokPerSec',
  rpmlimit: 'rpmLimit',
  rpm: 'rpmLimit',
  tpmlimit: 'tpmLimit',
  tpm: 'tpmLimit',
  tpdlimit: 'tpdLimit',
  tpd: 'tpdLimit',
  license: 'license',
  bestfor: 'bestFor',
  bestforworkloadtags: 'bestFor',
  workloadtags: 'bestFor',
  tags: 'bestFor',
  notes: 'notes',
  contextwindow: 'contextWindow',
  context: 'contextWindow',
  maxoutputtokens: 'maxOutputTokens',
  maxoutput: 'maxOutputTokens',
  officialin: 'inputPer1M',
  officialin1m: 'inputPer1M',
  inputper1m: 'inputPer1M',
  input: 'inputPer1M',
  officialout: 'outputPer1M',
  officialout1m: 'outputPer1M',
  outputper1m: 'outputPer1M',
  output: 'outputPer1M',
  cachedread: 'cachedInputPer1M',
  cachedread1m: 'cachedInputPer1M',
  cachedinputper1m: 'cachedInputPer1M',
  cached: 'cachedInputPer1M',
  cachewrite: 'cacheWritePer1M',
  cachewrite1m: 'cacheWritePer1M',
  cachewriteper1m: 'cacheWritePer1M',
  batchdiscount: 'batchDiscount',
  batch: 'batchDiscount',
  longcontextthresholdtokens: 'longContextThresholdTokens',
  longcontextthreshold: 'longContextThresholdTokens',
  longcontextmultiplierinput: 'longContextMultiplierInput',
  longcontextinmultiplier: 'longContextMultiplierInput',
  longcontextmultiplieroutput: 'longContextMultiplierOutput',
  longcontextoutmultiplier: 'longContextMultiplierOutput',
  lifecyclestatus: 'lifecycleStatus',
  lifecycle: 'lifecycleStatus',
  successorslug: 'successorSlug',
  successor: 'successorSlug',
  ag: 'ag',
  agagentic: 'ag',
  agentic: 'ag',
  co: 'co',
  cocoding: 'co',
  coding: 'co',
  re: 're',
  rereasoning: 're',
  reasoning: 're',
  mm: 'mm',
  mmmultimodal: 'mm',
  multimodal: 'mm',
  kn: 'kn',
  knknowledge: 'kn',
  knowledge: 'kn',
  ml: 'ml',
  mlmultilingual: 'ml',
  multilingual: 'ml',
  if: 'if',
  ifinstruction: 'if',
  instruction: 'if',
  ma: 'ma',
  mamath: 'ma',
  math: 'ma',
};

const NUMERIC_BULK_FIELDS = new Set([
  'score',
  'tokPerSec',
  'inputPer1M',
  'outputPer1M',
  'cachedInputPer1M',
  'cacheWritePer1M',
  'batchDiscount',
  'maxOutputTokens',
  'longContextThresholdTokens',
  'longContextMultiplierInput',
  'longContextMultiplierOutput',
  'ag',
  'co',
  're',
  'mm',
  'kn',
  'ml',
  'if',
  'ma',
]);

const BOUNDED_SCORE_FIELDS = new Set(['score', 'ag', 'co', 're', 'mm', 'kn', 'ml', 'if', 'ma']);

function canonicalColKey(rawHeader: string): string | null {
  const cleaned = rawHeader
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/[^a-z0-9]/g, '');
  if (COLUMN_ALIASES[cleaned]) return COLUMN_ALIASES[cleaned];
  const fullCleaned = rawHeader.toLowerCase().replace(/[^a-z0-9]/g, '');
  return COLUMN_ALIASES[fullCleaned] || null;
}

function splitDelimitedLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      cells.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  cells.push(current.trim());
  return cells;
}

function parseCellValueWithValidation(
  field: string,
  rawVal: string
): { value: string | number | null; warning: string | null } {
  const v = rawVal.trim();
  if (!v || /^n\/?a$/i.test(v) || v === '-' || v === '—') {
    return { value: null, warning: null };
  }

  if (NUMERIC_BULK_FIELDS.has(field)) {
    const cleaned = v.replace(/[$,%]/g, '').replace(/,/g, '').trim();
    const num = Number(cleaned);
    if (!Number.isFinite(num) || num < 0) {
      return { value: null, warning: `Invalid numeric value "${rawVal}" for ${field}` };
    }
    if (BOUNDED_SCORE_FIELDS.has(field) && num > 100) {
      return { value: null, warning: `${field} value ${num} exceeds 100` };
    }
    if (field === 'batchDiscount') {
      const normalized = num > 1 ? Number((num / 100).toFixed(4)) : Number(num.toFixed(4));
      if (normalized > 1) {
        return { value: null, warning: `batchDiscount "${rawVal}" cannot exceed 100%` };
      }
      return { value: normalized, warning: null };
    }
    return { value: num, warning: null };
  }

  if (field === 'lifecycleStatus') {
    const allowed = ['Active', 'Preview', 'Deprecated', 'Legacy'];
    const matched = allowed.find((s) => s.toLowerCase() === v.toLowerCase());
    if (!matched) {
      return {
        value: null,
        warning: `Unknown lifecycleStatus "${rawVal}" (expected Active, Preview, Deprecated, or Legacy)`,
      };
    }
    return { value: matched, warning: null };
  }

  return { value: v, warning: null };
}

function normalizeModelFingerprint(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/^[^/]+\//, '')
    .replace(/\b(official|api|chat|instruct|preview|latest|exp|experimental)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function areModelsLikelyDuplicate(
  a: { slug?: string; id?: string; name?: string; provider?: string },
  b: { slug?: string; id?: string; name?: string; provider?: string }
): { match: boolean; reason: string } {
  const slugA = slugify(String(a.slug || a.id || ''));
  const slugB = slugify(String(b.slug || b.id || ''));
  if (slugA && slugB && slugA === slugB) {
    return { match: true, reason: `Identical slug (${slugA})` };
  }

  const nameSlugA = slugify(String(a.name || ''));
  const nameSlugB = slugify(String(b.name || ''));
  if (nameSlugA && nameSlugB && nameSlugA === nameSlugB) {
    return { match: true, reason: `Identical normalized name (${a.name})` };
  }

  const fpA = normalizeModelFingerprint(String(a.name || a.slug || ''));
  const fpB = normalizeModelFingerprint(String(b.name || b.slug || ''));
  const provA = slugify(String(a.provider || ''));
  const provB = slugify(String(b.provider || ''));
  if (fpA && fpB && fpA === fpB && (!provA || !provB || provA === provB)) {
    return { match: true, reason: `Same model fingerprint (${fpA})` };
  }

  return { match: false, reason: '' };
}

interface DuplicateCatalogGroup {
  key: string;
  reason: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  records: any[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findCatalogDuplicateGroups(modelsList: any[]): DuplicateCatalogGroup[] {
  const visited = new Set<number>();
  const groups: DuplicateCatalogGroup[] = [];

  for (let i = 0; i < modelsList.length; i++) {
    if (visited.has(i)) continue;
    const base = modelsList[i];
    if (!base) continue;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cluster: any[] = [base];
    let clusterReason = '';

    for (let j = i + 1; j < modelsList.length; j++) {
      if (visited.has(j)) continue;
      const candidate = modelsList[j];
      if (!candidate) continue;
      const check = areModelsLikelyDuplicate(base, candidate);
      if (check.match) {
        visited.add(j);
        cluster.push(candidate);
        if (!clusterReason) clusterReason = check.reason;
      }
    }

    if (cluster.length > 1) {
      visited.add(i);
      groups.push({
        key: String(base.slug || base.id || i),
        reason: clusterReason || 'Duplicate slug or model name',
        records: cluster,
      });
    }
  }

  return groups;
}

function extractModelKeyAndSlug(rawModelCell: string, explicitSlugCell?: string): {
  keyRaw: string;
  slugGuess: string;
} {
  const trimmed = rawModelCell.trim();
  if (explicitSlugCell && explicitSlugCell.trim()) {
    return { keyRaw: trimmed || explicitSlugCell.trim(), slugGuess: slugify(explicitSlugCell) };
  }
  const parenMatch = trimmed.match(/\(([^)]+)\)\s*$/);
  if (parenMatch && parenMatch[1]) {
    return {
      keyRaw: trimmed.replace(/\([^)]+\)\s*$/, '').trim() || parenMatch[1].trim(),
      slugGuess: slugify(parenMatch[1]),
    };
  }
  return { keyRaw: trimmed, slugGuess: slugify(trimmed) };
}

export function AdminRegistryClient({
  initialModels,
  initialPending,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialModels: any[];
  initialPending: PendingQueuePayload;
}) {
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [unlocked, setUnlocked] = useState<boolean>(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [models, setModels] = useState<any[]>(initialModels);
  const [pendingItems, setPendingItems] = useState<PendingQueueItem[]>(initialPending.items || []);
  const [activeTab, setActiveTab] = useState<
    'all' | 'new_model' | 'price_update' | 'benchmark_update' | 'catalog' | 'bulk_import' | 'manual_add'
  >('all');

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [providerFilter, setProviderFilter] = useState<string>('ALL');
  const [showArchived, setShowArchived] = useState<boolean>(false);

  const [overrides, setOverrides] = useState<Record<string, EditableOverrides>>({});
  const [duplicateAlert, setDuplicateAlert] = useState<{
    title: string;
    details: string[];
  } | null>(null);
  const [dismissedCount, setDismissedCount] = useState<number>(0);
  const [statusLog, setStatusLog] = useState<string[]>([]);
  const [publishing, setPublishing] = useState<boolean>(false);
  const [publishBanner, setPublishBanner] = useState<{ type: 'success' | 'error' | 'warn'; text: string } | null>(null);
  const [hasUnpublishedChanges, setHasUnpublishedChanges] = useState<boolean>(false);

  const [bulkRawInput, setBulkRawInput] = useState<string>('');
  const [bulkMarkVerified, setBulkMarkVerified] = useState<boolean>(true);
  const [bulkSourceUrl, setBulkSourceUrl] = useState<string>('');
  const [bulkPreview, setBulkPreview] = useState<BulkImportPatch[]>([]);
  const [bulkParseError, setBulkParseError] = useState<string | null>(null);
  const [bulkUnknownColumns, setBulkUnknownColumns] = useState<string[]>([]);

  const [editingLiveSlug, setEditingLiveSlug] = useState<string | null>(null);
  const [liveEditForm, setLiveEditForm] = useState<LiveEditState>({
    score: '',
    tokPerSec: '',
    inputPer1M: '',
    outputPer1M: '',
    cachedInputPer1M: '',
    cacheWritePer1M: '',
    batchDiscount: '',
    longContextThresholdTokens: '',
    longContextMultiplierInput: '',
    longContextMultiplierOutput: '',
    rpmLimit: '',
    tpmLimit: '',
    tpdLimit: '',
    contextWindow: '',
    maxOutputTokens: '',
    family: '',
    tier: '',
    license: '',
    bestFor: '',
    notes: '',
    lifecycleStatus: 'Active',
    successorSlug: '',
    archived: false,
    ag: '',
    co: '',
    re: '',
    mm: '',
    kn: '',
    ml: '',
    ifScore: '',
    ma: '',
    verified: true,
  });

  const [manualForm, setManualForm] = useState<NewManualModelState>({
    name: '',
    slug: '',
    provider: 'OpenAI',
    family: '',
    tier: '',
    license: 'Proprietary',
    contextWindow: '128K',
    maxOutputTokens: '16384',
    inputPer1M: '',
    outputPer1M: '',
    cachedInputPer1M: '',
    cacheWritePer1M: '',
    batchDiscount: '',
    longContextThresholdTokens: '',
    longContextMultiplierInput: '',
    longContextMultiplierOutput: '',
    score: '',
    tokPerSec: '',
    rpmLimit: '',
    tpmLimit: '',
    tpdLimit: '',
    bestFor: '',
    notes: '',
    verified: true,
  });
  const [manualError, setManualError] = useState<string | null>(null);

  const duplicateCatalogGroups = useMemo(() => findCatalogDuplicateGroups(models), [models]);

  const pendingDuplicateMap = useMemo(() => {
    const map = new Map<
      string,
      {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        catalogMatches: any[];
        queueDuplicates: PendingQueueItem[];
        reasons: string[];
      }
    >();

    for (let i = 0; i < pendingItems.length; i++) {
      const item = pendingItems[i];
      const probe = {
        slug: item.draftModel?.slug || item.modelSlug || item.modelId,
        id: item.draftModel?.id || item.modelId,
        name: item.draftModel?.name || item.modelName,
        provider: item.provider,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const catalogMatches: any[] = [];
      const reasons = new Set<string>();

      for (const m of models) {
        const res = areModelsLikelyDuplicate(probe, m);
        if (res.match) {
          catalogMatches.push(m);
          reasons.add(`Catalog match: ${m.name} (${m.slug}) — ${res.reason}`);
        }
      }

      const queueDuplicates: PendingQueueItem[] = [];
      for (let j = 0; j < pendingItems.length; j++) {
        if (i === j) continue;
        const other = pendingItems[j];
        const otherProbe = {
          slug: other.draftModel?.slug || other.modelSlug || other.modelId,
          id: other.draftModel?.id || other.modelId,
          name: other.draftModel?.name || other.modelName,
          provider: other.provider,
        };
        const res = areModelsLikelyDuplicate(probe, otherProbe);
        if (res.match) {
          queueDuplicates.push(other);
          reasons.add(`Pending queue duplicate: ${other.modelName} (${other.type}) — ${res.reason}`);
        }
      }

      if (catalogMatches.length > 0 || queueDuplicates.length > 0) {
        map.set(item.queueId, {
          catalogMatches,
          queueDuplicates,
          reasons: Array.from(reasons),
        });
      }
    }

    return map;
  }, [pendingItems, models]);

  const allProviders = useMemo(() => {
    const set = new Set<string>();
    for (const m of models) {
      if (m?.provider) set.add(String(m.provider));
    }
    for (const p of pendingItems) {
      if (p?.provider) set.add(String(p.provider));
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [models, pendingItems]);

  function findModelMatch(keyRaw: string, slugGuess: string) {
    const normName = slugify(keyRaw);
    return (
      models.find(
        (m) =>
          m.slug === slugGuess ||
          m.id === slugGuess ||
          slugify(m.slug) === slugGuess ||
          slugify(m.name) === normName ||
          slugify(m.name) === slugGuess
      ) || null
    );
  }

  function parseBulkText(rawText: string) {
    setBulkParseError(null);
    setBulkUnknownColumns([]);
    const trimmed = rawText.trim();
    if (!trimmed) {
      setBulkPreview([]);
      return;
    }

    const patches: BulkImportPatch[] = [];
    const seenTargetSlugs = new Set<string>();
    const unknownCols = new Set<string>();

    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        const rows = Array.isArray(parsed) ? parsed : Array.isArray(parsed.models) ? parsed.models : [parsed];
        rows.forEach((row: unknown, idx: number) => {
          if (!row || typeof row !== 'object') return;
          const record = row as Record<string, unknown>;
          const rawIdentifier = String(record.slug || record.id || record.model || record.name || '');
          const warnings: string[] = [];
          if (!rawIdentifier) {
            warnings.push('Missing model identifier (slug, id, model, or name)');
            patches.push({
              rowIndex: idx + 1,
              keyRaw: '(missing identifier)',
              slugGuess: '',
              matchedSlug: null,
              matchedName: null,
              fields: {},
              warnings,
              isDuplicate: false,
            });
            return;
          }

          const { keyRaw, slugGuess } = extractModelKeyAndSlug(
            String(record.name || record.model || rawIdentifier),
            record.slug || record.id ? String(record.slug || record.id) : undefined
          );
          const fields: Record<string, string | number> = {};
          for (const [k, v] of Object.entries(record)) {
            const mapped = canonicalColKey(k);
            if (!mapped) {
              unknownCols.add(k);
              continue;
            }
            if (mapped === 'model' || mapped === 'slug' || mapped === 'name') continue;
            if (v === null || v === undefined || v === '') continue;
            const { value: parsedVal, warning } = parseCellValueWithValidation(mapped, String(v));
            if (warning) warnings.push(warning);
            if (parsedVal !== null) fields[mapped] = parsedVal;
          }

          const matched = findModelMatch(keyRaw, slugGuess);
          const targetKey = matched ? matched.slug : slugGuess;
          const isDuplicate = Boolean(targetKey && seenTargetSlugs.has(targetKey));
          if (targetKey) {
            if (isDuplicate) {
              warnings.push(`Duplicate row for "${targetKey}" (later row overrides earlier row in batch)`);
            }
            seenTargetSlugs.add(targetKey);
          }
          if (Object.keys(fields).length === 0) {
            warnings.push('No valid updatable fields parsed on this row');
          }

          patches.push({
            rowIndex: idx + 1,
            keyRaw,
            slugGuess,
            matchedSlug: matched ? matched.slug : null,
            matchedName: matched ? matched.name : null,
            fields,
            warnings,
            isDuplicate,
          });
        });

        setBulkUnknownColumns(Array.from(unknownCols));
        setBulkPreview(patches);
        return;
      } catch (err) {
        setBulkParseError(`Invalid JSON: ${err instanceof Error ? err.message : String(err)}`);
        setBulkPreview([]);
        return;
      }
    }

    const lines = trimmed
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !/^\|?[\s:-]+\|[\s|:-]*$/.test(l));

    if (lines.length < 2) {
      setBulkParseError('Paste at least a header row and one model row (CSV, TSV, Markdown table, or JSON).');
      setBulkPreview([]);
      return;
    }

    const headerLine = lines[0];
    const delimiter = headerLine.includes('|')
      ? '|'
      : headerLine.includes('\t')
      ? '\t'
      : ',';

    const rawHeaders = splitDelimitedLine(headerLine, delimiter).filter(
      (h, idx, arr) => !(delimiter === '|' && h === '' && (idx === 0 || idx === arr.length - 1))
    );
    const mappedHeaders = rawHeaders.map((h, i) => {
      const mapped = canonicalColKey(h);
      if (!mapped && h.trim()) {
        unknownCols.add(h.trim());
      }
      if (i === 0 && !mapped) return 'model';
      return mapped;
    });

    const modelColIdx = mappedHeaders.findIndex((h) => h === 'model' || h === 'name');
    const slugColIdx = mappedHeaders.findIndex((h) => h === 'slug');
    const primaryKeyIdx = modelColIdx >= 0 ? modelColIdx : slugColIdx >= 0 ? slugColIdx : 0;

    for (let r = 1; r < lines.length; r++) {
      const rawCells = splitDelimitedLine(lines[r], delimiter).filter(
        (c, idx, arr) => !(delimiter === '|' && c === '' && (idx === 0 || idx === arr.length - 1))
      );
      if (rawCells.length === 0 || rawCells.every((c) => !c.trim())) continue;

      const warnings: string[] = [];
      if (rawCells.length !== rawHeaders.length) {
        warnings.push(`Column count mismatch: expected ${rawHeaders.length}, got ${rawCells.length}`);
      }

      const primaryRaw = rawCells[primaryKeyIdx] || '';
      const explicitSlug = slugColIdx >= 0 && slugColIdx !== primaryKeyIdx ? rawCells[slugColIdx] : undefined;
      const { keyRaw, slugGuess } = extractModelKeyAndSlug(primaryRaw, explicitSlug);
      if (!slugGuess) {
        warnings.push('Empty or unparseable model name/slug');
        patches.push({
          rowIndex: r,
          keyRaw: primaryRaw || '(empty)',
          slugGuess: '',
          matchedSlug: null,
          matchedName: null,
          fields: {},
          warnings,
          isDuplicate: false,
        });
        continue;
      }

      const fields: Record<string, string | number> = {};
      for (let c = 0; c < mappedHeaders.length; c++) {
        const field = mappedHeaders[c];
        if (!field || field === 'model' || field === 'slug' || field === 'name') continue;
        if (c >= rawCells.length) continue;
        const { value: val, warning } = parseCellValueWithValidation(field, rawCells[c]);
        if (warning) warnings.push(warning);
        if (val !== null) fields[field] = val;
      }

      const matched = findModelMatch(keyRaw, slugGuess);
      const targetKey = matched ? matched.slug : slugGuess;
      const isDuplicate = Boolean(targetKey && seenTargetSlugs.has(targetKey));
      if (targetKey) {
        if (isDuplicate) {
          warnings.push(`Duplicate row for "${targetKey}" (later row overrides earlier row in batch)`);
        }
        seenTargetSlugs.add(targetKey);
      }
      if (Object.keys(fields).length === 0) {
        warnings.push('No valid updatable fields parsed on this row');
      }

      patches.push({
        rowIndex: r,
        keyRaw,
        slugGuess,
        matchedSlug: matched ? matched.slug : null,
        matchedName: matched ? matched.name : null,
        fields,
        warnings,
        isDuplicate,
      });
    }

    if (patches.length === 0) {
      setBulkParseError(
        'Could not detect any model rows. Make sure the first row has column headers like Model, AG, CO, RE or Benchmark Score.'
      );
    }
    setBulkUnknownColumns(Array.from(unknownCols));
    setBulkPreview(patches);
  }

  function handleBulkFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === 'string' ? reader.result : '';
      setBulkRawInput(content);
      parseBulkText(content);
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function applyBulkPatches() {
    const matchedPatches = bulkPreview.filter((p) => p.matchedSlug && Object.keys(p.fields).length > 0);
    if (matchedPatches.length === 0) return;

    const nowIso = new Date().toISOString();
    const status = bulkMarkVerified ? 'Verified' : 'Estimated';
    const patchBySlug = new Map<string, Record<string, string | number>>();
    for (const p of matchedPatches) {
      if (!p.matchedSlug) continue;
      patchBySlug.set(p.matchedSlug, {
        ...(patchBySlug.get(p.matchedSlug) || {}),
        ...p.fields,
      });
    }

    setModels((prev) =>
      prev.map((m) => {
        const patch = patchBySlug.get(m.slug);
        if (!patch) return m;

        // Preserve all existing fields (hostingEndpoints, longContext multipliers, limits, family, tier, etc.)
        const next = { ...m, ...patch };
        if (patch.score !== undefined) {
          next.score = Number(patch.score);
          next.qualityScore = Number(patch.score);
          next.benchmarkProvenance = {
            ...(m.benchmarkProvenance || {}),
            status,
            sourceUrl: bulkSourceUrl.trim() || m.benchmarkProvenance?.sourceUrl || null,
            lastVerified: nowIso,
            notes: 'Imported via PromptBill Admin Bulk Importer',
          };
        }
        if (
          patch.ag !== undefined ||
          patch.co !== undefined ||
          patch.re !== undefined ||
          patch.mm !== undefined ||
          patch.kn !== undefined ||
          patch.ml !== undefined ||
          patch.if !== undefined ||
          patch.ma !== undefined
        ) {
          next.benchmarkProvenance = {
            ...(next.benchmarkProvenance || m.benchmarkProvenance || {}),
            status,
            sourceUrl: bulkSourceUrl.trim() || m.benchmarkProvenance?.sourceUrl || null,
            lastVerified: nowIso,
            notes: 'Capability scores imported via PromptBill Admin Bulk Importer',
          };
        }
        if (patch.tokPerSec !== undefined) {
          next.tokPerSec = Number(patch.tokPerSec);
          next.speedTokensPerSec = Number(patch.tokPerSec);
          next.speedProvenance = {
            ...(m.speedProvenance || {}),
            status,
            sourceUrl: bulkSourceUrl.trim() || m.speedProvenance?.sourceUrl || null,
            lastVerified: nowIso,
            notes: 'Speed imported via PromptBill Admin Bulk Importer',
          };
        }
        if (
          patch.inputPer1M !== undefined ||
          patch.outputPer1M !== undefined ||
          patch.cachedInputPer1M !== undefined ||
          patch.cacheWritePer1M !== undefined ||
          patch.batchDiscount !== undefined
        ) {
          next.pricingProvenance = {
            ...(m.pricingProvenance || {}),
            status,
            sourceUrl: bulkSourceUrl.trim() || m.pricingProvenance?.sourceUrl || null,
            lastVerified: nowIso,
            notes: 'Pricing imported via PromptBill Admin Bulk Importer',
          };
          const endpoints = Array.isArray(m.hostingEndpoints) ? [...m.hostingEndpoints] : [];
          const offIdx = endpoints.findIndex((ep) => ep && ep.providerType === 'Official API');
          if (offIdx >= 0) {
            endpoints[offIdx] = {
              ...endpoints[offIdx],
              ...(patch.inputPer1M !== undefined ? { inputPer1M: Number(patch.inputPer1M) } : {}),
              ...(patch.outputPer1M !== undefined ? { outputPer1M: Number(patch.outputPer1M) } : {}),
              ...(patch.cachedInputPer1M !== undefined ? { cachedInputPer1M: Number(patch.cachedInputPer1M) } : {}),
              ...(patch.cacheWritePer1M !== undefined ? { cacheWritePer1M: Number(patch.cacheWritePer1M) } : {}),
              ...(patch.batchDiscount !== undefined ? { batchDiscount: Number(patch.batchDiscount) } : {}),
              lastVerified: nowIso,
              evidenceStatus: status,
            };
            next.hostingEndpoints = endpoints;
          }
        }
        if (bulkMarkVerified) next.evidence = 'Verified';
        return next;
      })
    );

    setHasUnpublishedChanges(true);
    setStatusLog((prev) => [
      `Bulk-updated ${patchBySlug.size} model(s) from imported file/table`,
      ...prev,
    ]);
    setBulkRawInput('');
    setBulkPreview([]);
    setBulkUnknownColumns([]);
    setActiveTab('catalog');
  }

  function downloadSampleCsvTemplate() {
    const sample = [
      'Model,Slug,Family,Tier,Benchmark Score,Speed (tok/s),RPM Limit,TPM Limit,TPD Limit,Max Output Tokens,License,AG,CO,RE,MM,KN,ML,IF,MA,Best For',
      ...models.slice(0, 5).map(
        (m) =>
          `"${m.name}",${m.slug},"${m.family ?? ''}","${m.tier ?? ''}",${m.score ?? ''},${m.tokPerSec ?? ''},"${m.rpmLimit ?? ''}","${m.tpmLimit ?? ''}","${m.tpdLimit ?? ''}",${m.maxOutputTokens ?? ''},${m.license ?? 'Proprietary'},${m.ag ?? ''},${m.co ?? ''},${m.re ?? ''},${m.mm ?? ''},${m.kn ?? ''},${m.ml ?? ''},${m.if ?? ''},${m.ma ?? ''},"${m.bestFor ?? ''}"`
      ),
    ].join('\n');
    const blob = new Blob([sample + '\n'], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'promptbill-bulk-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function getItemEdits(item: PendingQueueItem): EditableOverrides {
    if (overrides[item.queueId]) return overrides[item.queueId];
    const draft = item.draftModel || {};
    const proposed = item.proposedValues || {};
    return {
      score:
        item.type === 'benchmark_update'
          ? String(proposed.score ?? '')
          : draft.score !== null && draft.score !== undefined
          ? String(draft.score)
          : '',
      tokPerSec:
        item.type === 'benchmark_update'
          ? String(proposed.tokPerSec ?? '')
          : draft.tokPerSec !== null && draft.tokPerSec !== undefined
          ? String(draft.tokPerSec)
          : '',
      officialInput:
        item.type === 'new_model' && draft.inputPer1M !== null && draft.inputPer1M !== undefined
          ? String(draft.inputPer1M)
          : '',
      officialOutput:
        item.type === 'new_model' && draft.outputPer1M !== null && draft.outputPer1M !== undefined
          ? String(draft.outputPer1M)
          : '',
      cachedInput:
        draft.cachedInputPer1M !== null && draft.cachedInputPer1M !== undefined
          ? String(draft.cachedInputPer1M)
          : '',
      cacheWrite:
        draft.cacheWritePer1M !== null && draft.cacheWritePer1M !== undefined
          ? String(draft.cacheWritePer1M)
          : '',
      routerInput:
        item.type === 'price_update'
          ? String(proposed.routerInputPer1M ?? '')
          : draft.inputPer1M !== null && draft.inputPer1M !== undefined
          ? String(draft.inputPer1M)
          : '',
      routerOutput:
        item.type === 'price_update'
          ? String(proposed.routerOutputPer1M ?? '')
          : draft.outputPer1M !== null && draft.outputPer1M !== undefined
          ? String(draft.outputPer1M)
          : '',
      batchDiscount:
        draft.batchDiscount !== null && draft.batchDiscount !== undefined
          ? String(Math.round(Number(draft.batchDiscount) * 100))
          : '',
      contextWindow: draft.contextWindow ? String(draft.contextWindow) : '',
      markVerified: false,
    };
  }

  function updateItemEdit(queueId: string, patch: Partial<EditableOverrides>, item: PendingQueueItem) {
    const current = getItemEdits(item);
    setOverrides((prev) => ({
      ...prev,
      [queueId]: { ...current, ...patch },
    }));
  }

  function parseOptionalNum(raw: string): number | null {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    const n = Number(trimmed);
    return Number.isFinite(n) && n >= 0 ? n : null;
  }

  function parseOptionalDiscount(raw: string): number | null {
    const n = parseOptionalNum(raw);
    if (n === null) return null;
    return n > 1 ? Number((n / 100).toFixed(4)) : Number(n.toFixed(4));
  }

  function mergeTwoModelRecords(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    primary: Record<string, any>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    secondary: Record<string, any>
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mergedEndpoints: any[] = Array.isArray(primary.hostingEndpoints)
      ? [...primary.hostingEndpoints]
      : [];
    if (Array.isArray(secondary.hostingEndpoints)) {
      for (const ep of secondary.hostingEndpoints) {
        if (!ep) continue;
        const exists = mergedEndpoints.some(
          (existingEp) =>
            existingEp &&
            slugify(String(existingEp.host || '')) === slugify(String(ep.host || '')) &&
            String(existingEp.providerType || '') === String(ep.providerType || '')
        );
        if (!exists) {
          mergedEndpoints.push(ep);
        }
      }
    }

    const merged = { ...primary };
    for (const [k, v] of Object.entries(secondary)) {
      if (k === 'id' || k === 'slug' || k === 'rank' || k === 'hostingEndpoints') continue;
      if ((merged[k] === null || merged[k] === undefined || merged[k] === '') && v !== null && v !== undefined && v !== '') {
        merged[k] = v;
      }
    }
    merged.hostingEndpoints = mergedEndpoints;
    if (primary.evidence === 'Verified' || secondary.evidence === 'Verified') {
      merged.evidence = 'Verified';
    }
    return merged;
  }

  function mergeDuplicateGroup(group: DuplicateCatalogGroup, keepSlug: string) {
    const primary = group.records.find((r) => r.slug === keepSlug) || group.records[0];
    const others = group.records.filter((r) => r !== primary);
    if (others.length === 0) return;

    let mergedRecord = { ...primary };
    for (const dup of others) {
      mergedRecord = mergeTwoModelRecords(mergedRecord, dup);
    }

    const removedSet = new Set(others);
    setModels((prev) =>
      prev
        .filter((m) => !removedSet.has(m))
        .map((m) => (m === primary ? mergedRecord : m))
    );
    setHasUnpublishedChanges(true);
    setStatusLog((prev) => [
      `Merged ${others.length} duplicate record(s) into ${mergedRecord.name} (${mergedRecord.slug})`,
      ...prev,
    ]);
  }

  function mergeAllCatalogDuplicates() {
    if (duplicateCatalogGroups.length === 0) return;
    let mergedCount = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const removedSet = new Set<any>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const replacementMap = new Map<any, any>();

    for (const group of duplicateCatalogGroups) {
      // Prefer Verified record with most populated fields
      const sorted = [...group.records].sort((a, b) => {
        const aVer = a.evidence === 'Verified' ? 1 : 0;
        const bVer = b.evidence === 'Verified' ? 1 : 0;
        if (bVer !== aVer) return bVer - aVer;
        const aFields = Object.values(a).filter((v) => v !== null && v !== undefined && v !== '').length;
        const bFields = Object.values(b).filter((v) => v !== null && v !== undefined && v !== '').length;
        return bFields - aFields;
      });
      const primary = sorted[0];
      let combined = { ...primary };
      for (let i = 1; i < sorted.length; i++) {
        combined = mergeTwoModelRecords(combined, sorted[i]);
        removedSet.add(sorted[i]);
        mergedCount++;
      }
      replacementMap.set(primary, combined);
    }

    setModels((prev) =>
      prev
        .filter((m) => !removedSet.has(m))
        .map((m) => (replacementMap.has(m) ? replacementMap.get(m) : m))
    );
    setHasUnpublishedChanges(true);
    setStatusLog((prev) => [
      `Auto-merged ${mergedCount} duplicate model record(s) across ${duplicateCatalogGroups.length} group(s)`,
      ...prev,
    ]);
  }

  function approveItem(item: PendingQueueItem, skipConfirm = false): void {
    const dupInfo = pendingDuplicateMap.get(item.queueId);
    if (item.type === 'new_model' && dupInfo && !skipConfirm) {
      const lines: string[] = [];
      if (dupInfo.catalogMatches.length > 0) {
        lines.push(
          `Already in live catalog: ${dupInfo.catalogMatches
            .map((m) => `${m.name} (${m.slug})`)
            .join(', ')}`
        );
      }
      if (dupInfo.queueDuplicates.length > 0) {
        lines.push(
          `Also duplicated in pending queue: ${dupInfo.queueDuplicates
            .map((q) => `${q.modelName} (${q.type})`)
            .join(', ')}`
        );
      }
      const proceed = window.confirm(
        `Duplicate model detected for "${item.modelName}":

• ${lines.join('\n• ')}

Click OK to merge this approval into the existing catalog model (without creating a duplicate entry), or Cancel to inspect/dismiss it.`
      );
      if (!proceed) {
        setDuplicateAlert({
          title: `Approval paused — duplicate detected for ${item.modelName}`,
          details: dupInfo.reasons,
        });
        return;
      }
    }

    const edits = getItemEdits(item);
    const nowIso = new Date().toISOString();
    const provStatus = edits.markVerified ? 'Verified' : 'Estimated';

    setModels((prevModels) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const next: any[] = [...prevModels];

      if (item.type === 'new_model' && item.draftModel) {
        const scoreVal = parseOptionalNum(edits.score);
        const speedVal = parseOptionalNum(edits.tokPerSec);
        const offIn = parseOptionalNum(edits.officialInput);
        const offOut = parseOptionalNum(edits.officialOutput);
        const cachedIn = parseOptionalNum(edits.cachedInput);
        const cacheWr = parseOptionalNum(edits.cacheWrite);
        const rIn = parseOptionalNum(edits.routerInput);
        const rOut = parseOptionalNum(edits.routerOutput);
        const batchDisc = parseOptionalDiscount(edits.batchDiscount);
        const ctxVal = edits.contextWindow.trim() || item.draftModel.contextWindow || null;

        const rawResolvedSlug = String(item.draftModel.slug || item.modelSlug || item.modelId);
        const rawResolvedId = String(item.draftModel.id || item.modelId || rawResolvedSlug);
        const probeForMatch = {
          slug: rawResolvedSlug,
          id: rawResolvedId,
          name: String(item.draftModel.name || item.modelName || ''),
          provider: item.provider,
        };
        const existingIdx = next.findIndex(
          (m) =>
            m.slug === rawResolvedSlug ||
            m.id === rawResolvedId ||
            areModelsLikelyDuplicate(probeForMatch, m).match
        );
        const existingModel = existingIdx >= 0 ? next[existingIdx] : null;
        const resolvedSlug = existingModel ? String(existingModel.slug) : rawResolvedSlug;
        const resolvedId = existingModel ? String(existingModel.id || existingModel.slug) : rawResolvedId;

        // Preserve non-Official/non-OpenRouter endpoints if re-approving an existing model
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const preservedEndpoints: any[] = Array.isArray(existingModel?.hostingEndpoints)
          ? existingModel.hostingEndpoints.filter(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (ep: any) =>
                ep &&
                ep.providerType !== 'Official API' &&
                ep.providerType !== 'Router' &&
                !/openrouter/i.test(String(ep.host || ''))
            )
          : [];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const endpoints: any[] = [];
        if (offIn !== null && offOut !== null) {
          endpoints.push({
            host: `${item.provider} Official API`,
            providerType: 'Official API',
            inputPer1M: offIn,
            cachedInputPer1M: cachedIn,
            cacheWritePer1M: cacheWr,
            outputPer1M: offOut,
            batchDiscount: batchDisc,
            latencyMs: null,
            notes: 'Approved via PromptBill Admin',
            currency: 'USD',
            pricingUnit: 'per 1M tokens',
            sourceUrl: item.sourceUrl || null,
            lastVerified: nowIso,
            evidenceStatus: provStatus,
          });
        }
        endpoints.push(...preservedEndpoints);
        if (rIn !== null && rOut !== null) {
          endpoints.push({
            host: 'OpenRouter',
            providerType: 'Router',
            inputPer1M: rIn,
            cachedInputPer1M: null,
            cacheWritePer1M: null,
            outputPer1M: rOut,
            batchDiscount: null,
            latencyMs: null,
            notes: 'Synced from OpenRouter & approved via Admin',
            currency: 'USD',
            pricingUnit: 'per 1M tokens',
            sourceUrl: item.sourceUrl || 'https://openrouter.ai/api/v1/models',
            lastVerified: nowIso,
            evidenceStatus: 'Verified',
          });
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newRecord: Record<string, any> = {
          ...(existingModel || {}),
          ...item.draftModel,
          id: resolvedId,
          slug: resolvedSlug,
          rank: existingModel?.rank ?? next.length + 1,
          evidence: provStatus,
          lifecycleStatus: existingModel?.lifecycleStatus || item.draftModel.lifecycleStatus || 'Active',
          archived: Boolean(existingModel?.archived ?? false),
          score: scoreVal,
          qualityScore: scoreVal,
          tokPerSec: speedVal,
          speedTokensPerSec: speedVal,
          contextWindow: ctxVal,
          inputPer1M: offIn ?? rIn,
          cachedInputPer1M: cachedIn,
          cacheWritePer1M: cacheWr,
          outputPer1M: offOut ?? rOut,
          batchDiscount: batchDisc,
          pricingProvenance: {
            status: (offIn ?? rIn) !== null ? provStatus : 'Unavailable',
            sourceUrl: item.sourceUrl || 'https://openrouter.ai/api/v1/models',
            lastVerified: nowIso,
            currency: 'USD',
            pricingUnit: 'per 1M tokens',
            notes: 'Approved via PromptBill Admin',
          },
          benchmarkProvenance: {
            status: scoreVal !== null ? provStatus : 'Unavailable',
            sourceUrl: existingModel?.benchmarkProvenance?.sourceUrl || null,
            lastVerified: scoreVal !== null ? nowIso : null,
            notes: scoreVal !== null ? 'Approved via PromptBill Admin' : 'No benchmark score recorded.',
          },
          speedProvenance: {
            status: speedVal !== null ? provStatus : 'Unavailable',
            sourceUrl: existingModel?.speedProvenance?.sourceUrl || null,
            lastVerified: speedVal !== null ? nowIso : null,
            hardwareOrProvider: existingModel?.speedProvenance?.hardwareOrProvider || null,
            conditions: existingModel?.speedProvenance?.conditions || null,
            notes: speedVal !== null ? 'Approved via PromptBill Admin' : 'No speed measurement recorded.',
          },
          hostingEndpoints: endpoints,
        };

        if (existingIdx >= 0) {
          next[existingIdx] = newRecord;
        } else {
          next.push(newRecord);
        }
      } else if (item.type === 'price_update') {
        const idx = next.findIndex((m) => m.slug === item.modelSlug || m.id === item.modelId);
        if (idx >= 0) {
          const target = { ...next[idx] };
          const rIn = parseOptionalNum(edits.routerInput);
          const rOut = parseOptionalNum(edits.routerOutput);
          const cachedIn = parseOptionalNum(edits.cachedInput);
          const cacheWr = parseOptionalNum(edits.cacheWrite);
          const batchDisc = parseOptionalDiscount(edits.batchDiscount);
          if (cachedIn !== null) target.cachedInputPer1M = cachedIn;
          if (cacheWr !== null) target.cacheWritePer1M = cacheWr;
          if (batchDisc !== null) target.batchDiscount = batchDisc;

          const endpoints = Array.isArray(target.hostingEndpoints) ? [...target.hostingEndpoints] : [];
          const routerIdx = endpoints.findIndex(
            (ep) => ep && (ep.providerType === 'Router' || /openrouter/i.test(String(ep.host || '')))
          );
          if (rIn !== null && rOut !== null) {
            const updatedEp = {
              ...(routerIdx >= 0 ? endpoints[routerIdx] : {}),
              host: 'OpenRouter',
              providerType: 'Router',
              inputPer1M: rIn,
              outputPer1M: rOut,
              currency: 'USD',
              pricingUnit: 'per 1M tokens',
              sourceUrl: item.sourceUrl || 'https://openrouter.ai/api/v1/models',
              lastVerified: nowIso,
              evidenceStatus: 'Verified',
            };
            if (routerIdx >= 0) endpoints[routerIdx] = updatedEp;
            else endpoints.push(updatedEp);
          }
          target.hostingEndpoints = endpoints;
          next[idx] = target;
        }
      } else if (item.type === 'benchmark_update') {
        const idx = next.findIndex((m) => m.slug === item.modelSlug || m.id === item.modelId);
        if (idx >= 0) {
          const target = { ...next[idx] };
          const scoreVal = parseOptionalNum(edits.score);
          const speedVal = parseOptionalNum(edits.tokPerSec);
          if (scoreVal !== null) {
            target.score = scoreVal;
            target.qualityScore = scoreVal;
            target.benchmarkProvenance = {
              ...(target.benchmarkProvenance || {}),
              status: provStatus,
              sourceUrl: item.sourceUrl || target.benchmarkProvenance?.sourceUrl || null,
              lastVerified: nowIso,
              notes: 'Benchmark update approved via PromptBill Admin',
            };
          }
          if (speedVal !== null) {
            target.tokPerSec = speedVal;
            target.speedTokensPerSec = speedVal;
            target.speedProvenance = {
              ...(target.speedProvenance || {}),
              status: provStatus,
              sourceUrl: item.sourceUrl || target.speedProvenance?.sourceUrl || null,
              lastVerified: nowIso,
              hardwareOrProvider: target.speedProvenance?.hardwareOrProvider || null,
              conditions: target.speedProvenance?.conditions || null,
              notes: 'Speed update approved via PromptBill Admin',
            };
          }
          if (edits.markVerified) target.evidence = 'Verified';
          next[idx] = target;
        }
      }

      return next;
    });

    setPendingItems((prev) => prev.filter((p) => p.queueId !== item.queueId));
    setHasUnpublishedChanges(true);
    setStatusLog((prev) => [
      `Approved${item.type === 'new_model' && dupInfo?.catalogMatches?.length ? ' & merged into existing' : ''}: ${item.modelName} (${item.type.replace('_', ' ')})`,
      ...prev,
    ]);
  }

  function rejectItem(item: PendingQueueItem) {
    setPendingItems((prev) => prev.filter((p) => p.queueId !== item.queueId));
    setDismissedCount((c) => c + 1);
    setHasUnpublishedChanges(true);
    setStatusLog((prev) => [`Dismissed: ${item.modelName}`, ...prev]);
  }

  function approveAllVisible() {
    const duplicateItems = filteredPending.filter(
      (item) => item.type === 'new_model' && pendingDuplicateMap.has(item.queueId)
    );
    if (duplicateItems.length > 0) {
      const summary = duplicateItems
        .map((d) => {
          const info = pendingDuplicateMap.get(d.queueId);
          return `• ${d.modelName}: ${info?.reasons.join('; ') || 'Duplicate detected'}`;
        })
        .join('\n');
      const ok = window.confirm(
        `${duplicateItems.length} duplicate model(s) detected in this batch:

${summary}\n
Click OK to approve and merge them into existing catalog models without creating duplicates, or Cancel to review them one by one.`
      );
      if (!ok) {
        setDuplicateAlert({
          title: `Batch approval paused — ${duplicateItems.length} duplicate model(s) detected`,
          details: duplicateItems.flatMap((d) => pendingDuplicateMap.get(d.queueId)?.reasons || []),
        });
        return;
      }
    }

    const seenInBatch = new Set<string>();
    for (const item of filteredPending) {
      const fp = normalizeModelFingerprint(String(item.draftModel?.name || item.modelName || item.modelSlug));
      if (item.type === 'new_model' && fp && seenInBatch.has(fp)) {
        // Already approved an earlier new_model row for the same model in this batch; skip creating a duplicate
        setPendingItems((prev) => prev.filter((p) => p.queueId !== item.queueId));
        setStatusLog((prev) => [`Skipped duplicate queue item in batch: ${item.modelName}`, ...prev]);
        continue;
      }
      if (item.type === 'new_model' && fp) {
        seenInBatch.add(fp);
      }
      approveItem(item, true);
    }
  }

  function dismissAllVisible() {
    if (filteredPending.length === 0) return;
    const ok = window.confirm(`Dismiss all ${filteredPending.length} visible pending item(s)?`);
    if (!ok) return;
    const ids = new Set(filteredPending.map((i) => i.queueId));
    setPendingItems((prev) => prev.filter((p) => !ids.has(p.queueId)));
    setDismissedCount((c) => c + ids.size);
    setHasUnpublishedChanges(true);
    setStatusLog((prev) => [`Dismissed ${ids.size} visible pending item(s)`, ...prev]);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function startEditingLiveModel(m: any) {
    setEditingLiveSlug(m.slug);
    setLiveEditForm({
      score: m.score !== null && m.score !== undefined ? String(m.score) : '',
      tokPerSec: m.tokPerSec !== null && m.tokPerSec !== undefined ? String(m.tokPerSec) : '',
      inputPer1M: m.inputPer1M !== null && m.inputPer1M !== undefined ? String(m.inputPer1M) : '',
      outputPer1M: m.outputPer1M !== null && m.outputPer1M !== undefined ? String(m.outputPer1M) : '',
      cachedInputPer1M:
        m.cachedInputPer1M !== null && m.cachedInputPer1M !== undefined ? String(m.cachedInputPer1M) : '',
      cacheWritePer1M:
        m.cacheWritePer1M !== null && m.cacheWritePer1M !== undefined ? String(m.cacheWritePer1M) : '',
      batchDiscount:
        m.batchDiscount !== null && m.batchDiscount !== undefined
          ? String(Math.round(Number(m.batchDiscount) * 100))
          : '',
      longContextThresholdTokens:
        m.longContextThresholdTokens !== null && m.longContextThresholdTokens !== undefined
          ? String(m.longContextThresholdTokens)
          : '',
      longContextMultiplierInput:
        m.longContextMultiplierInput !== null && m.longContextMultiplierInput !== undefined
          ? String(m.longContextMultiplierInput)
          : '',
      longContextMultiplierOutput:
        m.longContextMultiplierOutput !== null && m.longContextMultiplierOutput !== undefined
          ? String(m.longContextMultiplierOutput)
          : '',
      rpmLimit: m.rpmLimit ? String(m.rpmLimit) : '',
      tpmLimit: m.tpmLimit ? String(m.tpmLimit) : '',
      tpdLimit: m.tpdLimit ? String(m.tpdLimit) : '',
      contextWindow: m.contextWindow ? String(m.contextWindow) : '',
      maxOutputTokens:
        m.maxOutputTokens !== null && m.maxOutputTokens !== undefined ? String(m.maxOutputTokens) : '',
      family: m.family ? String(m.family) : '',
      tier: m.tier ? String(m.tier) : '',
      license: m.license ? String(m.license) : '',
      bestFor: m.bestFor ? String(m.bestFor) : '',
      notes: m.notes ? String(m.notes) : '',
      lifecycleStatus: m.lifecycleStatus ? String(m.lifecycleStatus) : 'Active',
      successorSlug: m.successorSlug ? String(m.successorSlug) : '',
      archived: Boolean(m.archived),
      ag: m.ag !== null && m.ag !== undefined ? String(m.ag) : '',
      co: m.co !== null && m.co !== undefined ? String(m.co) : '',
      re: m.re !== null && m.re !== undefined ? String(m.re) : '',
      mm: m.mm !== null && m.mm !== undefined ? String(m.mm) : '',
      kn: m.kn !== null && m.kn !== undefined ? String(m.kn) : '',
      ml: m.ml !== null && m.ml !== undefined ? String(m.ml) : '',
      ifScore: m.if !== null && m.if !== undefined ? String(m.if) : '',
      ma: m.ma !== null && m.ma !== undefined ? String(m.ma) : '',
      verified: m.evidence === 'Verified',
    });
  }

  function saveLiveModelEdit(slug: string) {
    const nowIso = new Date().toISOString();
    const scoreVal = parseOptionalNum(liveEditForm.score);
    const speedVal = parseOptionalNum(liveEditForm.tokPerSec);
    const inVal = parseOptionalNum(liveEditForm.inputPer1M);
    const outVal = parseOptionalNum(liveEditForm.outputPer1M);
    const cachedInVal = parseOptionalNum(liveEditForm.cachedInputPer1M);
    const cacheWrVal = parseOptionalNum(liveEditForm.cacheWritePer1M);
    const batchVal = parseOptionalDiscount(liveEditForm.batchDiscount);
    const lcThresholdVal = parseOptionalNum(liveEditForm.longContextThresholdTokens);
    const lcInMultVal = parseOptionalNum(liveEditForm.longContextMultiplierInput);
    const lcOutMultVal = parseOptionalNum(liveEditForm.longContextMultiplierOutput);
    const maxOutVal = parseOptionalNum(liveEditForm.maxOutputTokens);
    const status = liveEditForm.verified ? 'Verified' : 'Estimated';

    setModels((prev) =>
      prev.map((m) => {
        if (m.slug !== slug) return m;
        // Preserve all hostingEndpoints (Official API, Inference Cloud, Router)
        const endpoints = Array.isArray(m.hostingEndpoints) ? [...m.hostingEndpoints] : [];
        const offIdx = endpoints.findIndex((ep) => ep && ep.providerType === 'Official API');
        if (offIdx >= 0 && inVal !== null && outVal !== null) {
          endpoints[offIdx] = {
            ...endpoints[offIdx],
            inputPer1M: inVal,
            outputPer1M: outVal,
            cachedInputPer1M: cachedInVal,
            cacheWritePer1M: cacheWrVal,
            batchDiscount: batchVal,
            lastVerified: nowIso,
            evidenceStatus: status,
          };
        }
        return {
          ...m,
          evidence: status,
          score: scoreVal,
          qualityScore: scoreVal,
          tokPerSec: speedVal,
          speedTokensPerSec: speedVal,
          inputPer1M: inVal,
          outputPer1M: outVal,
          cachedInputPer1M: cachedInVal,
          cacheWritePer1M: cacheWrVal,
          batchDiscount: batchVal,
          longContextThresholdTokens: lcThresholdVal,
          longContextMultiplierInput: lcInMultVal,
          longContextMultiplierOutput: lcOutMultVal,
          rpmLimit: liveEditForm.rpmLimit.trim() || null,
          tpmLimit: liveEditForm.tpmLimit.trim() || null,
          tpdLimit: liveEditForm.tpdLimit.trim() || null,
          contextWindow: liveEditForm.contextWindow.trim() || null,
          maxOutputTokens: maxOutVal,
          family: liveEditForm.family.trim() || null,
          tier: liveEditForm.tier.trim() || null,
          license: liveEditForm.license.trim() || null,
          bestFor: liveEditForm.bestFor.trim() || null,
          notes: liveEditForm.notes.trim() || m.notes || null,
          lifecycleStatus: liveEditForm.lifecycleStatus || 'Active',
          successorSlug: liveEditForm.successorSlug.trim() || null,
          archived: liveEditForm.archived,
          ag: parseOptionalNum(liveEditForm.ag),
          co: parseOptionalNum(liveEditForm.co),
          re: parseOptionalNum(liveEditForm.re),
          mm: parseOptionalNum(liveEditForm.mm),
          kn: parseOptionalNum(liveEditForm.kn),
          ml: parseOptionalNum(liveEditForm.ml),
          if: parseOptionalNum(liveEditForm.ifScore),
          ma: parseOptionalNum(liveEditForm.ma),
          pricingProvenance: {
            ...(m.pricingProvenance || {}),
            status: inVal !== null && outVal !== null ? status : 'Unavailable',
            lastVerified: nowIso,
          },
          benchmarkProvenance: {
            ...(m.benchmarkProvenance || {}),
            status: scoreVal !== null ? status : 'Unavailable',
            lastVerified: scoreVal !== null ? nowIso : null,
          },
          speedProvenance: {
            ...(m.speedProvenance || {}),
            status: speedVal !== null ? status : 'Unavailable',
            lastVerified: speedVal !== null ? nowIso : null,
          },
          hostingEndpoints: endpoints,
        };
      })
    );

    setEditingLiveSlug(null);
    setHasUnpublishedChanges(true);
    setStatusLog((prev) => [`Updated live model: ${slug}`, ...prev]);
  }

  function handleAddManualModel(e: React.FormEvent) {
    e.preventDefault();
    setManualError(null);
    const cleanName = manualForm.name.trim();
    if (!cleanName) {
      setManualError('Model name is required.');
      return;
    }
    const resolvedSlug = slugify(manualForm.slug.trim() || cleanName);
    if (!resolvedSlug) {
      setManualError('Valid URL slug is required.');
      return;
    }

    const existing = models.find(
      (m) =>
        m.slug === resolvedSlug ||
        m.id === resolvedSlug ||
        areModelsLikelyDuplicate(
          { slug: resolvedSlug, id: resolvedSlug, name: cleanName, provider: manualForm.provider },
          m
        ).match
    );
    if (existing) {
      const ok = window.confirm(
        `Duplicate model detected: "${existing.name}" (${existing.slug}) already exists in the catalog. Merge/update that existing model instead of creating a duplicate?`
      );
      if (!ok) return;
    }

    const nowIso = new Date().toISOString();
    const status = manualForm.verified ? 'Verified' : 'Estimated';
    const inVal = parseOptionalNum(manualForm.inputPer1M);
    const outVal = parseOptionalNum(manualForm.outputPer1M);
    const cachedInVal = parseOptionalNum(manualForm.cachedInputPer1M);
    const cacheWrVal = parseOptionalNum(manualForm.cacheWritePer1M);
    const batchVal = parseOptionalDiscount(manualForm.batchDiscount);
    const lcThresholdVal = parseOptionalNum(manualForm.longContextThresholdTokens);
    const lcInMultVal = parseOptionalNum(manualForm.longContextMultiplierInput);
    const lcOutMultVal = parseOptionalNum(manualForm.longContextMultiplierOutput);
    const scoreVal = parseOptionalNum(manualForm.score);
    const speedVal = parseOptionalNum(manualForm.tokPerSec);
    const maxOutVal = parseOptionalNum(manualForm.maxOutputTokens);
    const providerClean = manualForm.provider.trim() || 'Unknown';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const preservedEndpoints: any[] = Array.isArray(existing?.hostingEndpoints)
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        existing.hostingEndpoints.filter((ep: any) => ep && ep.providerType !== 'Official API')
      : [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const endpoints: any[] =
      inVal !== null && outVal !== null
        ? [
            {
              host: `${providerClean} Official API`,
              providerType: 'Official API',
              inputPer1M: inVal,
              cachedInputPer1M: cachedInVal,
              cacheWritePer1M: cacheWrVal,
              outputPer1M: outVal,
              batchDiscount: batchVal,
              latencyMs: null,
              notes: 'Added via PromptBill Admin',
              currency: 'USD',
              pricingUnit: 'per 1M tokens',
              sourceUrl: null,
              lastVerified: nowIso,
              evidenceStatus: status,
            },
            ...preservedEndpoints,
          ]
        : preservedEndpoints;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newRecord: Record<string, any> = {
      ...(existing || {}),
      id: resolvedSlug,
      slug: resolvedSlug,
      rank: existing?.rank ?? models.length + 1,
      name: cleanName,
      provider: providerClean,
      providerSlug: slugify(providerClean),
      family: manualForm.family.trim() || existing?.family || null,
      license: manualForm.license.trim() || null,
      evidence: status,
      lifecycleStatus: existing?.lifecycleStatus || 'Active',
      archived: Boolean(existing?.archived ?? false),
      score: scoreVal,
      qualityScore: scoreVal,
      interval: existing?.interval ?? null,
      elo: existing?.elo ?? null,
      inputPer1M: inVal,
      cachedInputPer1M: cachedInVal,
      cacheWritePer1M: cacheWrVal,
      outputPer1M: outVal,
      longContextMultiplierInput: lcInMultVal,
      longContextMultiplierOutput: lcOutMultVal,
      longContextThresholdTokens: lcThresholdVal,
      contextWindow: manualForm.contextWindow.trim() || null,
      maxOutputTokens: maxOutVal,
      tokPerSec: speedVal,
      speedTokensPerSec: speedVal,
      ag: existing?.ag ?? null,
      co: existing?.co ?? null,
      re: existing?.re ?? null,
      mm: existing?.mm ?? null,
      kn: existing?.kn ?? null,
      ml: existing?.ml ?? null,
      if: existing?.if ?? null,
      ma: existing?.ma ?? null,
      rpmLimit: manualForm.rpmLimit.trim() || null,
      tpmLimit: manualForm.tpmLimit.trim() || null,
      tpdLimit: manualForm.tpdLimit.trim() || null,
      batchDiscount: batchVal,
      tier: manualForm.tier.trim() || existing?.tier || null,
      bestFor: manualForm.bestFor.trim() || null,
      notes: manualForm.notes.trim() || 'Added manually via PromptBill Admin.',
      pricingProvenance: {
        status: inVal !== null && outVal !== null ? status : 'Unavailable',
        sourceUrl: existing?.pricingProvenance?.sourceUrl ?? null,
        lastVerified: nowIso,
        currency: 'USD',
        pricingUnit: 'per 1M tokens',
        notes: 'Added via PromptBill Admin',
      },
      benchmarkProvenance: {
        status: scoreVal !== null ? status : 'Unavailable',
        sourceUrl: existing?.benchmarkProvenance?.sourceUrl ?? null,
        lastVerified: scoreVal !== null ? nowIso : null,
        notes: scoreVal !== null ? 'Added via PromptBill Admin' : 'No benchmark score recorded.',
      },
      speedProvenance: {
        status: speedVal !== null ? status : 'Unavailable',
        sourceUrl: existing?.speedProvenance?.sourceUrl ?? null,
        lastVerified: speedVal !== null ? nowIso : null,
        hardwareOrProvider: existing?.speedProvenance?.hardwareOrProvider ?? null,
        conditions: existing?.speedProvenance?.conditions ?? null,
        notes: speedVal !== null ? 'Added via PromptBill Admin' : 'No speed measurement recorded.',
      },
      priceHistory: Array.isArray(existing?.priceHistory) ? existing.priceHistory : [],
      hostingEndpoints: endpoints,
    };

    setModels((prev) => {
      const idx = prev.findIndex((m) => m.slug === resolvedSlug || m.id === resolvedSlug);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = newRecord;
        return copy;
      }
      return [...prev, newRecord];
    });

    setHasUnpublishedChanges(true);
    setStatusLog((prev) => [`Added manual model: ${cleanName} (${resolvedSlug})`, ...prev]);
    setManualForm({
      name: '',
      slug: '',
      provider: providerClean,
      family: '',
      tier: '',
      license: 'Proprietary',
      contextWindow: '128K',
      maxOutputTokens: '16384',
      inputPer1M: '',
      outputPer1M: '',
      cachedInputPer1M: '',
      cacheWritePer1M: '',
      batchDiscount: '',
      longContextThresholdTokens: '',
      longContextMultiplierInput: '',
      longContextMultiplierOutput: '',
      score: '',
      tokPerSec: '',
      rpmLimit: '',
      tpmLimit: '',
      tpdLimit: '',
      bestFor: '',
      notes: '',
      verified: true,
    });
    setActiveTab('catalog');
  }

  async function publishToGitHub() {
    setPublishing(true);
    setPublishBanner(null);

    const modelsJsonContent = JSON.stringify(models, null, 2) + '\n';
    const pendingJsonContent =
      JSON.stringify(
        {
          updatedAt: new Date().toISOString(),
          items: pendingItems,
        },
        null,
        2
      ) + '\n';

    try {
      const res = await fetch('/api/admin/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminPassword,
          modelsJsonContent,
          pendingJsonContent,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setHasUnpublishedChanges(false);
        setDismissedCount(0);
        setPublishBanner({ type: 'success', text: data.message });
      } else {
        setPublishBanner({
          type: data.needsSetup ? 'warn' : 'error',
          text: data.error || 'Could not publish automatically.',
        });
      }
    } catch {
      setPublishBanner({
        type: 'error',
        text: 'Network error while publishing. You can still download models.json below.',
      });
    } finally {
      setPublishing(false);
    }
  }

  function downloadJsonFile(filename: string, content: string) {
    const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  const filteredPending = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return pendingItems.filter((item) => {
      if (
        activeTab !== 'all' &&
        activeTab !== 'catalog' &&
        activeTab !== 'bulk_import' &&
        activeTab !== 'manual_add' &&
        item.type !== activeTab
      ) {
        return false;
      }
      if (providerFilter !== 'ALL' && item.provider !== providerFilter) return false;
      if (q) {
        const hay = `${item.modelName} ${item.modelSlug} ${item.provider} ${item.summary}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [pendingItems, activeTab, providerFilter, searchQuery]);

  const filteredCatalog = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return models.filter((m) => {
      if (!showArchived && m.archived) return false;
      if (providerFilter !== 'ALL' && m.provider !== providerFilter) return false;
      if (q) {
        const hay = `${m.name} ${m.slug} ${m.provider} ${m.family || ''} ${m.tier || ''} ${m.bestFor || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [models, showArchived, providerFilter, searchQuery]);

  const counts = useMemo(
    () => ({
      all: pendingItems.length,
      new_model: pendingItems.filter((i) => i.type === 'new_model').length,
      price_update: pendingItems.filter((i) => i.type === 'price_update').length,
      benchmark_update: pendingItems.filter((i) => i.type === 'benchmark_update').length,
    }),
    [pendingItems]
  );

  const matchedBulkCount = useMemo(
    () => bulkPreview.filter((p) => p.matchedSlug && Object.keys(p.fields).length > 0).length,
    [bulkPreview]
  );

  const bulkWarningCount = useMemo(
    () => bulkPreview.reduce((acc, p) => acc + p.warnings.length, 0),
    [bulkPreview]
  );

  if (!unlocked) {
    return (
      <div className="max-w-md mx-auto rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Unlock PromptBill Admin</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Enter your <code className="font-mono">ADMIN_PASSWORD</code> (configured in Vercel Environment Variables) to review and publish model, pricing, and benchmark updates.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (adminPassword.trim()) setUnlocked(true);
          }}
          className="space-y-3"
        >
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter admin password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="min-h-[42px] w-full rounded-lg border border-slate-300 px-3 pr-16 py-2 text-sm text-slate-900"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          <button
            type="submit"
            className="w-full min-h-[42px] rounded-lg bg-emerald-800 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900"
          >
            Open Approval Dashboard
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-semibold text-slate-600">
            Last GitHub Sync: {initialPending.updatedAt ? new Date(initialPending.updatedAt).toLocaleString() : 'Not run yet'} · Live Models: {models.length}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-900">
            <span>{pendingItems.length} item(s) waiting for your approval</span>
            {dismissedCount > 0 ? (
              <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-800">
                {dismissedCount} dismissed in session
              </span>
            ) : null}
            {hasUnpublishedChanges ? (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
                Unsaved changes ready to publish
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={publishToGitHub}
            disabled={publishing}
            className="min-h-[42px] rounded-lg bg-emerald-800 px-4 py-2 text-xs sm:text-sm font-bold text-white hover:bg-emerald-900 disabled:opacity-60"
          >
            {publishing ? 'Publishing to GitHub...' : 'Publish Approved Changes to Website'}
          </button>
          <button
            type="button"
            onClick={() => downloadJsonFile('models.json', JSON.stringify(models, null, 2) + '\n')}
            className="min-h-[42px] rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
          >
            Download models.json
          </button>
          <button
            type="button"
            onClick={() => {
              setUnlocked(false);
              setAdminPassword('');
            }}
            className="min-h-[42px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            Lock
          </button>
        </div>
      </div>

      {duplicateAlert ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs sm:text-sm text-amber-950 flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="font-bold">{duplicateAlert.title}</div>
            <ul className="list-disc pl-5 space-y-0.5 text-xs">
              {duplicateAlert.details.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          </div>
          <button
            type="button"
            onClick={() => setDuplicateAlert(null)}
            className="rounded border border-amber-400 bg-white px-2.5 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-100"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {duplicateCatalogGroups.length > 0 ? (
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 space-y-3 text-xs text-rose-950">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-bold">
                ⚠ {duplicateCatalogGroups.length} Duplicate Model Group(s) Detected in Catalog
              </span>
              <span className="ml-2 text-rose-800">
                (Publishing will be blocked until duplicate slugs are merged or resolved.)
              </span>
            </div>
            <button
              type="button"
              onClick={mergeAllCatalogDuplicates}
              className="min-h-[34px] rounded-lg bg-rose-800 px-3 py-1.5 font-bold text-white hover:bg-rose-900"
            >
              Auto-Merge All Duplicates
            </button>
          </div>
          <div className="space-y-2">
            {duplicateCatalogGroups.map((group) => (
              <div
                key={group.key}
                className="rounded-lg border border-rose-200 bg-white p-2.5 flex flex-wrap items-center justify-between gap-2"
              >
                <div>
                  <span className="font-semibold text-slate-900">{group.reason}:</span>{' '}
                  <span className="font-mono text-slate-700">
                    {group.records.map((r) => `${r.name} [${r.slug}]`).join('  vs  ')}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {group.records.map((r, idx) => (
                    <button
                      key={`${r.slug}-${idx}`}
                      type="button"
                      onClick={() => mergeDuplicateGroup(group, r.slug)}
                      className="rounded border border-slate-300 bg-slate-50 px-2.5 py-1 font-semibold text-slate-800 hover:bg-emerald-50 hover:border-emerald-600"
                    >
                      Keep &ldquo;{r.name}&rdquo; &amp; Merge
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {publishBanner ? (
        <div
          className={`rounded-xl border p-4 text-xs sm:text-sm ${
            publishBanner.type === 'success'
              ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
              : publishBanner.type === 'warn'
              ? 'border-amber-300 bg-amber-50 text-amber-950'
              : 'border-rose-300 bg-rose-50 text-rose-950'
          }`}
        >
          {publishBanner.text}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2 text-xs">
          {[
            { id: 'all', label: `All Pending (${counts.all})` },
            { id: 'new_model', label: `New Models (${counts.new_model})` },
            { id: 'price_update', label: `Price Updates (${counts.price_update})` },
            { id: 'benchmark_update', label: `Benchmarks (${counts.benchmark_update})` },
            { id: 'catalog', label: `Edit Live Catalog (${models.length})` },
            { id: 'bulk_import', label: 'Bulk Import (CSV / Table / JSON)' },
            { id: 'manual_add', label: '+ Add Model Manually' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`min-h-[38px] rounded-lg px-3.5 py-2 font-semibold ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white'
                  : 'border border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab !== 'catalog' &&
        activeTab !== 'bulk_import' &&
        activeTab !== 'manual_add' &&
        filteredPending.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={approveAllVisible}
              className="min-h-[38px] rounded-lg border border-emerald-700 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-900 hover:bg-emerald-100"
            >
              Approve Visible ({filteredPending.length})
            </button>
            <button
              type="button"
              onClick={dismissAllVisible}
              className="min-h-[38px] rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Dismiss Visible ({filteredPending.length})
            </button>
          </div>
        ) : null}
      </div>

      {activeTab !== 'manual_add' && activeTab !== 'bulk_import' ? (
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 text-xs">
          <input
            type="search"
            placeholder="Search by model name, slug, family, tier, or provider..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="min-h-[38px] flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-slate-900"
          />
          <select
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            className="min-h-[38px] rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-800"
          >
            <option value="ALL">All Providers ({allProviders.length})</option>
            {allProviders.map((prov) => (
              <option key={prov} value={prov}>
                {prov}
              </option>
            ))}
          </select>
          {activeTab === 'catalog' ? (
            <label className="inline-flex items-center gap-2 font-medium text-slate-700 px-1 cursor-pointer">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              <span>Show Archived</span>
            </label>
          ) : null}
          {searchQuery || providerFilter !== 'ALL' ? (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setProviderFilter('ALL');
              }}
              className="min-h-[38px] rounded-lg border border-slate-300 px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Reset Filters
            </button>
          ) : null}
        </div>
      ) : null}

      {activeTab === 'bulk_import' ? (
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 text-xs">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Bulk Import Benchmarks, Capability Scores &amp; Metadata
              </h3>
              <p className="text-slate-600 mt-0.5 leading-relaxed">
                Upload a <strong>.csv</strong> / <strong>.tsv</strong> / <strong>.json</strong> file or paste a copied Markdown/spreadsheet table (such as Capability Scores <code className="font-mono">AG–MA</code>, <code className="font-mono">Benchmark Score</code>, <code className="font-mono">Speed (tok/s)</code>, <code className="font-mono">Family</code>, <code className="font-mono">Tier</code>, <code className="font-mono">RPM/TPM/TPD</code>, <code className="font-mono">License</code>, and <code className="font-mono">Best For</code>). Models are matched by name or slug while preserving existing hosting endpoints and multipliers.
              </p>
            </div>
            <button
              type="button"
              onClick={downloadSampleCsvTemplate}
              className="min-h-[38px] rounded-lg border border-slate-300 bg-white px-3.5 py-2 font-semibold text-slate-800 hover:bg-slate-50"
            >
              Download Sample CSV Template
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex min-h-[38px] cursor-pointer items-center rounded-lg border border-slate-300 bg-slate-50 px-3.5 py-2 font-semibold text-slate-800 hover:bg-slate-100">
              <span>Upload CSV / TSV / JSON File</span>
              <input
                type="file"
                accept=".csv,.tsv,.txt,.md,.json"
                onChange={handleBulkFileUpload}
                className="hidden"
              />
            </label>
            <input
              type="url"
              placeholder="Optional verification source URL (e.g. https://...)"
              value={bulkSourceUrl}
              onChange={(e) => setBulkSourceUrl(e.target.value)}
              className="min-h-[38px] flex-1 min-w-[240px] rounded-lg border border-slate-300 px-3 py-1.5"
            />
            <label className="inline-flex items-center gap-2 font-semibold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={bulkMarkVerified}
                onChange={(e) => setBulkMarkVerified(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              <span>Mark Imported Data Verified</span>
            </label>
          </div>

          <textarea
            rows={7}
            placeholder={`Paste Markdown table, CSV, TSV, or JSON here, e.g.:\n| Model (slug) | AG (Agentic) | CO (Coding) | RE (Reasoning) | MM (Multimodal) | KN (Knowledge) | ML (Multilingual) |\n| GPT-6.2 Astra (gpt-6-2-astra) | 96 | 95 | 96 | 93 | 94 | 93 |`}
            value={bulkRawInput}
            onChange={(e) => {
              setBulkRawInput(e.target.value);
              parseBulkText(e.target.value);
            }}
            className="w-full rounded-lg border border-slate-300 p-3 font-mono text-xs text-slate-900"
          />

          {bulkParseError ? (
            <div className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-rose-900">
              {bulkParseError}
            </div>
          ) : null}

          {bulkUnknownColumns.length > 0 ? (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-950">
              Unrecognized column(s) ignored: <span className="font-mono">{bulkUnknownColumns.join(', ')}</span>
            </div>
          ) : null}

          {bulkPreview.length > 0 ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-bold text-slate-900">
                  Preview: {matchedBulkCount} of {bulkPreview.length} row(s) matched to existing catalog models
                  {bulkWarningCount > 0 ? (
                    <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-900">
                      {bulkWarningCount} warning(s)
                    </span>
                  ) : null}
                </div>
                <button
                  type="button"
                  disabled={matchedBulkCount === 0}
                  onClick={applyBulkPatches}
                  className="min-h-[40px] rounded-lg bg-emerald-800 px-4 py-2 font-bold text-white hover:bg-emerald-900 disabled:opacity-50"
                >
                  Apply {matchedBulkCount} Matched Model Update(s)
                </button>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100 font-semibold text-slate-800">
                      <th className="py-2 px-3">Row</th>
                      <th className="py-2 px-3">Row Input</th>
                      <th className="py-2 px-3">Matched Live Model</th>
                      <th className="py-2 px-3">Fields &amp; Validation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {bulkPreview.map((p, idx) => (
                      <tr
                        key={idx}
                        className={
                          p.warnings.length > 0 || !p.matchedSlug ? 'bg-amber-50/70' : 'bg-white'
                        }
                      >
                        <td className="py-2 px-3 font-mono text-slate-500">#{p.rowIndex}</td>
                        <td className="py-2 px-3 font-semibold text-slate-900">
                          {p.keyRaw} <span className="font-mono text-slate-500">({p.slugGuess || 'n/a'})</span>
                        </td>
                        <td className="py-2 px-3">
                          {p.matchedSlug ? (
                            <span className="rounded bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-900">
                              ✓ {p.matchedName} ({p.matchedSlug})
                            </span>
                          ) : (
                            <span className="rounded bg-amber-100 px-2 py-0.5 font-semibold text-amber-900">
                              Not found in live catalog (approve or add model first)
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 space-y-1">
                          <div className="font-mono text-slate-700">
                            {Object.entries(p.fields)
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(' · ') || 'No valid fields'}
                          </div>
                          {p.warnings.length > 0 ? (
                            <div className="text-[11px] font-medium text-amber-900">
                              ⚠ {p.warnings.join(' · ')}
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      ) : activeTab === 'manual_add' ? (
        <form
          onSubmit={handleAddManualModel}
          className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 text-xs"
        >
          <div>
            <h3 className="text-base font-bold text-slate-900">Add Model Manually to Catalog</h3>
            <p className="text-slate-600 mt-0.5">
              Use this for flagship models before they appear on OpenRouter. After adding, click{' '}
              <strong>Publish Approved Changes to Website</strong> at the top.
            </p>
          </div>

          {manualError ? (
            <div className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-rose-900">
              {manualError}
            </div>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            <label className="space-y-1">
              <span className="font-semibold text-slate-700 block">Model Name *</span>
              <input
                type="text"
                required
                placeholder="e.g. Claude Sonnet 4.6"
                value={manualForm.name}
                onChange={(e) =>
                  setManualForm({
                    ...manualForm,
                    name: e.target.value,
                    slug: slugify(e.target.value),
                  })
                }
                className="min-h-[38px] w-full rounded-lg border border-slate-300 px-3 py-1.5"
              />
            </label>
            <label className="space-y-1">
              <span className="font-semibold text-slate-700 block">URL Slug *</span>
              <input
                type="text"
                required
                placeholder="claude-sonnet-4-6"
                value={manualForm.slug}
                onChange={(e) => setManualForm({ ...manualForm, slug: slugify(e.target.value) })}
                className="min-h-[38px] w-full rounded-lg border border-slate-300 px-3 py-1.5 font-mono"
              />
            </label>
            <label className="space-y-1">
              <span className="font-semibold text-slate-700 block">Provider *</span>
              <input
                type="text"
                required
                placeholder="Anthropic"
                value={manualForm.provider}
                onChange={(e) => setManualForm({ ...manualForm, provider: e.target.value })}
                className="min-h-[38px] w-full rounded-lg border border-slate-300 px-3 py-1.5"
              />
            </label>
            <label className="space-y-1">
              <span className="font-semibold text-slate-700 block">Family</span>
              <input
                type="text"
                placeholder="e.g. Claude 4.6"
                value={manualForm.family}
                onChange={(e) => setManualForm({ ...manualForm, family: e.target.value })}
                className="min-h-[38px] w-full rounded-lg border border-slate-300 px-3 py-1.5"
              />
            </label>
            <label className="space-y-1">
              <span className="font-semibold text-slate-700 block">Tier</span>
              <input
                type="text"
                placeholder="Flagship / Balanced / Fast"
                value={manualForm.tier}
                onChange={(e) => setManualForm({ ...manualForm, tier: e.target.value })}
                className="min-h-[38px] w-full rounded-lg border border-slate-300 px-3 py-1.5"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <label className="space-y-1">
              <span className="font-semibold text-slate-700 block">Official In / 1M ($)</span>
              <input
                type="number"
                step="any"
                placeholder="3.00"
                value={manualForm.inputPer1M}
                onChange={(e) => setManualForm({ ...manualForm, inputPer1M: e.target.value })}
                className="min-h-[38px] w-full rounded-lg border border-slate-300 px-3 py-1.5 font-mono"
              />
            </label>
            <label className="space-y-1">
              <span className="font-semibold text-slate-700 block">Official Out / 1M ($)</span>
              <input
                type="number"
                step="any"
                placeholder="15.00"
                value={manualForm.outputPer1M}
                onChange={(e) => setManualForm({ ...manualForm, outputPer1M: e.target.value })}
                className="min-h-[38px] w-full rounded-lg border border-slate-300 px-3 py-1.5 font-mono"
              />
            </label>
            <label className="space-y-1">
              <span className="font-semibold text-slate-700 block">Cached Read / 1M ($)</span>
              <input
                type="number"
                step="any"
                placeholder="0.30"
                value={manualForm.cachedInputPer1M}
                onChange={(e) => setManualForm({ ...manualForm, cachedInputPer1M: e.target.value })}
                className="min-h-[38px] w-full rounded-lg border border-slate-300 px-3 py-1.5 font-mono"
              />
            </label>
            <label className="space-y-1">
              <span className="font-semibold text-slate-700 block">Cache Write / 1M ($)</span>
              <input
                type="number"
                step="any"
                placeholder="3.75"
                value={manualForm.cacheWritePer1M}
                onChange={(e) => setManualForm({ ...manualForm, cacheWritePer1M: e.target.value })}
                className="min-h-[38px] w-full rounded-lg border border-slate-300 px-3 py-1.5 font-mono"
              />
            </label>
            <label className="space-y-1">
              <span className="font-semibold text-slate-700 block">Batch Discount (%)</span>
              <input
                type="number"
                step="1"
                placeholder="50"
                value={manualForm.batchDiscount}
                onChange={(e) => setManualForm({ ...manualForm, batchDiscount: e.target.value })}
                className="min-h-[38px] w-full rounded-lg border border-slate-300 px-3 py-1.5 font-mono"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
            <label className="space-y-1">
              <span className="font-semibold text-slate-700 block">Benchmark Score</span>
              <input
                type="number"
                step="0.1"
                placeholder="89.5"
                value={manualForm.score}
                onChange={(e) => setManualForm({ ...manualForm, score: e.target.value })}
                className="min-h-[38px] w-full rounded-lg border border-slate-300 px-3 py-1.5 font-mono"
              />
            </label>
            <label className="space-y-1">
              <span className="font-semibold text-slate-700 block">Speed (tok/s)</span>
              <input
                type="number"
                step="1"
                placeholder="120"
                value={manualForm.tokPerSec}
                onChange={(e) => setManualForm({ ...manualForm, tokPerSec: e.target.value })}
                className="min-h-[38px] w-full rounded-lg border border-slate-300 px-3 py-1.5 font-mono"
              />
            </label>
            <label className="space-y-1">
              <span className="font-semibold text-slate-700 block">Context Window</span>
              <input
                type="text"
                placeholder="200K"
                value={manualForm.contextWindow}
                onChange={(e) => setManualForm({ ...manualForm, contextWindow: e.target.value })}
                className="min-h-[38px] w-full rounded-lg border border-slate-300 px-3 py-1.5 font-mono"
              />
            </label>
            <label className="space-y-1">
              <span className="font-semibold text-slate-700 block">Max Output Tokens</span>
              <input
                type="number"
                step="1"
                placeholder="16384"
                value={manualForm.maxOutputTokens}
                onChange={(e) => setManualForm({ ...manualForm, maxOutputTokens: e.target.value })}
                className="min-h-[38px] w-full rounded-lg border border-slate-300 px-3 py-1.5 font-mono"
              />
            </label>
            <label className="space-y-1">
              <span className="font-semibold text-slate-700 block">License</span>
              <input
                type="text"
                placeholder="Proprietary or Open-Weight"
                value={manualForm.license}
                onChange={(e) => setManualForm({ ...manualForm, license: e.target.value })}
                className="min-h-[38px] w-full rounded-lg border border-slate-300 px-3 py-1.5"
              />
            </label>
            <label className="space-y-1">
              <span className="font-semibold text-slate-700 block">RPM Limit</span>
              <input
                type="text"
                placeholder="4,000 RPM"
                value={manualForm.rpmLimit}
                onChange={(e) => setManualForm({ ...manualForm, rpmLimit: e.target.value })}
                className="min-h-[38px] w-full rounded-lg border border-slate-300 px-3 py-1.5 font-mono"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <label className="space-y-1">
              <span className="font-semibold text-slate-700 block">TPM Limit</span>
              <input
                type="text"
                placeholder="e.g. 2,000,000"
                value={manualForm.tpmLimit}
                onChange={(e) => setManualForm({ ...manualForm, tpmLimit: e.target.value })}
                className="min-h-[38px] w-full rounded-lg border border-slate-300 px-3 py-1.5 font-mono"
              />
            </label>
            <label className="space-y-1">
              <span className="font-semibold text-slate-700 block">TPD Limit</span>
              <input
                type="text"
                placeholder="Optional"
                value={manualForm.tpdLimit}
                onChange={(e) => setManualForm({ ...manualForm, tpdLimit: e.target.value })}
                className="min-h-[38px] w-full rounded-lg border border-slate-300 px-3 py-1.5 font-mono"
              />
            </label>
            <label className="space-y-1">
              <span className="font-semibold text-slate-700 block">Long-Ctx Threshold</span>
              <input
                type="number"
                step="1"
                placeholder="e.g. 200000"
                value={manualForm.longContextThresholdTokens}
                onChange={(e) =>
                  setManualForm({ ...manualForm, longContextThresholdTokens: e.target.value })
                }
                className="min-h-[38px] w-full rounded-lg border border-slate-300 px-3 py-1.5 font-mono"
              />
            </label>
            <label className="space-y-1">
              <span className="font-semibold text-slate-700 block">Long-Ctx In Mult</span>
              <input
                type="number"
                step="any"
                placeholder="e.g. 2"
                value={manualForm.longContextMultiplierInput}
                onChange={(e) =>
                  setManualForm({ ...manualForm, longContextMultiplierInput: e.target.value })
                }
                className="min-h-[38px] w-full rounded-lg border border-slate-300 px-3 py-1.5 font-mono"
              />
            </label>
            <label className="space-y-1">
              <span className="font-semibold text-slate-700 block">Long-Ctx Out Mult</span>
              <input
                type="number"
                step="any"
                placeholder="e.g. 1.5"
                value={manualForm.longContextMultiplierOutput}
                onChange={(e) =>
                  setManualForm({ ...manualForm, longContextMultiplierOutput: e.target.value })
                }
                className="min-h-[38px] w-full rounded-lg border border-slate-300 px-3 py-1.5 font-mono"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="font-semibold text-slate-700 block">Best For / Workload Tags</span>
              <input
                type="text"
                placeholder="Coding, agentic workflows, long-context synthesis"
                value={manualForm.bestFor}
                onChange={(e) => setManualForm({ ...manualForm, bestFor: e.target.value })}
                className="min-h-[38px] w-full rounded-lg border border-slate-300 px-3 py-1.5"
              />
            </label>
            <label className="space-y-1">
              <span className="font-semibold text-slate-700 block">Notes</span>
              <input
                type="text"
                placeholder="Official pricing verified from provider docs"
                value={manualForm.notes}
                onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                className="min-h-[38px] w-full rounded-lg border border-slate-300 px-3 py-1.5"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <label className="inline-flex items-center gap-2 font-semibold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={manualForm.verified}
                onChange={(e) => setManualForm({ ...manualForm, verified: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300"
              />
              <span>Mark as Verified</span>
            </label>
            <button
              type="submit"
              className="min-h-[40px] rounded-lg bg-emerald-800 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-900"
            >
              Add to Working Catalog
            </button>
          </div>
        </form>
      ) : activeTab !== 'catalog' ? (
        filteredPending.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
            No pending items match the current tab/filters. GitHub Actions checks daily at 04:00 UTC (or you can run the workflow manually in GitHub Actions).
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPending.map((item) => {
              const edits = getItemEdits(item);
              const cur = item.currentValues || {};
              const prop = item.proposedValues || {};
              const dupInfo = pendingDuplicateMap.get(item.queueId);
              return (
                <div
                  key={item.queueId}
                  className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${
                            item.type === 'new_model'
                              ? 'bg-indigo-100 text-indigo-900'
                              : item.type === 'price_update'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-emerald-100 text-emerald-900'
                          }`}
                        >
                          {item.type.replace('_', ' ')}
                        </span>
                        <h3 className="text-base font-bold text-slate-900">{item.modelName}</h3>
                        <span className="text-xs text-slate-500">({item.provider})</span>
                        {dupInfo ? (
                          <span
                            title={dupInfo.reasons.join(' | ')}
                            className="rounded-full bg-rose-100 border border-rose-300 px-2.5 py-0.5 text-[11px] font-bold text-rose-900"
                          >
                            ⚠ Duplicate Detected ({dupInfo.catalogMatches.length > 0 ? 'In Catalog' : 'In Queue'})
                          </span>
                        ) : null}
                        {item.sourceUrl ? (
                          <a
                            href={item.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-semibold text-emerald-800 underline"
                          >
                            Source ↗
                          </a>
                        ) : null}
                      </div>
                      <p className="text-xs text-slate-700">{item.summary}</p>
                      {dupInfo ? (
                        <div className="rounded-lg border border-rose-200 bg-rose-50/80 px-2.5 py-1.5 text-[11px] text-rose-950">
                          <strong>Duplicate check:</strong> {dupInfo.reasons.join(' · ')}. Approving will merge into the existing record instead of creating a duplicate.
                        </div>
                      ) : null}
                      {(Object.keys(cur).length > 0 || Object.keys(prop).length > 0) ? (
                        <div className="flex flex-wrap gap-3 pt-1 text-[11px] font-mono text-slate-600">
                          {item.type === 'price_update' ? (
                            <>
                              <span>
                                Current Router: ${String(cur.routerInputPer1M ?? 'N/A')} / $
                                {String(cur.routerOutputPer1M ?? 'N/A')}
                              </span>
                              <span className="text-amber-900 font-semibold">
                                Proposed Router: ${String(prop.routerInputPer1M ?? 'N/A')} / $
                                {String(prop.routerOutputPer1M ?? 'N/A')}
                              </span>
                            </>
                          ) : null}
                          {item.type === 'benchmark_update' ? (
                            <>
                              <span>
                                Current: Score {String(cur.score ?? 'N/A')}, Speed {String(cur.tokPerSec ?? 'N/A')} tok/s
                              </span>
                              <span className="text-emerald-900 font-semibold">
                                Proposed: Score {String(prop.score ?? 'N/A')}, Speed {String(prop.tokPerSec ?? 'N/A')} tok/s
                              </span>
                            </>
                          ) : null}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => approveItem(item)}
                        className="min-h-[38px] rounded-lg bg-emerald-800 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-900"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => rejectItem(item)}
                        className="min-h-[38px] rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 border-t border-slate-100 text-xs">
                    {item.type === 'new_model' ? (
                      <>
                        <label className="space-y-1">
                          <span className="text-slate-600 font-medium block">Official In / 1M</span>
                          <input
                            type="number"
                            step="any"
                            placeholder="Optional"
                            value={edits.officialInput}
                            onChange={(e) => updateItemEdit(item.queueId, { officialInput: e.target.value }, item)}
                            className="min-h-[36px] w-full rounded-lg border border-slate-300 px-2.5 py-1 font-mono"
                          />
                        </label>
                        <label className="space-y-1">
                          <span className="text-slate-600 font-medium block">Official Out / 1M</span>
                          <input
                            type="number"
                            step="any"
                            placeholder="Optional"
                            value={edits.officialOutput}
                            onChange={(e) => updateItemEdit(item.queueId, { officialOutput: e.target.value }, item)}
                            className="min-h-[36px] w-full rounded-lg border border-slate-300 px-2.5 py-1 font-mono"
                          />
                        </label>
                      </>
                    ) : null}

                    {item.type !== 'benchmark_update' ? (
                      <>
                        <label className="space-y-1">
                          <span className="text-slate-600 font-medium block">Router In / 1M</span>
                          <input
                            type="number"
                            step="any"
                            value={edits.routerInput}
                            onChange={(e) => updateItemEdit(item.queueId, { routerInput: e.target.value }, item)}
                            className="min-h-[36px] w-full rounded-lg border border-slate-300 px-2.5 py-1 font-mono"
                          />
                        </label>
                        <label className="space-y-1">
                          <span className="text-slate-600 font-medium block">Router Out / 1M</span>
                          <input
                            type="number"
                            step="any"
                            value={edits.routerOutput}
                            onChange={(e) => updateItemEdit(item.queueId, { routerOutput: e.target.value }, item)}
                            className="min-h-[36px] w-full rounded-lg border border-slate-300 px-2.5 py-1 font-mono"
                          />
                        </label>
                        <label className="space-y-1">
                          <span className="text-slate-600 font-medium block">Cached Read / 1M</span>
                          <input
                            type="number"
                            step="any"
                            placeholder="Optional"
                            value={edits.cachedInput}
                            onChange={(e) => updateItemEdit(item.queueId, { cachedInput: e.target.value }, item)}
                            className="min-h-[36px] w-full rounded-lg border border-slate-300 px-2.5 py-1 font-mono"
                          />
                        </label>
                        <label className="space-y-1">
                          <span className="text-slate-600 font-medium block">Cache Write / 1M</span>
                          <input
                            type="number"
                            step="any"
                            placeholder="Optional"
                            value={edits.cacheWrite}
                            onChange={(e) => updateItemEdit(item.queueId, { cacheWrite: e.target.value }, item)}
                            className="min-h-[36px] w-full rounded-lg border border-slate-300 px-2.5 py-1 font-mono"
                          />
                        </label>
                        <label className="space-y-1">
                          <span className="text-slate-600 font-medium block">Batch Discount (%)</span>
                          <input
                            type="number"
                            step="1"
                            placeholder="e.g. 50"
                            value={edits.batchDiscount}
                            onChange={(e) => updateItemEdit(item.queueId, { batchDiscount: e.target.value }, item)}
                            className="min-h-[36px] w-full rounded-lg border border-slate-300 px-2.5 py-1 font-mono"
                          />
                        </label>
                      </>
                    ) : null}

                    {item.type === 'new_model' ? (
                      <label className="space-y-1">
                        <span className="text-slate-600 font-medium block">Context Window</span>
                        <input
                          type="text"
                          placeholder="e.g. 128K"
                          value={edits.contextWindow}
                          onChange={(e) => updateItemEdit(item.queueId, { contextWindow: e.target.value }, item)}
                          className="min-h-[36px] w-full rounded-lg border border-slate-300 px-2.5 py-1 font-mono"
                        />
                      </label>
                    ) : null}

                    <label className="space-y-1">
                      <span className="text-slate-600 font-medium block">Benchmark Score</span>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="e.g. 88.5"
                        value={edits.score}
                        onChange={(e) => updateItemEdit(item.queueId, { score: e.target.value }, item)}
                        className="min-h-[36px] w-full rounded-lg border border-slate-300 px-2.5 py-1 font-mono"
                      />
                    </label>

                    <label className="space-y-1">
                      <span className="text-slate-600 font-medium block">Speed (tok/s)</span>
                      <input
                        type="number"
                        step="1"
                        placeholder="e.g. 140"
                        value={edits.tokPerSec}
                        onChange={(e) => updateItemEdit(item.queueId, { tokPerSec: e.target.value }, item)}
                        className="min-h-[36px] w-full rounded-lg border border-slate-300 px-2.5 py-1 font-mono"
                      />
                    </label>

                    <label className="flex items-center gap-2 pt-5 font-medium text-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={edits.markVerified}
                        onChange={(e) => updateItemEdit(item.queueId, { markVerified: e.target.checked }, item)}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      <span>Mark Verified</span>
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100 font-semibold text-slate-800">
                  <th className="py-2.5 px-3">Model</th>
                  <th className="py-2.5 px-3">Lifecycle</th>
                  <th className="py-2.5 px-3">Score</th>
                  <th className="py-2.5 px-3">Speed</th>
                  <th className="py-2.5 px-3">Official In / Out</th>
                  <th className="py-2.5 px-3">Cached / Batch</th>
                  <th className="py-2.5 px-3">Endpoints</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredCatalog.map((m) => {
                  const isEditing = editingLiveSlug === m.slug;
                  const endpointCount = Array.isArray(m.hostingEndpoints) ? m.hostingEndpoints.length : 0;
                  return (
                    <React.Fragment key={m.slug}>
                      <tr className={m.archived ? 'bg-slate-50 text-slate-500' : 'bg-white'}>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {m.name} <span className="font-normal text-slate-500">({m.provider})</span>
                          {m.tier ? (
                            <span className="ml-1.5 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-700">
                              {m.tier}
                            </span>
                          ) : null}
                          {m.archived ? (
                            <span className="ml-1.5 rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                              ARCHIVED
                            </span>
                          ) : null}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                              m.lifecycleStatus === 'Deprecated' || m.lifecycleStatus === 'Legacy'
                                ? 'bg-amber-100 text-amber-900'
                                : m.lifecycleStatus === 'Preview'
                                ? 'bg-indigo-100 text-indigo-900'
                                : 'bg-emerald-50 text-emerald-900'
                            }`}
                          >
                            {m.lifecycleStatus || 'Active'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono">{m.score ?? 'N/A'}</td>
                        <td className="py-2.5 px-3 font-mono">
                          {m.tokPerSec !== null && m.tokPerSec !== undefined ? `${m.tokPerSec} tok/s` : 'N/A'}
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          ${m.inputPer1M ?? 'N/A'} / ${m.outputPer1M ?? 'N/A'}
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          ${m.cachedInputPer1M ?? 'N/A'} ·{' '}
                          {m.batchDiscount !== null && m.batchDiscount !== undefined
                            ? `${Math.round(Number(m.batchDiscount) * 100)}%`
                            : 'N/A'}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">{endpointCount}</td>
                        <td className="py-2.5 px-3">{m.evidence || 'Estimated'}</td>
                        <td className="py-2.5 px-3 text-right">
                          {isEditing ? (
                            <div className="inline-flex gap-1.5">
                              <button
                                type="button"
                                onClick={() => saveLiveModelEdit(m.slug)}
                                className="rounded bg-emerald-800 px-2.5 py-1 font-semibold text-white"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingLiveSlug(null)}
                                className="rounded border border-slate-300 px-2.5 py-1"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => startEditingLiveModel(m)}
                              className="rounded border border-slate-300 px-2.5 py-1 font-semibold text-slate-800 hover:bg-slate-50"
                            >
                              Full Edit
                            </button>
                          )}
                        </td>
                      </tr>

                      {isEditing ? (
                        <tr className="bg-slate-50/90">
                          <td colSpan={9} className="p-4">
                            <div className="space-y-3 text-xs">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="font-bold text-slate-900">
                                  Editing {m.name} ({m.slug})
                                </div>
                                {endpointCount > 0 ? (
                                  <div className="text-[11px] text-slate-600">
                                    Preserved endpoints:{' '}
                                    <span className="font-mono">
                                      {m.hostingEndpoints
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        .map((ep: any) => ep.host)
                                        .join(', ')}
                                    </span>
                                  </div>
                                ) : null}
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                <label className="space-y-1">
                                  <span className="text-slate-600 font-medium block">Official In / 1M</span>
                                  <input
                                    type="number"
                                    step="any"
                                    value={liveEditForm.inputPer1M}
                                    onChange={(e) => setLiveEditForm({ ...liveEditForm, inputPer1M: e.target.value })}
                                    className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 font-mono"
                                  />
                                </label>
                                <label className="space-y-1">
                                  <span className="text-slate-600 font-medium block">Official Out / 1M</span>
                                  <input
                                    type="number"
                                    step="any"
                                    value={liveEditForm.outputPer1M}
                                    onChange={(e) => setLiveEditForm({ ...liveEditForm, outputPer1M: e.target.value })}
                                    className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 font-mono"
                                  />
                                </label>
                                <label className="space-y-1">
                                  <span className="text-slate-600 font-medium block">Cached Read / 1M</span>
                                  <input
                                    type="number"
                                    step="any"
                                    value={liveEditForm.cachedInputPer1M}
                                    onChange={(e) =>
                                      setLiveEditForm({ ...liveEditForm, cachedInputPer1M: e.target.value })
                                    }
                                    className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 font-mono"
                                  />
                                </label>
                                <label className="space-y-1">
                                  <span className="text-slate-600 font-medium block">Cache Write / 1M</span>
                                  <input
                                    type="number"
                                    step="any"
                                    value={liveEditForm.cacheWritePer1M}
                                    onChange={(e) =>
                                      setLiveEditForm({ ...liveEditForm, cacheWritePer1M: e.target.value })
                                    }
                                    className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 font-mono"
                                  />
                                </label>
                                <label className="space-y-1">
                                  <span className="text-slate-600 font-medium block">Batch Discount (%)</span>
                                  <input
                                    type="number"
                                    step="1"
                                    value={liveEditForm.batchDiscount}
                                    onChange={(e) =>
                                      setLiveEditForm({ ...liveEditForm, batchDiscount: e.target.value })
                                    }
                                    className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 font-mono"
                                  />
                                </label>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                                <label className="space-y-1">
                                  <span className="text-slate-600 font-medium block">Benchmark Score</span>
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={liveEditForm.score}
                                    onChange={(e) => setLiveEditForm({ ...liveEditForm, score: e.target.value })}
                                    className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 font-mono"
                                  />
                                </label>
                                <label className="space-y-1">
                                  <span className="text-slate-600 font-medium block">Speed (tok/s)</span>
                                  <input
                                    type="number"
                                    step="1"
                                    value={liveEditForm.tokPerSec}
                                    onChange={(e) => setLiveEditForm({ ...liveEditForm, tokPerSec: e.target.value })}
                                    className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 font-mono"
                                  />
                                </label>
                                <label className="space-y-1">
                                  <span className="text-slate-600 font-medium block">Context Window</span>
                                  <input
                                    type="text"
                                    value={liveEditForm.contextWindow}
                                    onChange={(e) =>
                                      setLiveEditForm({ ...liveEditForm, contextWindow: e.target.value })
                                    }
                                    className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 font-mono"
                                  />
                                </label>
                                <label className="space-y-1">
                                  <span className="text-slate-600 font-medium block">Max Output Tokens</span>
                                  <input
                                    type="number"
                                    step="1"
                                    value={liveEditForm.maxOutputTokens}
                                    onChange={(e) =>
                                      setLiveEditForm({ ...liveEditForm, maxOutputTokens: e.target.value })
                                    }
                                    className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 font-mono"
                                  />
                                </label>
                                <label className="space-y-1">
                                  <span className="text-slate-600 font-medium block">Family</span>
                                  <input
                                    type="text"
                                    value={liveEditForm.family}
                                    onChange={(e) => setLiveEditForm({ ...liveEditForm, family: e.target.value })}
                                    className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5"
                                  />
                                </label>
                                <label className="space-y-1">
                                  <span className="text-slate-600 font-medium block">Tier</span>
                                  <input
                                    type="text"
                                    value={liveEditForm.tier}
                                    onChange={(e) => setLiveEditForm({ ...liveEditForm, tier: e.target.value })}
                                    className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5"
                                  />
                                </label>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                                <label className="space-y-1">
                                  <span className="text-slate-600 font-medium block">RPM Limit</span>
                                  <input
                                    type="text"
                                    value={liveEditForm.rpmLimit}
                                    onChange={(e) => setLiveEditForm({ ...liveEditForm, rpmLimit: e.target.value })}
                                    className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 font-mono"
                                  />
                                </label>
                                <label className="space-y-1">
                                  <span className="text-slate-600 font-medium block">TPM Limit</span>
                                  <input
                                    type="text"
                                    value={liveEditForm.tpmLimit}
                                    onChange={(e) => setLiveEditForm({ ...liveEditForm, tpmLimit: e.target.value })}
                                    className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 font-mono"
                                  />
                                </label>
                                <label className="space-y-1">
                                  <span className="text-slate-600 font-medium block">TPD Limit</span>
                                  <input
                                    type="text"
                                    value={liveEditForm.tpdLimit}
                                    onChange={(e) => setLiveEditForm({ ...liveEditForm, tpdLimit: e.target.value })}
                                    className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 font-mono"
                                  />
                                </label>
                                <label className="space-y-1">
                                  <span className="text-slate-600 font-medium block">Long-Ctx Threshold</span>
                                  <input
                                    type="number"
                                    step="1"
                                    value={liveEditForm.longContextThresholdTokens}
                                    onChange={(e) =>
                                      setLiveEditForm({
                                        ...liveEditForm,
                                        longContextThresholdTokens: e.target.value,
                                      })
                                    }
                                    className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 font-mono"
                                  />
                                </label>
                                <label className="space-y-1">
                                  <span className="text-slate-600 font-medium block">Long-Ctx In Mult</span>
                                  <input
                                    type="number"
                                    step="any"
                                    value={liveEditForm.longContextMultiplierInput}
                                    onChange={(e) =>
                                      setLiveEditForm({
                                        ...liveEditForm,
                                        longContextMultiplierInput: e.target.value,
                                      })
                                    }
                                    className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 font-mono"
                                  />
                                </label>
                                <label className="space-y-1">
                                  <span className="text-slate-600 font-medium block">Long-Ctx Out Mult</span>
                                  <input
                                    type="number"
                                    step="any"
                                    value={liveEditForm.longContextMultiplierOutput}
                                    onChange={(e) =>
                                      setLiveEditForm({
                                        ...liveEditForm,
                                        longContextMultiplierOutput: e.target.value,
                                      })
                                    }
                                    className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 font-mono"
                                  />
                                </label>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                                <label className="space-y-1">
                                  <span className="text-slate-600 font-medium block">License</span>
                                  <input
                                    type="text"
                                    value={liveEditForm.license}
                                    onChange={(e) => setLiveEditForm({ ...liveEditForm, license: e.target.value })}
                                    className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5"
                                  />
                                </label>
                                <label className="space-y-1">
                                  <span className="text-slate-600 font-medium block">Lifecycle Status</span>
                                  <select
                                    value={liveEditForm.lifecycleStatus}
                                    onChange={(e) =>
                                      setLiveEditForm({ ...liveEditForm, lifecycleStatus: e.target.value })
                                    }
                                    className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5"
                                  >
                                    <option value="Active">Active</option>
                                    <option value="Preview">Preview</option>
                                    <option value="Deprecated">Deprecated</option>
                                    <option value="Legacy">Legacy</option>
                                  </select>
                                </label>
                                <label className="space-y-1">
                                  <span className="text-slate-600 font-medium block">Successor Model Slug</span>
                                  <input
                                    type="text"
                                    placeholder="e.g. gpt-5-4"
                                    value={liveEditForm.successorSlug}
                                    onChange={(e) =>
                                      setLiveEditForm({ ...liveEditForm, successorSlug: e.target.value })
                                    }
                                    className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 font-mono"
                                  />
                                </label>
                                <label className="space-y-1 sm:col-span-2">
                                  <span className="text-slate-600 font-medium block">Best For / Workload Tags</span>
                                  <input
                                    type="text"
                                    value={liveEditForm.bestFor}
                                    onChange={(e) => setLiveEditForm({ ...liveEditForm, bestFor: e.target.value })}
                                    className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5"
                                  />
                                </label>
                              </div>

                              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                                {[
                                  ['AG', 'ag'],
                                  ['CO', 'co'],
                                  ['RE', 're'],
                                  ['MM', 'mm'],
                                  ['KN', 'kn'],
                                  ['ML', 'ml'],
                                  ['IF', 'ifScore'],
                                  ['MA', 'ma'],
                                ].map(([label, key]) => (
                                  <label key={key} className="space-y-1">
                                    <span className="text-[11px] text-slate-600 font-semibold block">{label}</span>
                                    <input
                                      type="number"
                                      step="0.1"
                                      value={liveEditForm[key as keyof LiveEditState] as string}
                                      onChange={(e) =>
                                        setLiveEditForm({
                                          ...liveEditForm,
                                          [key]: e.target.value,
                                        })
                                      }
                                      className="w-full rounded border border-slate-300 bg-white px-2 py-1 font-mono"
                                    />
                                  </label>
                                ))}
                              </div>

                              <div className="flex flex-wrap items-center gap-5 pt-1">
                                <label className="inline-flex items-center gap-2 font-semibold text-slate-800 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={liveEditForm.verified}
                                    onChange={(e) =>
                                      setLiveEditForm({ ...liveEditForm, verified: e.target.checked })
                                    }
                                  />
                                  <span>Verified Status</span>
                                </label>
                                <label className="inline-flex items-center gap-2 font-semibold text-slate-800 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={liveEditForm.archived}
                                    onChange={(e) =>
                                      setLiveEditForm({ ...liveEditForm, archived: e.target.checked })
                                    }
                                  />
                                  <span>Archive / Hide from Default Catalog</span>
                                </label>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {statusLog.length > 0 ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-1.5 text-xs text-slate-700">
          <div className="font-bold text-slate-900">Session Activity</div>
          <ul className="list-disc pl-5 space-y-1">
            {statusLog.slice(0, 12).map((entry, idx) => (
              <li key={idx}>{entry}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
