import { spawnAsync } from './spawn-async';

async function createFifoUnix() {
    const tmpfile = (await spawnAsync('mktemp')).slice(0, -1);
    await spawnAsync('rm', [tmpfile]);
    await spawnAsync('mkfifo', [tmpfile]);
    return tmpfile;
}

export async function createFifo() {
    return await createFifoUnix();
}
