import { QuickLogConfig } from "./config";
import { getLanguageDef } from "./languages";

export interface LogContext {
  fileName: string;
  /** 1-based line number */
  line: number;
  functionName?: string;
}

function basename(filePath: string): string {
  const normalized = filePath.replace(/\\/g, "/");
  const idx = normalized.lastIndexOf("/");
  return idx === -1 ? normalized : normalized.slice(idx + 1);
}

/** Colors used for deterministic auto-coloring of JS/TS command-based inserts. */
export const autoColorPalette = [
  "green",
  "blue",
  "red",
  "purple",
  "silver",
  "aqua",
  "deeppink",
  "yellow",
  "indigo",
  "teal",
  "khaki",
  "navy",
  "emerald",
  "coral",
  "gold",
  "cyan",
  "crimson",
];

/** Deterministic color pick so the same variable name always gets the same color. */
export function pickAutoColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % autoColorPalette.length;
  return autoColorPalette[index];
}

export function buildLabelText(
  marker: string,
  label: string,
  cfg: QuickLogConfig,
  context?: LogContext
): string {
  const parts: string[] = [marker];

  if (context && cfg.showFileAndLine) {
    parts.push(`[${basename(context.fileName)}:${context.line}]`);
  }
  if (context && cfg.showFunctionName && context.functionName) {
    parts.push(`${context.functionName} →`);
  }

  parts.push(`${label}:`);
  return parts.join(" ");
}

/**
 * Builds the full log statement for the given language. Returns undefined
 * when the language isn't supported.
 */
export function buildLogStatement(
  languageId: string,
  label: string,
  expr: string,
  isString: boolean,
  cfg: QuickLogConfig,
  context?: LogContext,
  colorOverride?: string
): string | undefined {
  const def = getLanguageDef(languageId);
  if (!def) {
    return undefined;
  }

  const labelText = buildLabelText(cfg.marker, label, cfg, context);
  const color = colorOverride ?? (cfg.autoColor ? pickAutoColor(label) : undefined);

  return def.buildStatement({ labelText, expr, isString, cfg, color });
}

/**
 * True if `line` (optionally already commented out) looks like a
 * quick-log-generated statement for the given language.
 */
export function isQuickLogLine(line: string, languageId: string, marker: string): boolean {
  const def = getLanguageDef(languageId);
  if (!def) {
    return false;
  }

  const commentEscaped = def.lineComment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const stripped = line.replace(new RegExp(`^\\s*${commentEscaped}\\s?`), "");

  return def.callSignature.test(stripped) && stripped.includes(marker);
}

export interface LogSpan {
  startLine: number;
  endLine: number;
}

const MAX_SPAN_LINES = 20;

/**
 * Given a line known (or suspected) to start a quick-log statement, finds
 * the full span of lines it occupies by tracking paren balance — handles
 * multi-line/wrapped log calls, not just single-line ones.
 */
export function findLogStatementSpan(
  lines: string[],
  startLine: number,
  languageId: string,
  marker: string
): LogSpan | undefined {
  if (!isQuickLogLine(lines[startLine], languageId, marker)) {
    return undefined;
  }

  let balance = 0;
  let end = startLine;
  for (let i = startLine; i < lines.length && i - startLine < MAX_SPAN_LINES; i++) {
    for (const ch of lines[i]) {
      if (ch === "(") {
        balance++;
      } else if (ch === ")") {
        balance--;
      }
    }
    end = i;
    if (balance <= 0) {
      break;
    }
  }
  return { startLine, endLine: end };
}

/** Finds every (non-overlapping) quick-log statement span in a document. */
export function findAllQuickLogSpans(
  lines: string[],
  languageId: string,
  marker: string
): LogSpan[] {
  const spans: LogSpan[] = [];
  let i = 0;
  while (i < lines.length) {
    const span = findLogStatementSpan(lines, i, languageId, marker);
    if (span) {
      spans.push(span);
      i = span.endLine + 1;
    } else {
      i++;
    }
  }
  return spans;
}
