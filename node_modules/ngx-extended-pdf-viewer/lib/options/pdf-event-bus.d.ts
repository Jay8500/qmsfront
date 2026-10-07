export interface IEventBus {
    destroy(): void;
    on(eventName: string, listener: (event: any) => void, options?: {
        external?: boolean;
        once?: boolean;
        signal?: any;
    }): any;
    off(eventName: string, listener: (event: any) => void): any;
    dispatch(eventName: string, options?: any): void;
}
