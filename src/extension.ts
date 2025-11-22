import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
<<<<<<< HEAD
=======
  const logColors: Record<string, string> = {
    glog: "green",
    blog: "blue",
    rlog: "red",
    wlog: "white",
    log: "white",
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

>>>>>>> f4df3be7d4366b98aa3273bdfb4a19a2279c3923
  const disposable = vscode.workspace.onDidChangeTextDocument((event) => {
    const editor = vscode.window.activeTextEditor;
    if (!editor || event.document !== editor.document) return;

    const changes = event.contentChanges;
<<<<<<< HEAD
    if (!changes.length) return;

    const lastChange = changes[0];
    if (lastChange.text !== "\n") return;

    const lineNum = lastChange.range.start.line;
    if (lineNum === 0) return;

    const prevLine = editor.document.lineAt(lineNum - 1).text;
    const match = prevLine.match(/"(.*)"\.log$/);
    if (match) {
      const capturedText = match[1];
      const range = new vscode.Range(
        lineNum - 1,
        0,
        lineNum - 1,
        prevLine.length
      );

      editor.edit((editBuilder) => {
        editBuilder.replace(range, `console.log("${capturedText}");`);
      });
    }
=======
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
    const isString = !!match[1]; // Check if opening quote exists (implies closed string)

    let logStatement;
    if (isString) {
      logStatement = `console.log("%c🚩${capturedText} result is →", "color:${color}"); `;
    } else {
      logStatement = `console.log("%c🚩${capturedText} result is →", "color:${color}", ${capturedText}); `;
    }

    const range = new vscode.Range(lineNum, 0, lineNum, lineText.length);

    editor.edit(
      (editBuilder) => {
        editBuilder.replace(range, logStatement);
      },
      { undoStopBefore: true, undoStopAfter: true }
    );
>>>>>>> f4df3be7d4366b98aa3273bdfb4a19a2279c3923
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}
