import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.workspace.onDidChangeTextDocument((event) => {
    const editor = vscode.window.activeTextEditor;
    if (!editor || event.document !== editor.document) return;

    const changes = event.contentChanges;
    if (changes.length !== 1) return;

    const change = changes[0];
    if (
      (change.text !== "\n" && change.text !== "\r\n") ||
      !change.range.isEmpty
    )
      return;

    const lineNum = change.range.start.line;
    const lineText = editor.document.lineAt(lineNum).text;

    const match = lineText.match(/(['"`]?)(.+?)\1?\.glog$/);
    if (!match) return;

    const capturedText = match[2].trim();
    const range = new vscode.Range(lineNum, 0, lineNum, lineText.length);

    editor.edit(
      (editBuilder) => {
        editBuilder.replace(range, `console.log(${capturedText});`);
      },
      { undoStopBefore: true, undoStopAfter: true }
    );
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}
