import { createReadStream, createWriteStream, ReadStream, WriteStream } from 'node:fs';
import { EventEmitter, once } from 'node:events';
import { randomUUID } from 'node:crypto';
import { ServerSentMessageTypes, ServerSentMessage, ClientSentMessage, ClientSentMessageTypes } from './types';

const stdin = Symbol('[[InputFifoStream]]');
const stdout = Symbol('[[OutputFifoStream]]');

export class MessagingInterface {
    private readonly ee = new EventEmitter();
    [stdin]: WriteStream;
    [stdout]: ReadStream;
    initialized: Promise<boolean> | boolean;

    constructor(inFifo: string, outFifo: string) {
        this[stdin] = createWriteStream(inFifo);
        this[stdout] = createReadStream(outFifo);
        this[stdout].on('data', this.onNextBuf);
        this.initialized = once(this.ee, 'init').then(() => true);
    }

    private readonly onNextBuf = (buf: Buffer) => {
        for (const line of buf.toString('utf8').split('\n')) {
            if (line !== '') this.onRawMessage(JSON.parse(line));
        }
    }

    private onRawMessage(message: ServerSentMessage){
        switch(message.type){
            case ServerSentMessageTypes.message:
                this.ee.emit('message', message.val);
                break;
            case ServerSentMessageTypes.init:
                this.ee.emit('init');
                break;
            default:
                const eventKey = `${message.type}_${message.id}`;
                if ('err' in message) {
                    this.ee.emit(eventKey, { error: new Error(message.err) });
                } else {
                    this.ee.emit(eventKey, { value: message.res });
                }
        }
    };

    private send(message: ClientSentMessage) {
        this[stdin].write(JSON.stringify(message));
    }

    private async once(event: string) {
        const [{ error, value }] = await once(this.ee, event);
        if (error) throw error;
        return value;
    }

    private closeStream(stream: ReadStream | WriteStream): Promise<void> {
        return new Promise((resolve, reject) => {
            if (stream.closed) return resolve();
            stream.close((err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    onMessage(callback: (value: any) => void) {
        this.ee.on('message', callback);
    }

    offMessage(callback: (value: any) => void) {
        this.ee.off('message', callback);
    }

    async createServerFunction(body: string, args?: string[]): Promise<string> {
        const callId = randomUUID();
        const result = this.once(`${ServerSentMessageTypes.createFunctionResult}_${callId}`);
        this.send({
            type: ClientSentMessageTypes.createFunction,
            id: callId,
            body,
            args: args || [],
        });
        return await result;
    }

    async callServerFunction(id: string, args?: any[]) {
        const callId = randomUUID();
        const result = this.once(`${ServerSentMessageTypes.callFunctionResult}_${callId}`);
        this.send({
            type: ClientSentMessageTypes.callFunction,
            id: callId,
            ref: id,
            args: args || [],
        });
        return await result;
    }

    async removeServerFunction(id: string) {
        const callId = randomUUID();
        const result = this.once(`${ServerSentMessageTypes.removeFunctionResult}_${callId}`);
        this.send({
            type: ClientSentMessageTypes.removeFunction,
            id: callId,
            ref: id,
        });
        await result;
    }

    async iife(body: string, argNames?: string[], args?: string[]) {
        const callId = randomUUID();
        const result = this.once(`${ServerSentMessageTypes.iifeResult}_${callId}`);
        this.send({
            type: ClientSentMessageTypes.iife,
            id: callId,
            body,
            argNames: argNames || [],
            args: args || [],
        });
        return await result;
    }

    async destroy() {
        await Promise.all([
            this.closeStream(this[stdin]),
            this.closeStream(this[stdout]),
        ]);
    }
}
