# Change Log

All notable changes to the "quick-log" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [0.25.0] - 2026-07-12

### Added

- Real `Quick Log: Insert Log Statement` command (`Ctrl+Alt+L`, Command Palette, and right-click → Quick Log), replacing the previously non-functional keybinding. Works over multiple selections/cursors at once.
- Multi-language support: Python, Go, PHP, C#, and Java, alongside the existing JavaScript/TypeScript/JSX/TSX support.
- Log statements can now include the file name, line number, and the name of the nearest enclosing function/method.
- Deterministic auto-coloring for command-based JavaScript/TypeScript inserts (`quickLog.autoColor`) — the same variable name always gets the same color.
- New cleanup commands: `Quick Log: Comment All Log Statements`, `Quick Log: Uncomment All Log Statements`, and `Quick Log: Delete All Log Statements`.
- New settings: `quickLog.marker`, `quickLog.showFileAndLine`, `quickLog.showFunctionName`, `quickLog.autoColor`, `quickLog.semicolons`, `quickLog.quoteStyle`.
- Unit and integration test coverage for the log builder, per-language templates, function-name detection, and the new commands.

### Changed

- The space-triggered color-keyword shortcut (e.g. `myVar blog`) now goes through the same log builder as the new command, so it also respects the settings above. All 19 existing color keywords keep working exactly as before.

## [Unreleased]

- Initial release