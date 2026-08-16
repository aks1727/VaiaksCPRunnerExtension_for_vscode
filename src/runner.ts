import { spawn } from 'child_process';
import { performance } from 'perf_hooks';
import * as os from 'os';

export interface ExecutionResult {
    output: string;
    timeMs: number;
    exitCode: number;
    memoryMb: string;
}

export function executeCommand(cmd: string, runArgs: string[], input: string, timeoutMs: number): Promise<ExecutionResult> {
    return new Promise((resolve, reject) => {
        const startTime = performance.now();
        const platform = os.platform();

        let finalCmd = cmd;
        let finalArgs = [...runArgs];

        if (platform === 'linux' || platform === 'darwin') {
            finalCmd = '/usr/bin/time';
            finalArgs = ['-f', '__CP_MEM__:%M', cmd, ...runArgs];
        } 
        else if (platform === 'win32') {
            finalCmd = 'cmd.exe';
            finalArgs = ['/c', cmd, ...runArgs];
        }

        const childProcess = spawn(finalCmd, finalArgs, { shell: platform === 'win32' });

        let output = '';
        let errorOutput = '';
        let memoryKb = 0;
        let isTimedOut = false;

        if (input) {
            childProcess.stdin.write(input);
        }
        childProcess.stdin.end();

        childProcess.stdout.on('data', (data) => {
            output += data.toString();
        });

        childProcess.stderr.on('data', (data) => {
            const text = data.toString();
            const match = text.match(/__CP_MEM__:(\d+)/);
            if (match) {
                memoryKb = parseInt(match[1], 10);
                errorOutput += text.replace(/__CP_MEM__:\d+\n?/, '');
            } else {
                errorOutput += text;
            }
        });

        const timer = setTimeout(() => {
            isTimedOut = true;
            try {
                childProcess.kill('SIGKILL');
            } catch (e) {}

            const timeMs = Math.round(performance.now() - startTime);
            resolve({
                output: output + `\n\n❌ STATUS: TIME LIMIT EXCEEDED (TLE)\nProcess terminated after >${timeoutMs} ms.`,
                timeMs,
                exitCode: -1,
                memoryMb: memoryKb > 0 ? (memoryKb / 1024).toFixed(2) : 'N/A'
            });
        }, timeoutMs);

        childProcess.on('close', (code) => {
            if (isTimedOut) return;
            clearTimeout(timer);

            const endTime = performance.now();
            const timeMs = Math.round(endTime - startTime);
            
            const memoryMb = memoryKb > 0 ? (memoryKb / 1024).toFixed(2) : 'N/A';
            const exitCode = code ?? -1;

            if (exitCode === 0) {
                resolve({ output, timeMs, exitCode, memoryMb });
            } else {
                resolve({ 
                    output: output + (errorOutput ? `\n[Stderr/Error]:\n${errorOutput}` : ''),
                    timeMs, 
                    exitCode, 
                    memoryMb 
                });
            }
        });

        childProcess.on('error', (err) => {
            clearTimeout(timer);
            if (isTimedOut) return;
            
            if ((platform === 'linux' || platform === 'darwin') && err.message.includes('ENOENT')) {
                executeFallbackDirect(cmd, runArgs, input, timeoutMs, startTime).then(resolve).catch(reject);
            } else {
                reject(new Error(`Failed to execute command '${cmd}':\n${err.message}`));
            }
        });
    });
}

function executeFallbackDirect(cmd: string, runArgs: string[], input: string, timeoutMs: number, startTime: number): Promise<ExecutionResult> {
    return new Promise((resolve, reject) => {
        const child = spawn(cmd, runArgs);
        let output = '';
        let errorOutput = '';

        if (input) { child.stdin.write(input); }
        child.stdin.end();

        child.stdout.on('data', (d) => output += d.toString());
        child.stderr.on('data', (d) => errorOutput += d.toString());

        const t = setTimeout(() => {
            try { child.kill('SIGKILL'); } catch (e) {}
            resolve({ output: output + `\n\n❌ STATUS: TIME LIMIT EXCEEDED (TLE)`, timeMs: timeoutMs, exitCode: -1, memoryMb: 'N/A' });
        }, timeoutMs);

        child.on('close', (code) => {
            clearTimeout(t);
            const timeMs = Math.round(performance.now() - startTime);
            resolve({ output, timeMs, exitCode: code ?? 0, memoryMb: 'N/A' });
        });

        child.on('error', (err) => {
            clearTimeout(t);
            reject(err);
        });
    });
}