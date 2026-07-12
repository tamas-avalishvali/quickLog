import { QuickLogConfig, quoteChar } from "./config";

export interface BuildArgs {
  labelText: string; // e.g. "🚩 [app.ts:12] handleClick → myVar:"
  expr: string;
  isString: boolean;
  cfg: QuickLogConfig;
  color?: string;
}

export interface LanguageDef {
  id: string;
  lineComment: string;
  functionRegexes: RegExp[];
  /** Matches the start of a generated log call, used to find quick-log lines for cleanup commands. */
  callSignature: RegExp;
  buildStatement(args: BuildArgs): string;
}

function buildJsTs({ labelText, expr, isString, cfg, color }: BuildArgs): string {
  const q = quoteChar(cfg.quoteStyle);
  const semi = cfg.semicolons ? ";" : "";
  const colorName = color || "white";
  if (isString) {
    return `console.log(${q}%c${labelText}${q}, 'color:${colorName}')${semi}`;
  }
  return `console.log(${q}%c${labelText}${q}, 'color:${colorName}', ${expr})${semi}`;
}

const jsTsDef: Omit<LanguageDef, "id"> = {
  lineComment: "//",
  functionRegexes: [
    /function\s+(\w+)\s*\(/,
    /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\(?[^=]*\)?\s*=>/,
    /(\w+)\s*\([^)]*\)\s*\{\s*$/,
    /class\s+(\w+)/,
  ],
  callSignature: /console\.log\(/,
  buildStatement: buildJsTs,
};

export const languageDefs: Record<string, LanguageDef> = {
  javascript: { id: "javascript", ...jsTsDef },
  typescript: { id: "typescript", ...jsTsDef },
  javascriptreact: { id: "javascriptreact", ...jsTsDef },
  typescriptreact: { id: "typescriptreact", ...jsTsDef },

  python: {
    id: "python",
    lineComment: "#",
    functionRegexes: [/^\s*def\s+(\w+)\s*\(/, /^\s*class\s+(\w+)/],
    callSignature: /print\(/,
    buildStatement: ({ labelText, expr, isString }) =>
      isString ? `print(f"${labelText}")` : `print(f"${labelText}", ${expr})`,
  },

  go: {
    id: "go",
    lineComment: "//",
    functionRegexes: [/func\s*(?:\([^)]*\)\s*)?(\w+)\s*\(/],
    callSignature: /fmt\.Println\(/,
    buildStatement: ({ labelText, expr, isString }) =>
      isString ? `fmt.Println("${labelText}")` : `fmt.Println("${labelText}", ${expr})`,
  },

  php: {
    id: "php",
    lineComment: "//",
    functionRegexes: [/function\s+(\w+)\s*\(/, /class\s+(\w+)/],
    callSignature: /echo\s+"/,
    buildStatement: ({ labelText, expr, isString }) =>
      isString
        ? `echo "${labelText}";`
        : `echo "${labelText} " . print_r(${expr}, true) . PHP_EOL;`,
  },

  csharp: {
    id: "csharp",
    lineComment: "//",
    functionRegexes: [
      /(?:public|private|protected|internal|static|\s)+[\w<>[\],\s]+?\s(\w+)\s*\([^)]*\)\s*\{?\s*$/,
      /class\s+(\w+)/,
    ],
    callSignature: /Console\.WriteLine\(/,
    buildStatement: ({ labelText, expr, isString }) =>
      isString
        ? `Console.WriteLine($"${labelText}");`
        : `Console.WriteLine($"${labelText} {${expr}}");`,
  },

  java: {
    id: "java",
    lineComment: "//",
    functionRegexes: [
      /(?:public|private|protected|static|final|\s)+[\w<>[\],\s]+?\s(\w+)\s*\([^)]*\)\s*\{?\s*$/,
      /class\s+(\w+)/,
    ],
    callSignature: /System\.out\.println\(/,
    buildStatement: ({ labelText, expr, isString }) =>
      isString
        ? `System.out.println("${labelText}");`
        : `System.out.println("${labelText} " + ${expr});`,
  },
};

export function getLanguageDef(languageId: string): LanguageDef | undefined {
  return languageDefs[languageId];
}

const MAX_SCAN_LINES = 500;

/**
 * Regex-based fallback: scans upward from `lineIndex` for the nearest
 * enclosing function/method/class declaration. Used when no
 * DocumentSymbolProvider is available, and always for the synchronous
 * space-trigger flow.
 */
export function detectEnclosingFunctionNameByRegex(
  lines: string[],
  lineIndex: number,
  languageId: string
): string | undefined {
  const def = getLanguageDef(languageId);
  if (!def) {
    return undefined;
  }

  const start = Math.min(lineIndex, lines.length - 1);
  const stop = Math.max(0, start - MAX_SCAN_LINES);

  for (let i = start; i >= stop; i--) {
    const line = lines[i];
    for (const re of def.functionRegexes) {
      const match = line.match(re);
      if (match && match[1]) {
        return match[1];
      }
    }
  }
  return undefined;
}
