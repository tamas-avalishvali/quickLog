import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.workspace.onDidChangeTextDocument((event) => {
    const editor = vscode.window.activeTextEditor;
    if (!editor || event.document !== editor.document) return;

    const changes = event.contentChanges;
    if (!changes.length) return;

    const lastChange = changes[0];
    const prevLineNum = lastChange.range.start.line;
    const lineText = editor.document.lineAt(prevLineNum).text;

    const match = lineText.match(/(.+)\.glog$/);
    if (match) {
      const capturedText = match[1].trim();
      const range = new vscode.Range(
        prevLineNum,
        0,
        prevLineNum,
        lineText.length
      );

      editor.edit((editBuilder) => {
        editBuilder.replace(range, `console.log(${capturedText});`);
      });
    }
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}
