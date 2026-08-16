import * as vscode from "vscode";
import { detectLanguage } from "./languageDetector";
import { compileCpp, compileJava } from "./compiler";
import { executeCommand } from "./runner";
import { CPRunnerPanel } from "./webview/runnerView";
import * as os from "os";

// Create a dedicated output channel for logging execution details
export const cpOutputChannel = vscode.window.createOutputChannel(
    "Vaiaksh CP Runner Logs",
);

async function shouldAutoOpenUI(): Promise<boolean> {
    if (!vscode.workspace.workspaceFolders) {
        return false;
    }

    const projectFiles = await vscode.workspace.findFiles(
        "{requirements.txt,pyproject.toml,pom.xml,build.gradle,package.json}",
        "**/node_modules/**",
        1,
    );
    if (projectFiles.length > 0) {
        return false;
    }

    const pyFiles = await vscode.workspace.findFiles(
        "**/*.py",
        "**/node_modules/**",
        10,
    );
    const cppFiles = await vscode.workspace.findFiles(
        "**/*.{cpp,c}",
        "**/node_modules/**",
        1,
    );
    const javaFiles = await vscode.workspace.findFiles(
        "**/*.java",
        "**/node_modules/**",
        1,
    );

    if (pyFiles.length > 0 || cppFiles.length > 0 || javaFiles.length > 0) {
        return true;
    }

    return false;
}

export function activate(context: vscode.ExtensionContext) {
    cpOutputChannel.appendLine("[INFO] Vaiaksh CP Runner is now active.");
    console.log("Vaiaksh CP Runner is now active.");

    shouldAutoOpenUI().then((shouldOpen) => {
        if (shouldOpen) {
            CPRunnerPanel.createOrShow();
        }
    });

    let runCommand = vscode.commands.registerCommand(
        "vaiaksh-cp-runner.run",
        async () => {
            const editor = vscode.window.activeTextEditor;

            if (!editor) {
                vscode.window.showErrorMessage(
                    "Vaiaksh CP Runner: No active file to run.",
                );
                cpOutputChannel.appendLine(
                    "[ERROR] No active file found to run.",
                );
                return;
            }

            const document = editor.document;
            if (document.isDirty) {
                await document.save();
            }

            const lang = detectLanguage(document);
            cpOutputChannel.appendLine(
                `[INFO] Running file: ${document.uri.fsPath} | Detected Language: ${lang}`,
            );

            if (lang === "unsupported") {
                vscode.window.showErrorMessage(
                    `Vaiaksh CP Runner: Language '${document.languageId}' is not supported yet.`,
                );
                cpOutputChannel.appendLine(
                    `[ERROR] Unsupported language ID: ${document.languageId}`,
                );
                return;
            }

            CPRunnerPanel.createOrShow();

            vscode.window.withProgress(
                {
                    location: vscode.ProgressLocation.Notification,
                    title: `Vaiaksh CP Runner: Processing ${lang.toUpperCase()}...`,
                    cancellable: false,
                },
                async (progress) => {
                    try {
                        const inputData =
                            CPRunnerPanel.currentPanel?.currentInput || "";

                        const config =
                            vscode.workspace.getConfiguration(
                                "vaiaksh-cp-runner",
                            );
                        const timeoutMs = config.get<number>("timeout", 5000);
                        cpOutputChannel.appendLine(
                            `[INFO] Configured timeout: ${timeoutMs}ms`,
                        );

                        let result;

                        if (lang === "cpp") {
                            progress.report({ message: "Compiling C++..." });
                            const executablePath = await compileCpp(
                                document.uri.fsPath,
                            );
                            cpOutputChannel.appendLine(
                                `[INFO] C++ compiled successfully to: ${executablePath}`,
                            );

                            progress.report({ message: "Executing..." });
                            result = await executeCommand(
                                executablePath,
                                [],
                                inputData,
                                timeoutMs,
                            );
                        } else if (lang === "java") {
                            progress.report({ message: "Compiling Java..." });
                            const compiledJava = await compileJava(
                                document.uri.fsPath,
                            );
                            cpOutputChannel.appendLine(
                                `[INFO] Java compiled successfully to class dir: ${compiledJava.classDirectory}`,
                            );

                            progress.report({ message: "Executing..." });
                            result = await executeCommand(
                                "java",
                                [
                                    "-cp",
                                    compiledJava.classDirectory,
                                    compiledJava.className,
                                ],
                                inputData,
                                timeoutMs,
                            );
                        } else if (lang === "python") {
                            progress.report({ message: "Executing Python..." });
                            const pythonCmd =
                                os.platform() === "win32"
                                    ? "python"
                                    : "python3";
                            result = await executeCommand(
                                pythonCmd,
                                [document.uri.fsPath],
                                inputData,
                                timeoutMs,
                            );
                        }

                        if (result) {
                            cpOutputChannel.appendLine(
                                `[INFO] Execution finished. Exit Code: ${result.exitCode}, Time: ${result.timeMs}ms`,
                            );
                            const formattedOutput = `${result.output}\n\n=== Execution Metrics ===\nTime: ${result.timeMs} ms\nPeak Memory: ${result.memoryMb} MB\nExit Code: ${result.exitCode}`;
                            CPRunnerPanel.currentPanel?.setOutput(
                                formattedOutput,
                            );

                            if (result.output.includes("TIME LIMIT EXCEEDED")) {
                                cpOutputChannel.appendLine(
                                    "[WARNING] Time Limit Exceeded detected in result output.",
                                );
                                vscode.window.showWarningMessage(
                                    "Vaiaksh CP Runner: Time Limit Exceeded (TLE)! Process terminated automatically.",
                                );
                            }
                        }
                    } catch (error: any) {
                        const errorMsg = error.message || String(error);
                        cpOutputChannel.appendLine(
                            `[ERROR] Execution exception caught: ${errorMsg}`,
                        );

                        if (errorMsg.includes("TIME LIMIT EXCEEDED")) {
                            vscode.window.showWarningMessage(
                                "Vaiaksh CP Runner: Time Limit Exceeded (TLE)! Process terminated automatically.",
                            );
                            CPRunnerPanel.currentPanel?.setOutput(
                                "❌ STATUS: TIME LIMIT EXCEEDED (TLE)\nProcess terminated due to timeout.",
                            );
                        } else {
                            vscode.window.showErrorMessage(
                                "Vaiaksh CP Runner: Execution Error encountered. Check output logs.",
                            );
                            CPRunnerPanel.currentPanel?.setOutput(
                                `❌ Error:\n${errorMsg}`,
                            );
                        }
                    }
                },
            );
        },
    );
    let openPanelCommand = vscode.commands.registerCommand(
        "vaiaksh-cp-runner.openPanel",
        () => {
            CPRunnerPanel.createOrShow();
        },
    );

    context.subscriptions.push(openPanelCommand);

    context.subscriptions.push(runCommand);
}

export function deactivate() {}
