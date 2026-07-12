import * as assert from "assert";
import { QuickLogConfig } from "../config";
import {
  buildLabelText,
  buildLogStatement,
  pickAutoColor,
  isQuickLogLine,
  findLogStatementSpan,
  findAllQuickLogSpans,
} from "../logBuilder";

const baseConfig: QuickLogConfig = {
  marker: "🚩",
  showFileAndLine: true,
  showFunctionName: true,
  autoColor: true,
  semicolons: true,
  quoteStyle: "single",
};

suite("logBuilder", () => {
  test("buildLabelText includes file/line and function name when enabled", () => {
    const label = buildLabelText("🚩", "myVar", baseConfig, {
      fileName: "C:/project/app.ts",
      line: 12,
      functionName: "handleClick",
    });
    assert.strictEqual(label, "🚩 [app.ts:12] handleClick → myVar:");
  });

  test("buildLabelText omits file/line and function name when disabled", () => {
    const cfg: QuickLogConfig = { ...baseConfig, showFileAndLine: false, showFunctionName: false };
    const label = buildLabelText("🚩", "myVar", cfg, {
      fileName: "app.ts",
      line: 12,
      functionName: "handleClick",
    });
    assert.strictEqual(label, "🚩 myVar:");
  });

  test("buildLabelText works without a context", () => {
    const label = buildLabelText("🚩", "myVar", baseConfig);
    assert.strictEqual(label, "🚩 myVar:");
  });

  test("buildLogStatement builds a JS console.log with a forced color", () => {
    const statement = buildLogStatement(
      "typescript",
      "myVar",
      "myVar",
      false,
      baseConfig,
      { fileName: "app.ts", line: 5 },
      "blue"
    );
    assert.strictEqual(statement, "console.log('%c🚩 [app.ts:5] myVar:', 'color:blue', myVar);");
  });

  test("buildLogStatement respects quoteStyle and semicolons", () => {
    const cfg: QuickLogConfig = {
      ...baseConfig,
      quoteStyle: "double",
      semicolons: false,
      showFileAndLine: false,
    };
    const statement = buildLogStatement("javascript", "x", "x", false, cfg, undefined, "red");
    assert.strictEqual(statement, `console.log("%c🚩 x:", 'color:red', x)`);
  });

  test("buildLogStatement builds a string-only message without a second argument", () => {
    const cfg: QuickLogConfig = { ...baseConfig, showFileAndLine: false };
    const statement = buildLogStatement(
      "javascript",
      "hello",
      "'hello'",
      true,
      cfg,
      undefined,
      "green"
    );
    assert.strictEqual(statement, "console.log('%c🚩 hello:', 'color:green');");
  });

  test("buildLogStatement builds Python, Go, PHP, C#, Java statements", () => {
    const cfg: QuickLogConfig = {
      ...baseConfig,
      showFileAndLine: false,
      showFunctionName: false,
      autoColor: false,
    };
    assert.strictEqual(buildLogStatement("python", "x", "x", false, cfg), 'print(f"🚩 x:", x)');
    assert.strictEqual(buildLogStatement("go", "x", "x", false, cfg), 'fmt.Println("🚩 x:", x)');
    assert.strictEqual(
      buildLogStatement("php", "x", "$x", false, cfg),
      'echo "🚩 x: " . print_r($x, true) . PHP_EOL;'
    );
    assert.strictEqual(
      buildLogStatement("csharp", "x", "x", false, cfg),
      'Console.WriteLine($"🚩 x: {x}");'
    );
    assert.strictEqual(
      buildLogStatement("java", "x", "x", false, cfg),
      'System.out.println("🚩 x: " + x);'
    );
  });

  test("buildLogStatement returns undefined for unsupported languages", () => {
    assert.strictEqual(buildLogStatement("ruby", "x", "x", false, baseConfig), undefined);
  });

  test("pickAutoColor is deterministic for the same name", () => {
    assert.strictEqual(pickAutoColor("myVar"), pickAutoColor("myVar"));
  });

  test("isQuickLogLine detects quick-log lines, including already-commented ones", () => {
    assert.ok(isQuickLogLine("console.log('%c🚩 x:', 'color:blue', x);", "typescript", "🚩"));
    assert.ok(isQuickLogLine("// console.log('%c🚩 x:', 'color:blue', x);", "typescript", "🚩"));
    assert.ok(!isQuickLogLine("console.log('just a normal log');", "typescript", "🚩"));
    assert.ok(!isQuickLogLine("const flag = '🚩';", "typescript", "🚩"));
  });

  test("findLogStatementSpan captures a wrapped multi-line log call", () => {
    const lines = [
      "function foo() {",
      "  console.log('%c🚩 x:',",
      "    'color:blue', x);",
      "}",
    ];
    const span = findLogStatementSpan(lines, 1, "typescript", "🚩");
    assert.deepStrictEqual(span, { startLine: 1, endLine: 2 });
  });

  test("findAllQuickLogSpans finds multiple non-overlapping spans", () => {
    const lines = [
      "console.log('%c🚩 a:', 'color:blue', a);",
      "const b = 1;",
      "console.log('%c🚩 b:', 'color:red', b);",
    ];
    const spans = findAllQuickLogSpans(lines, "typescript", "🚩");
    assert.deepStrictEqual(spans, [
      { startLine: 0, endLine: 0 },
      { startLine: 2, endLine: 2 },
    ]);
  });
});
