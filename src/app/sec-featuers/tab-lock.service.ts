import { Injectable} from '@angular/core';
const HEARTBEAT_MS = 3000;
const STALE_MS = 8000;
// Tabs holding a claim answer a 'ping' here, so a claim left by a closed browser can be told apart.
const CHANNEL = 'hqms_tab_lock';
@Injectable({providedIn:'root'})
export class TabLockService {
    // Persisted in sessionStorage so a same-tab refresh keeps the SAME
    // tabId — a fresh random id on every reload would make this tab look
    // like a competing "different" tab against its own very-recent claim.
    tabId = (() => {
        const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
        const isReload = navEntries.length > 0 && navEntries[0]['type'] === 'reload';
        const existing = sessionStorage.getItem('tab_id');
        if(isReload && existing) return existing;
        const id:any = (()=> {
            try{
                if(typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'){
                    return crypto.randomUUID();
                }
            }catch(e){};
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,(c:any) => {
                  const r = Math.random() * 16 | 0;
                  const v = c === 'x' ? r : (r &0x3|0x8);
                  return v.toString(16);
            })
        })();
        sessionStorage.setItem('tab_id', id);
        return id;
    })();
    private heartbeatHandle:any;
    private storageHandler: ((e: StorageEvent) => void) | null = null;
    private beforeUnloadHandler: (() => void) | null = null;
    private channel: BroadcastChannel | null = null;
    private claimedId: string | null = null;

    private keyFor(id:string){
        return 'active_session_'+id;
    }

    private writeClaim(id:string){
        localStorage.setItem(this.keyFor(id), JSON.stringify({tabId:this.tabId, timestamp:Date.now()}));
    }

    tryLock(id:string):boolean{
        const existing = localStorage.getItem(this.keyFor(id));
        if(existing){
            const data = JSON.parse(existing);
            const age = Date.now()-data.timestamp;
            if(data.tabId !== this.tabId&&age<STALE_MS) return false;
        };
        this.writeClaim(id);
        this.setBeforeUnloadHandler(() => this.releaseLock(id));
        return true;
    }

    private setBeforeUnloadHandler(handler: () => void): void {
        if (this.beforeUnloadHandler) window.removeEventListener('beforeunload', this.beforeUnloadHandler);
        this.beforeUnloadHandler = handler;
        window.addEventListener('beforeunload', this.beforeUnloadHandler);
    }

    // Logout: remove this user's lock even if an earlier page load of this tab wrote it
    // (typing a URL reloads the app with a new tabId). The server session ends anyway.
    forceRelease(id:string){
        localStorage.removeItem(this.keyFor(id));
    }

    releaseLock(id:string){
        let existing = localStorage.getItem(this.keyFor(id));
        if(existing){
            let data = JSON.parse(existing);
            if(data.tabId === this.tabId) localStorage.removeItem(this.keyFor(id));
        };
    }

    claim(id:string, onTakeover:()=> void):boolean{
        let key = this.keyFor(id);
        let existing = localStorage.getItem(key);
        if(existing){
            const data = JSON.parse(existing);
            const age = Date.now() - data.timestamp;
            if(data.tabId !== this.tabId && age < STALE_MS) return false;
        }
        this.writeClaim(id);
        this.heartbeatHandle = setInterval(()=> this.writeClaim(id),HEARTBEAT_MS);
        this.claimedId = id;
        this.answerPings();

        // Replace, don't stack: without this, logging out and back in within
        // the same tab (no page refresh) would leave the OLD login's
        // listener alive forever, watching a stale key with a stale
        // onTakeover closure.
        if (this.storageHandler) window.removeEventListener('storage', this.storageHandler);
        this.storageHandler = (e: StorageEvent) => {
            if(e.key === key && e.newValue){
                const data = JSON.parse(e.newValue);
                if(data.tabId !== this.tabId){
                    clearInterval(this.heartbeatHandle);
                    onTakeover();
                }
            }
        };
        window.addEventListener('storage', this.storageHandler);

        this.setBeforeUnloadHandler(() => this.releaseClaim(id));
        return true;
    }

    releaseClaim(id:string){
        clearInterval(this.heartbeatHandle);
        this.claimedId = null;
        if (this.storageHandler) {
            window.removeEventListener('storage', this.storageHandler);
            this.storageHandler = null;
        }
        const existing = localStorage.getItem(this.keyFor(id));
        if(existing){
            const data = JSON.parse(existing);
            if(data.tabId === this.tabId) localStorage.removeItem(this.keyFor(id));
        }
    }

    // Answers 'is anyone holding this claim?' while this tab holds one.
    private answerPings(){
        if (this.channel || typeof BroadcastChannel === 'undefined') return;
        this.channel = new BroadcastChannel(CHANNEL);
        this.channel.onmessage = (e: MessageEvent) => {
            if (e.data?.type === 'ping' && this.claimedId && e.data.id === this.claimedId) {
                this.channel?.postMessage({ type: 'pong', id: e.data.id });
            }
        };
    }

    // True when an open tab of this browser still holds the claim for this id.
    // False when nobody answers: the claim was left by a browser that was just closed
    // (closing the browser does not always run 'beforeunload'), so it can be taken over.
    isClaimAlive(id:string, waitMs = 700): Promise<boolean>{
        if (typeof BroadcastChannel === 'undefined') return Promise.resolve(true);
        return new Promise((resolve) => {
            const ch = new BroadcastChannel(CHANNEL);
            const done = (alive: boolean) => { clearTimeout(timer); ch.close(); resolve(alive); };
            const timer = setTimeout(() => done(false), waitMs);
            ch.onmessage = (e: MessageEvent) => { if (e.data?.type === 'pong' && e.data.id === id) done(true); };
            ch.postMessage({ type: 'ping', id });
        });
    }

}