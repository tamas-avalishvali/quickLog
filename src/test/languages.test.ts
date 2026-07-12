import * as assert from "assert";
import { detectEnclosingFunctionNameByRegex } from "../languages";

suite("languages - function name detection", () => {
  test("detects a JS/TS function declaration", () => {
    const lines = ["function handleClick() {", "  const x = 1;", "  console.log(x);", "}"];
    assert.strictEqual(detectEnclosingFunctionNameByRegex(lines, 2, "typescript"), "handleClick");
  });

  test("detects an arrow function assigned to a const", () => {
    const lines = ["const handleClick = () => {", "  doSomething();", "}"];
    assert.strictEqual(detectEnclosingFunctionNameByRegex(lines, 1, "javascript"), "handleClick");
  });

  test("detects a Python def", () => {
    const lines = ["def handle_click():", "    x = 1", "    print(x)"];
    assert.strictEqual(detectEnclosingFunctionNameByRegex(lines, 2, "python"), "handle_click");
  });

  test("detects a Go func", () => {
    const lines = ["func HandleClick() {", "  x := 1", "  fmt.Println(x)", "}"];
    assert.strictEqual(detectEnclosingFunctionNameByRegex(lines, 2, "go"), "HandleClick");
  });

  test("returns undefined when nothing is found", () => {
    const lines = ["const x = 1;"];
    assert.strictEqual(detectEnclosingFunctionNameByRegex(lines, 0, "typescript"), undefined);
  });

  test("returns undefined for unsupported languages", () => {
    const lines = ["puts 'hi'"];
    assert.strictEqual(detectEnclosingFunctionNameByRegex(lines, 0, "ruby"), undefined);
  });
});
