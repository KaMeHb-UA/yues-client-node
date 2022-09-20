export class PseudoFunc extends Function {
    // @ts-ignore
    constructor(realfunc: Function) {
        return Object.setPrototypeOf(realfunc, new.target.prototype);
    }
}
