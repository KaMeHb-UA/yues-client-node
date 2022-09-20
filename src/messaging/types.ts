export enum ServerSentMessageTypes {
    createFunctionResult = 'CREATE_R',
    callFunctionResult = 'CALL_R',
    removeFunctionResult = 'REMOVE_R',
    iifeResult = 'IIFE_R',
    message = 'POSTMESSAGE',
    init = 'INIT',
}

export enum ClientSentMessageTypes {
    createFunction = 'CREATE',
    callFunction = 'CALL',
    removeFunction = 'REMOVE',
    iife = 'IIFE',
}

type Result<T, R> = {
    type: T;
    id: string;
    res: R;
} | {
    type: T;
    id: string;
    err: string;
};

type Request<T, P extends Record<string, any>> = {
    type: T;
    id: string;
} & P;

type FunctionCallResult = unknown;

export type CreateFunctionResult = Result<ServerSentMessageTypes.createFunctionResult, string>;
export type CallFunctionResult = Result<ServerSentMessageTypes.callFunctionResult, FunctionCallResult>;
export type RemoveFunctionResult = Result<ServerSentMessageTypes.removeFunctionResult, null>;
export type IifeResult = Result<ServerSentMessageTypes.iifeResult, FunctionCallResult>;
export type PostedMessage = { type: ServerSentMessageTypes.message; val: unknown };
export type InitMessage = { type: ServerSentMessageTypes.init };

export type CreateFunctionRequest = Request<ClientSentMessageTypes.createFunction, { body: string; args: string[] }>;
export type CallFunctionRequest = Request<ClientSentMessageTypes.callFunction, { ref: string; args: string[] }>;
export type RemoveFunctionRequest = Request<ClientSentMessageTypes.removeFunction, { ref: string }>;
export type IifeRequest = Request<ClientSentMessageTypes.iife, { body: string; argNames: string[]; args: string[] }>;

export type ServerSentMessage =
    | CreateFunctionResult
    | CallFunctionResult
    | RemoveFunctionResult
    | IifeResult
    | PostedMessage
    | InitMessage
    ;

export type ClientSentMessage =
    | CreateFunctionRequest
    | CallFunctionRequest
    | RemoveFunctionRequest
    | IifeRequest
    ;
