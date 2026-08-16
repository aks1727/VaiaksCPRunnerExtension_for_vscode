import * as vscode from 'vscode';

export type SupportedLanguage = 'cpp' | 'python' | 'java' | 'unsupported';

export function detectLanguage(document: vscode.TextDocument): SupportedLanguage {
    const languageId = document.languageId;
    
    if (languageId === 'cpp' || languageId === 'c') {
        return 'cpp';
    }
    if (languageId === 'python') {
        return 'python';
    }
    if (languageId === 'java') {
        return 'java';
    }
    
    return 'unsupported';
}