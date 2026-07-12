import * as vscode from "vscode";
import { getConfig } from "./config";
import { getLanguageDef, detectEnclosingFunctionNameByRegex, LanguageDef } from "./languages";
import { buildLogStatement, findAllQuickLogSpans, LogContext } from "./logBuilder";

function findEnclosingSymbolName(
  symbols: vscode.DocumentSymbol[] | undefined,
  position: vscode.Position
): string | undefined {
  if (!symbols) {
    return undefined;
  }
  let result: string | undefined;
  for (const sym of symbols) {
    if (sym.range.contains(position)) {
      if (
        sym.kind === vscode.SymbolKind.Function ||
        sym.kind === vscode.SymbolKind.Method ||
        sym.kind === vscode.SymbolKind.Constructor
      ) {
        result = sym.name;
      }
      const childResult = findEnclosingSymbolName(sym.children, position);
      if (childResult) {
        result = childResult;
      }
    }
  }
  return result;
}

function parseExpression(raw: string): { label: string; expr: string; isString: boolean } {
  const trimmed = raw.trim();
  const stringMatch = trimmed.match(/^(['"`])([\s\S]*)\1$/);
  if (stringMatch) {
    return { label: stringMatch[2], expr: trimmed, isString: true };
  }
  return { label: trimmed, expr: trimmed, isString: false };
}

function leadingWhitespace(lineText: string): string {
  const match = lineText.match(/^\s*/);
  return match ? match[0] : "";
}

function requireEditorAndLanguage(): { editor: vscode.TextEditor; languageId: string; def: LanguageDef } | undefined {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return undefined;
  }
  const languageId = editor.document.languageId;
  const def = getLanguageDef(languageId);
  if (!def) {
    vscode.window.showWarningMessage(`Quick Log: "${languageId}" is not supported yet.`);
    return undefined;
  }
  return { editor, languageId, def };
}

export async function insertLogCommand(): Promise<void> {
  const ctx = requireEditorAndLanguage();
  if (!ctx) {
    return;
  }
  const { editor, languageId } = ctx;
  const document = editor.document;
  const cfg = getConfig();
  const lines = document.getText().split(/\r?\n/);

  let symbols: vscode.DocumentSymbol[] | undefined;
  try {
    symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
      "vscode.executeDocumentSymbolProvider",
      document.uri
    );
  } catch {
    symbols = undefined;
  }

  const entries: { line: number; text: string }[] = [];

  for (const selection of editor.selections) {
    let raw = document.getText(selection);
    let anchorPosition = selection.active;

    if (!raw) {
      const wordRange = document.getWordRangeAtPosition(selection.active);
      if (wordRange) {
        raw = document.getText(wordRange);
        anchorPosition = wordRange.end;
      }
    }

    if (!raw || !raw.trim()) {
      continue;
    }

    const { label, expr, isString } = parseExpression(raw);
    const line = anchorPosition.line;

    const functionName =
      findEnclosingSymbolName(symbols, anchorPosition) ??
      detectEnclosingFunctionNameByRegex(lines, line, languageId);

    const logContext: LogContext = {
      fileName: document.fileName,
      line: line + 1,
      functionName,
    };

    const statement = buildLogStatement(languageId, label, expr, isString, cfg, logContext);
    if (!statement) {
      continue;
    }

    const indent = leadingWhitespace(document.lineAt(line).text);
    entries.push({ line, text: `${indent}${statement}` });
  }

  if (entries.length === 0) {
    vscode.window.showWarningMessage(
      "Quick Log: select an expression or place the cursor on a variable name."
    );
    return;
  }

  await editor.edit((builder) => {
    for (const entry of entries) {
      builder.insert(new vscode.Position(entry.line + 1, 0), `${entry.text}\n`);
    }
  });
}

export async function commentAllLogsCommand(): Promise<void> {
  const ctx = requireEditorAndLanguage();
  if (!ctx) {
    return;
  }
  const { editor, languageId, def } = ctx;
  const document = editor.document;
  const marker = getConfig().marker;
  const lines = document.getText().split(/\r?\n/);
  const spans = findAllQuickLogSpans(lines, languageId, marker);

  if (spans.length === 0) {
    vscode.window.showInformationMessage("Quick Log: no quick-log statements found in this file.");
    return;
  }

  await editor.edit((builder) => {
    for (const span of spans) {
      for (let i = span.startLine; i <= span.endLine; i++) {
        const lineText = lines[i];
        const trimmed = lineText.trimStart();
        if (trimmed.startsWith(def.lineComment)) {
          continue;
        }
        const indent = lineText.slice(0, lineText.length - trimmed.length);
        const range = new vscode.Range(i, 0, i, lineText.length);
        builder.replace(range, `${indent}${def.lineComment} ${trimmed}`);
      }
    }
  });
}

export async function uncommentAllLogsCommand(): Promise<void> {
  const ctx = requireEditorAndLanguage();
  if (!ctx) {
    return;
  }
  const { editor, languageId, def } = ctx;
  const document = editor.document;
  const marker = getConfig().marker;
  const lines = document.getText().split(/\r?\n/);
  const spans = findAllQuickLogSpans(lines, languageId, marker);

  if (spans.length === 0) {
    vscode.window.showInformationMessage("Quick Log: no quick-log statements found in this file.");
    return;
  }

  const commentEscaped = def.lineComment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const commentRe = new RegExp(`^(\\s*)${commentEscaped}\\s?`);

  await editor.edit((builder) => {
    for (const span of spans) {
      for (let i = span.startLine; i <= span.endLine; i++) {
        const lineText = lines[i];
        const match = lineText.match(commentRe);
        if (!match) {
          continue;
        }
        const range = new vscode.Range(i, 0, i, match[0].length);
        builder.replace(range, match[1]);
      }
    }
  });
}

export async function deleteAllLogsCommand(): Promise<void> {
  const ctx = requireEditorAndLanguage();
  if (!ctx) {
    return;
  }
  const { editor, languageId } = ctx;
  const document = editor.document;
  const marker = getConfig().marker;
  const lines = document.getText().split(/\r?\n/);
  const spans = findAllQuickLogSpans(lines, languageId, marker);

  if (spans.length === 0) {
    vscode.window.showInformationMessage("Quick Log: no quick-log statements found in this file.");
    return;
  }

  await editor.edit((builder) => {
    for (const span of spans) {
      const startPos = new vscode.Position(span.startLine, 0);
      const endPos =
        span.endLine + 1 < document.lineCount
          ? new vscode.Position(span.endLine + 1, 0)
          : new vscode.Position(span.endLine, lines[span.endLine].length);
      builder.delete(new vscode.Range(startPos, endPos));
    }
  });
}

export function registerCommands(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("quickLog.insertLog", insertLogCommand),
    vscode.commands.registerCommand("quickLog.commentAllLogs", commentAllLogsCommand),
    vscode.commands.registerCommand("quickLog.uncommentAllLogs", uncommentAllLogsCommand),
    vscode.commands.registerCommand("quickLog.deleteAllLogs", deleteAllLogsCommand)
  );
}
