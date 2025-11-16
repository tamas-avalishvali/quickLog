# Quick Log Plus

Quickly insert `console.log` statements in JavaScript or TypeScript with colored output for easier debugging.

---

## Features

- Automatically replaces a typed keyword with a `console.log`.
- Supports colored output in the console:
  - `glog` → green text  
  - `blog` → blue text  
  - `rlog` → red text  
  - `wlog` → white text  
- Works with both strings and variables.
- Triggered by typing a space after the keyword (no need to press Enter).
- Saves time while debugging and makes logs more readable.

---

## How it works

Type any text followed by one of the log keywords and a **space** in a JS/TS file:

```ts
"d" glog
myVar blog
error rlog
info wlog
