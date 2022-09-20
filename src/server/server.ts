import { ChildProcess, spawn } from 'node:child_process';
import { once } from 'node:events';
import { unlink } from 'node:fs/promises';
import { createFifo } from '@/utils/fifo';
import { MessagingInterface } from '@/messaging';
import { ServerLuaFunction } from '@/remote-func';

const serverProcess = Symbol('[[GUIServerProcess]]');
const messagingInterface = Symbol('[[GUIServerMessagingInterface]]');

function server(inFifo: string, outFifo: string) {
    return spawn('yues', [inFifo, outFifo], {
        stdio: ['ignore', 'inherit', 'inherit'],
    });
}

const sleep = (ms: number): Promise<void> => new Promise(r => setTimeout(r, ms));

export class Server {
    private [serverProcess]: ChildProcess;
    private [messagingInterface]: MessagingInterface;
    private inFifo: string;
    private outFifo: string;
    initialized: Promise<boolean> | boolean = this.init();
    onMessage: typeof MessagingInterface['prototype']['onMessage'];
    offMessage: typeof MessagingInterface['prototype']['offMessage'];

    private async init() {
        [this.inFifo, this.outFifo] = await Promise.all([createFifo(), createFifo()]);
        this[serverProcess] = server(this.inFifo, this.outFifo);
        this[messagingInterface] = new MessagingInterface(this.inFifo, this.outFifo);
        await this[messagingInterface].initialized;
        this.onMessage = this[messagingInterface].onMessage.bind(this[messagingInterface]);
        this.offMessage = this[messagingInterface].offMessage.bind(this[messagingInterface]);
        return true;
    }

    private async killServerProcess(timeout: number) {
        const exitEvent = once(this[serverProcess], 'exit').then(() => true);
        this.exec('gui.MessageLoop.quit()');
        const firstAttempt = await Promise.race([
            sleep(timeout / 2).then(() => false),
            exitEvent,
        ]);
        if (firstAttempt) return;
        this[serverProcess].kill('SIGTERM');
        const secondAttempt = await Promise.race([
            sleep(timeout / 2).then(() => false),
            exitEvent,
        ]);
        if (secondAttempt) return;
        this[serverProcess].kill('SIGKILL');
        await exitEvent;
    }

    async createFunction(body: string, args: string[]) {
        if (!await this.initialized) throw new Error('Server not initialized');
        const func = new ServerLuaFunction(this[messagingInterface], body, args);
        await func.initialized;
        if (!await func.initialized) throw new Error('Function not initialized');
        return func;
    }

    async exec(body: string, argNames?: string[], args?: any[]) {
        return await this[messagingInterface].iife(body, argNames, args);
    }

    async destroy(childProcessTimeout = 5000) {
        // ensure child process exited and nothing more is written to pipes
        await this.killServerProcess(childProcessTimeout);
        // detach from pipes
        await this[messagingInterface].destroy();
        // remove pipes
        await Promise.all([
            unlink(this.inFifo),
            unlink(this.outFifo),
        ]);
    }
}
