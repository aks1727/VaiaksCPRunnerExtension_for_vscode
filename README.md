# Vaiaksh CP Runner 
**Vaiaksh CP Runner** is a lightning-fast competitive programming runner for Visual Studio Code, built specifically for C++, Java, and Python. It provides an integrated side panel with custom input boxes, live output rendering, memory/time tracking, and built-in Time Limit Exceeded (TLE) protection.

---

## Features

* **Multi-Language Support**: Seamlessly compiles and executes **C++** (`g++`), **Java** (`javac`/`java`), and **Python** (`python3`).
* **Interactive Side Panel UI**: Opens a dedicated split-view panel displaying separate **Input** and **Output** boxes.
* **TLE Protection**: Automatically terminates infinite loops or long-running executions based on a configurable time limit, complete with warnings and status notifications.
* **Execution Metrics**: Displays execution time in milliseconds, peak memory consumption in MB, and process exit codes.
* **Performance Optimized**: Built-in output truncation to safely handle massive or infinite streams without freezing or lagging the VS Code editor.

---

## Requirements

Ensure the corresponding compiler/interpreter runtimes are installed and added to your system's `PATH`:
* **C++**: GCC / MinGW (`g++`)
* **Java**: Java Development Kit (`JDK`)
* **Python**: Python 3.x

---

## Extension Settings

This extension contributes the following settings under the `vaiaksh-cp-runner` configuration namespace:

* `vaiaksh-cp-runner.panelWidth`: Percentage of screen width the CP Runner UI side panel should occupy (default: `30`, min: `10`, max: `90`).
* `vaiaksh-cp-runner.timeout`: Maximum execution time in milliseconds before automatically terminating the process for TLE protection (default: `5000`).

---

## Keyboard Shortcuts

* **Run Code**: `Ctrl + Enter` (Windows/Linux) or `Cmd + Enter` (macOS) while focused on an editor.
* **Open Panel**: `Ctrl + Shift + C` (Windows/Linux) or `Cmd + Shift + C` (macOS).

---

## Known Issues

* On Linux/macOS, peak memory tracking relies on `/usr/bin/time`. If unavailable, it seamlessly falls back to direct execution mode.

---

## Release Notes

### 0.0.1

* Initial release of **Vaiaksh CP Runner**.
* Added support for C++, Java, and Python execution.
* Integrated custom side panel UI with TLE protection and memory/time metrics.
* Added performance-optimized output scrolling and truncation.