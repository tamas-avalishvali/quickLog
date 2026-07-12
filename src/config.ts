import * as vscode from "vscode";

export type QuoteStyle = "single" | "double" | "backtick";

export interface QuickLogConfig {
  marker: string;
  showFileAndLine: boolean;
  showFunctionName: boolean;
  autoColor: boolean;
  semicolons: boolean;
  quoteStyle: QuoteStyle;
}

export function getConfig(): QuickLogConfig {
  const cfg = vscode.workspace.getConfiguration("quickLog");
  return {
    marker: cfg.get<string>("marker", "🚩"),
    showFileAndLine: cfg.get<boolean>("showFileAndLine", true),
    showFunctionName: cfg.get<boolean>("showFunctionName", true),
    autoColor: cfg.get<boolean>("autoColor", true),
    semicolons: cfg.get<boolean>("semicolons", true),
    quoteStyle: cfg.get<QuoteStyle>("quoteStyle", "single"),
  };
}

export function quoteChar(style: QuoteStyle): string {
  if (style === "double") {
    return '"';
  }
  if (style === "backtick") {
    return "`";
  }
  return "'";
}
