import { PseudoFunc } from '@/utils';
import { MessagingInterface } from '@/messaging';

export class ServerLuaFunction extends PseudoFunc {
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
