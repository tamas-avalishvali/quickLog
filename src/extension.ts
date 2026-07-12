import * as vscode from "vscode";
import { getConfig } from "./config";
import { detectEnclosingFunctionNameByRegex } from "./languages";
import { buildLogStatement, LogContext } from "./logBuilder";
import { registerCommands } from "./commands";

const logColors: Record<string, string> = {
  glog: "green",
  blog: "blue",
  rlog: "red",
  wlog: "white",
  log: "black",
  plog: "purple",
  slog: "silver",
  alog: "aqua",
  hlog: "deeppink",
  jlog: "yellow",
  ilog: "indigo",
  ulog: "ultramarine",
  tlog: "teal",
  klog: "khaki",
  nlog: "navy",
  elog: "emerald",
  xlog: "coral",
  ylog: "gold",
  zlog: "cyan",
  qlog: "crimson",
};

const spaceTriggerLanguages = new Set([
  "javascript",
  "typescript",
  "javascriptreact",
  "typescriptreact",
]);

export function activate(context: vscode.ExtensionContext) {
  registerCommands(context);

  const disposable = vscode.workspace.onDidChangeTextDocument((event) => {
    const editor = vscode.window.activeTextEditor;
    if (!editor || event.document !== editor.document) {
      return;
    }
    if (!spaceTriggerLanguages.has(editor.document.languageId)) {
      return;
    }

    const changes = event.contentChanges;
    if (changes.length !== 1) {
      return;
    }

    const change = changes[0];
    if (change.text !== " " || !change.range.isEmpty) {
      return;
    }

    const lineNum = change.range.start.line;
    const lineText = editor.document.lineAt(lineNum).text;

    const keywords = Object.keys(logColors).join("|");
    const regex = new RegExp(`(['"\`]?)(.+?)\\1?\\s+(${keywords})\\s$`);

    const match = lineText.match(regex);
    if (!match) {
      return;
    }

    const label = match[2].trim();
    const logType = match[3];
    const color = logColors[logType] || "white";
    const isString = !!match[1]; // Check if opening quote exists (implies closed string)

    const document = editor.document;
    const cfg = getConfig();
    const lines = document.getText().split(/\r?\n/);
    const functionName = detectEnclosingFunctionNameByRegex(lines, lineNum, document.languageId);

    const logContext: LogContext = {
      fileName: document.fileName,
      line: lineNum + 1,
      functionName,
    };

    const statement = buildLogStatement(
      document.languageId,
      label,
      label,
      isString,
      cfg,
      logContext,
      color
    );
    if (!statement) {
      return;
    }

    const range = new vscode.Range(lineNum, 0, lineNum, lineText.length);

    editor.edit(
      (editBuilder) => {
        editBuilder.replace(range, `${statement} `);
      },
      { undoStopBefore: true, undoStopAfter: true }
    );
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}
