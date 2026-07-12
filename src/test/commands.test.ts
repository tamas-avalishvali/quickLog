import * as assert from "assert";
import * as vscode from "vscode";

async function openDoc(content: string, language: string): Promise<vscode.TextEditor> {
  const document = await vscode.workspace.openTextDocument({ content, language });
  return vscode.window.showTextDocument(document);
}

async function waitFor(condition: () => boolean, timeoutMs = 2000): Promise<void> {
  const start = Date.now();
  while (!condition()) {
    if (Date.now() - start > timeoutMs) {
      throw new Error("Timed out waiting for condition");
    }
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
}

suite("commands integration", () => {
  test("quickLog.insertLog inserts a log statement below the selected variable", async () => {
    const editor = await openDoc("function foo() {\n  const myVar = 1;\n}\n", "typescript");
    const line = editor.document.lineAt(1).text;
    const start = line.indexOf("myVar");
    editor.selection = new vscode.Selection(
      new vscode.Position(1, start),
      new vscode.Position(1, start + "myVar".length)
    );

    await vscode.commands.executeCommand("quickLog.insertLog");

    const inserted = editor.document.lineAt(2).text;
    assert.ok(inserted.includes("console.log("), `expected a console.log, got: ${inserted}`);
    assert.ok(inserted.includes("myVar"));
    assert.ok(inserted.includes("foo"));
  });

  test("quickLog.commentAllLogs / uncommentAllLogs / deleteAllLogs manage generated logs", async () => {
    const editor = await openDoc(
      "console.log('%c🚩 x:', 'color:blue', x);\nconst y = 2;\n",
      "javascript"
    );

    await vscode.commands.executeCommand("quickLog.commentAllLogs");
    assert.ok(editor.document.lineAt(0).text.trimStart().startsWith("// console.log"));

    // Running it again must not double-comment an already-commented line.
    await vscode.commands.executeCommand("quickLog.commentAllLogs");
    assert.ok(!editor.document.lineAt(0).text.includes("// // console.log"));

    await vscode.commands.executeCommand("quickLog.uncommentAllLogs");
    assert.ok(editor.document.lineAt(0).text.trimStart().startsWith("console.log"));

    await vscode.commands.executeCommand("quickLog.deleteAllLogs");
    assert.strictEqual(editor.document.lineAt(0).text, "const y = 2;");
  });

  test("space-trigger keyword replaces the line with a console.log", async () => {
    const editor = await openDoc("function foo() {\n\n}\n", "typescript");

    // Type "  myVar blog", then the triggering space as its own edit — this
    // reproduces the exact onDidChangeTextDocument shape a real keystroke
    // produces (a single-character insert of " " into an empty range).
    await editor.edit((builder) => builder.insert(new vscode.Position(1, 0), "  myVar blog"));
    const afterTyping = editor.document.lineAt(1).text;
    await editor.edit((builder) =>
      builder.insert(new vscode.Position(1, afterTyping.length), " ")
    );

    await waitFor(() => editor.document.lineAt(1).text.includes("console.log("));

    const line = editor.document.lineAt(1).text;
    assert.ok(line.includes("🚩"), `expected marker, got: ${line}`);
    assert.ok(line.includes("myVar"), `expected variable name, got: ${line}`);
    assert.ok(line.includes("color:blue"), `expected keyword color, got: ${line}`);
    assert.ok(line.includes("foo"), `expected enclosing function name, got: ${line}`);
  });
});
