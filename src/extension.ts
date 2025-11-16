import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.workspace.onDidChangeTextDocument((event) => {
    const editor = vscode.window.activeTextEditor;
    if (!editor || event.document !== editor.document) return;

    const changes = event.contentChanges;
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
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}
