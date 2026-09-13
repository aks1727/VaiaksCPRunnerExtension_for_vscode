# Vaiaksh CP Runner 
**Vaiaksh CP Runner** is a lightweight, low-latency competitive programming runner for Visual Studio Code, engineered for C++, Java, and Python. It provides an integrated side panel with persistent custom input, live output rendering, execution metrics (time/memory), and automated Time Limit Exceeded (TLE) safeguards.

---

## Features

* **Multi-Language Support**: Compiles and runs **C++** (`g++`), **Java** (`javac`/`java`), and **Python** (`python3`) with zero manual boilerplate configuration.
* **Interactive Side Panel**: Dedicated side-by-side view with custom input buffering and formatted output streaming.
* **TLE Protection**: Configurable execution timeouts kill hanging processes or infinite loops via `SIGKILL` without locking up your editor.
* **Execution Metrics**: Accurate tracking of runtime in milliseconds, peak resident memory usage (via `/usr/bin/time`), and exit codes.
* **Output Buffer Safeguard**: Automatic output truncation past 50,000 characters to protect VS Code from UI freezing during infinite print loops.

---

## Requirements

Ensure runtimes are available in your system `PATH`:
* **C++**: `g++` (GCC / MinGW)
* **Java**: `javac` and `java` (JDK 8+)
* **Python**: `python3` (or `python` on Windows)

---

## Extension Settings

All configurations live under the `vaiaksh-cp-runner` namespace:

* `vaiaksh-cp-runner.autoOpenUI`: Automatically open the CP Runner side panel on workspace activation when CP files are detected (default: `false`).
* `vaiaksh-cp-runner.panelWidth`: Percentage of the screen width allocated to the runner panel (default: `30`, min: `10`, max: `90`).
* `vaiaksh-cp-runner.timeout`: Process execution timeout in milliseconds before triggering TLE termination (default: `5000`).

---

## Keybindings

* **Run Code**: `Ctrl + Enter` (Windows/Linux) / `Cmd + Enter` (macOS)
* **Toggle Panel**: `Ctrl + Shift + C` (Windows/Linux) / `Cmd + Shift + C` (macOS)

---

## Release Notes

### 0.0.2

* Added `vaiaksh-cp-runner.autoOpenUI` configuration toggle to prevent unwanted webview auto-spawning on workspace launch.
* Aligned ESLint dependencies and cleaned up peer dependency constraints.

### 0.0.1

* Initial release.
* C++, Java, and Python compilation and execution pipelines.
* Split-panel webview with live metrics and output length capping.