import { spawn } from 'child_process';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

export function compileCpp(sourcePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const isWindows = os.platform() === 'win32';
        const outName = isWindows ? 'a.exe' : 'a.out';
        const outDir = os.tmpdir();
        const outputPath = path.join(outDir, `cprunner_${Date.now()}_${outName}`);

        const compilerProcess = spawn('g++', [sourcePath, '-o', outputPath]);
        let errorOutput = '';

        compilerProcess.stderr.on('data', (data) => errorOutput += data.toString());

        compilerProcess.on('close', (code) => {
            if (code === 0) resolve(outputPath);
            else reject(new Error(`C++ Compilation failed:\n${errorOutput}`));
        });
        
        compilerProcess.on('error', (err) => reject(new Error(`Failed to start g++. Is MinGW or GCC installed and in your PATH?\n${err.message}`)));
    });
}

export interface JavaCompileResult {
    classDirectory: string;
    className: string;
}

export function compileJava(sourcePath: string): Promise<JavaCompileResult> {
    return new Promise((resolve, reject) => {
        const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cpjava_'));
        const className = path.parse(sourcePath).name;

        const compilerProcess = spawn('javac', ['-d', outDir, sourcePath]);
        let errorOutput = '';

        compilerProcess.stderr.on('data', (data) => errorOutput += data.toString());

        compilerProcess.on('close', (code) => {
            if (code === 0) resolve({ classDirectory: outDir, className });
            else reject(new Error(`Java Compilation failed:\n${errorOutput}`));
        });
        
        compilerProcess.on('error', (err) => reject(new Error(`Failed to start javac. Is the JDK installed and in your PATH?\n${err.message}`)));
    });
}