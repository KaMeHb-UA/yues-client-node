import { spawn, SpawnOptionsWithoutStdio } from 'node:child_process';

function str(parts: Buffer[]) {
    return Buffer.concat(parts).toString('utf8');
}

export function spawnAsync(executable: string, args: string[] = [], options?: Omit<SpawnOptionsWithoutStdio, 'stdio'>): Promise<string> {
    return new Promise((resolve, reject) => {
        const cp = spawn(executable,  args, Object.assign({
            stdio: 'pipe' as 'pipe',
        }, options || {}));
        const stdout = [], stderr = [];
        cp.once('exit', code => {
            if (code) {
                return reject(new Error(`Process exited with code ${code}: ${str(stderr)}`));
            }
            resolve(str(stdout));
        });
        cp.once('error', reject);
        cp.stdout.on('data', chunk => stdout.push(chunk));
        cp.stderr.on('data', chunk => stderr.push(chunk));
    });
}
