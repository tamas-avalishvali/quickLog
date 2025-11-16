import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  const logColors: Record<string, string> = {
    glog: "green",
    blog: "blue",
    rlog: "red",
    wlog: "white",
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

  const disposable = vscode.workspace.onDidChangeTextDocument((event) => {
    const editor = vscode.window.activeTextEditor;
    if (!editor || event.document !== editor.document) return;

    const changes = event.contentChanges;
    if (changes.length !== 1) return;

    const change = changes[0];
    if (change.text !== " " || !change.range.isEmpty) return;

    const lineNum = change.range.start.line;
    const lineText = editor.document.lineAt(lineNum).text;

    const keywords = Object.keys(logColors).join("|");
    const regex = new RegExp(`(['"\`]?)(.+?)\\1?\\s+(${keywords})\\s$`);

    const match = lineText.match(regex);
    if (!match) return;

    const capturedText = match[2].trim();
    const logType = match[3];
    const color = logColors[logType] || "white";

    const range = new vscode.Range(lineNum, 0, lineNum, lineText.length);

    editor.edit(
      (editBuilder) => {
        editBuilder.replace(
          range,
          `console.log("%c${capturedText}", "color:${color}"); `
        );
      },
      { undoStopBefore: true, undoStopAfter: true }
    );
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}
