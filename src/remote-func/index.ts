import { PseudoFunc } from '@/utils';
import { MessagingInterface } from '@/messaging';

class ServerLuaFunctionConstructor extends PseudoFunc {
    private ref: string;

    initialized: Promise<boolean> | boolean = this.init();

    constructor(
        private readonly messaging: MessagingInterface,
        private readonly body: string,
        private readonly args: string[],
    ) {
        super(async (...args: any[]) => {
            if (!await this.initialized) throw new EvalError('Remote function was not initialized');
            return this.messaging.callServerFunction(this.ref, args);
        });
    }

    private async init() {
        if (await this.initialized) return;
        this.ref = await this.messaging.createServerFunction(this.body, this.args);
        return true;
    }

    async destroy() {
        if (!await this.initialized) return;
        await this.messaging.removeServerFunction(this.ref);
    }

    toString(): string {
        return `function (${this.args.join(', ')})\n${this.body}\nend`;
    }
}

const ServerLuaFunction: {
    new(messaging: MessagingInterface, body: string, args: string[]): ServerLuaFunction;
} = ServerLuaFunctionConstructor as any;

type ImplementedFunc<A extends any[], R> = (...args: A) => Promise<R>;

interface ServerLuaFunction<A extends any[] = any[], R = any> extends ImplementedFunc<A, R> {
    initialized: Promise<boolean> | boolean
    destroy(): Promise<void>
}

export { ServerLuaFunction }
