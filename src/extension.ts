import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.workspace.onDidChangeTextDocument((event) => {
    const editor = vscode.window.activeTextEditor;
    if (!editor || event.document !== editor.document) return;

    const changes = event.contentChanges;
    if (changes.length !== 1) return;

    const change = changes[0];
    if (change.text !== " " || !change.range.isEmpty) return;

    const lineNum = change.range.start.line;
    const lineText = editor.document.lineAt(lineNum).text;

    // Match optional quotes, text, then space, then one of the log keywords
    const match = lineText.match(/(['"`]?)(.+?)\1?\s+(glog|blog|rlog|wlog)\s$/);
    if (!match) return;

    const capturedText = match[2].trim();
    const logType = match[3];
    let color = "black";

    switch (logType) {
      case "glog":
        color = "green";
        break;
      case "blog":
        color = "blue";
        break;
      case "rlog":
        color = "red";
        break;
      case "wlog":
        color = "white";
        break;
    }

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
