import * as vscode from 'vscode';

export class CPRunnerPanel {
    public static currentPanel: CPRunnerPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    
    public currentInput: string = '1\n2\n3\n'; 

    private constructor(panel: vscode.WebviewPanel) {
        this._panel = panel;
        this._panel.onDidDispose(() => this.dispose(), null, []);
        this._panel.webview.html = this._getWebviewContent();

        this._panel.webview.onDidReceiveMessage(message => {
            if (message.type === 'inputChanged') {
                this.currentInput = message.value;
            }
        });
    }

    public static createOrShow() {
        const column = vscode.ViewColumn.Two;

        if (CPRunnerPanel.currentPanel) {
            CPRunnerPanel.currentPanel._panel.reveal(column, true); 
            CPRunnerPanel.applyCustomWidth(); 
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'cpRunnerUI', 
            'Vaiaksh CP Runner',  
            { viewColumn: column, preserveFocus: true }, 
            {
                enableScripts: true, 
                retainContextWhenHidden: true 
            }
        );

        CPRunnerPanel.currentPanel = new CPRunnerPanel(panel);
        
        setTimeout(() => {
            CPRunnerPanel.applyCustomWidth();
        }, 100);
    }

    private static applyCustomWidth() {
        const config = vscode.workspace.getConfiguration('vaiaksh-cp-runner');
        const panelWidthPercent = config.get<number>('panelWidth', 30);
        
        const panelSize = panelWidthPercent / 100;
        const editorSize = 1 - panelSize;

        vscode.commands.executeCommand('vscode.setEditorLayout', {
            orientation: 0,
            groups: [
                { size: editorSize },
                { size: panelSize }
            ]
        });
    }

    public dispose() {
        CPRunnerPanel.currentPanel = undefined;
        this._panel.dispose();
    }

    public setOutput(output: string) {
        this._panel.webview.postMessage({ type: 'setOutput', value: output });
    }

    private _getWebviewContent() {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Vaiaksh CP Runner UI</title>
            <style>
                body { 
                    font-family: var(--vscode-font-family); 
                    padding: 15px; 
                    display: flex; 
                    flex-direction: column; 
                    height: 100vh; 
                    box-sizing: border-box; 
                    margin: 0; 
                    background-color: var(--vscode-editor-background);
                    color: var(--vscode-editor-foreground);
                }
                .container { display: flex; flex-direction: column; flex: 1; gap: 15px; }
                .box { display: flex; flex-direction: column; flex: 1; }
                h3 { margin: 0 0 5px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--vscode-editor-foreground); opacity: 0.7; }
                textarea { 
                    height: 100px;
                    background: var(--vscode-input-background); 
                    color: var(--vscode-input-foreground); 
                    border: 1px solid var(--vscode-input-border); 
                    padding: 10px; 
                    font-family: var(--vscode-editor-font-family), monospace; 
                    font-size: var(--vscode-editor-font-size); 
                    resize: none; 
                    border-radius: 4px;
                }
                /* Optimized scrollable output container to prevent UI lag */
                #output-container {
                    flex: 1;
                    background: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    border: 1px solid var(--vscode-input-border);
                    padding: 10px;
                    border-radius: 4px;
                    overflow-y: auto;
                    font-family: var(--vscode-editor-font-family), monospace;
                    font-size: var(--vscode-editor-font-size);
                    white-space: pre-wrap;
                    word-break: break-all;
                    margin: 0;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="box">
                    <h3>Input</h3>
                    <textarea id="input" placeholder="Paste your input here...">1&#10;2&#10;3</textarea>
                </div>
                <div class="box">
                    <h3>Output</h3>
                    <pre id="output-container">Execution output will appear here...</pre>
                </div>
            </div>

            <script>
                try {
                    const vscode = acquireVsCodeApi();
                    const inputEl = document.getElementById('input');
                    const outputEl = document.getElementById('output-container');

                    inputEl.addEventListener('input', () => {
                        vscode.postMessage({ type: 'inputChanged', value: inputEl.value });
                    });

                    window.addEventListener('message', event => {
                        try {
                            const message = event.data;
                            if (message && message.type === 'setOutput') {
                                let text = message.value || '';
                                
                                // Truncate output if it exceeds 50,000 characters to prevent UI lag/freezing
                                const MAX_LENGTH = 50000;
                                if (text.length > MAX_LENGTH) {
                                    text = text.substring(0, MAX_LENGTH) + '\\n\\n... [Output truncated due to excessive length / infinite loop] ...';
                                }

                                outputEl.textContent = text;
                                // Auto-scroll to bottom
                                outputEl.scrollTop = outputEl.scrollHeight;
                            }
                        } catch (innerErr) {
                            outputEl.textContent = 'Error rendering output.';
                        }
                    });
                } catch (err) {
                    console.error('Webview initialization error:', err);
                }
            </script>
        </body>
        </html>`;
    }
}