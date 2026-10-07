import { Injectable, NgZone } from '@angular/core';

// Storage key for the idle setting (written at login with the other login keys, removed at logout).
export const IDLE_STORAGE_KEY = 'idle_timeout';
const DEFAULT_IDLE_MS = 15 * 60 * 1000;

@Injectable({ providedIn: 'root' })
export class IdleService {
    private idleTimer: any;
    private graceTimer: any;
    private inWarning = false;
    private readonly GRACE_MS = 10000;
    private readonly activityEvents = ['mousemove', 'keydown', 'click', 'scroll'];
    private resetIdle: () => void = () => { };
    private onWarnCb: (() => void) | null = null;
    private onIdleCb: (() => void) | null = null;
    public IDLE_MS = DEFAULT_IDLE_MS;
    private idleText = '';

    constructor(private zone: NgZone) { }

    // Idle time chosen in Application Settings (entity IDLETIMEOUT):
    // idle_time_code = value_code in MILLISECONDS (e.g. 900000), idle_time_label = display value (e.g. '15 Minutes').
    // Returns the value to store so a page refresh keeps the same setting.
    configure(idleTimeCode: any, idleTimeLabel?: string | null): string {
        const ms = Number(idleTimeCode);
        this.IDLE_MS = ms > 0 ? ms : DEFAULT_IDLE_MS;
        this.idleText = (idleTimeLabel || '').trim();
        return JSON.stringify({ ms: this.IDLE_MS, label: this.idleText });
    }

    // How long the user was inactive, as the admin named it ('15 Minutes'), else e.g. '15 minutes'.
    get idleLabel(): string {
        if (this.idleText) return this.idleText;
        const minutes = Math.round(this.IDLE_MS / 60000);
        return minutes >= 1 ? `${minutes} minute${minutes == 1 ? '' : 's'}` : `${Math.round(this.IDLE_MS / 1000)} seconds`;
    }

    // Seconds between the warning and the automatic logout (shown in the warning).
    get graceSeconds(): number {
        return Math.round(this.GRACE_MS / 1000);
    }

    // Reads the setting stored at login (sessionStorage, or localStorage with "Remember me").
    private loadStoredSetting(): void {
        try {
            const raw = localStorage.getItem(IDLE_STORAGE_KEY) || sessionStorage.getItem(IDLE_STORAGE_KEY);
            if (raw) {
                const s = JSON.parse(raw);
                this.configure(s.ms, s.label);
            }
        } catch (e) { }
    }

    start(onWarn: () => void, onIdle: () => void): void {
        this.loadStoredSetting();
        this.onWarnCb = onWarn;
        this.onIdleCb = onIdle;
        this.resetIdle = () => {
            if (this.inWarning) return;
            clearTimeout(this.idleTimer);
            this.zone.runOutsideAngular(() => {
                this.idleTimer = setTimeout(() => this.beginWarning(), this.IDLE_MS);
            })
        }
        this.activityEvents.forEach((evt) => window.addEventListener(evt, this.resetIdle))
        this.resetIdle();
    }

    private beginWarning(): void {
        this.inWarning = true;
        this.onWarnCb?.();
        this.zone.runOutsideAngular(() => {
            this.graceTimer = setTimeout(
                () => this.zone.run(() => { this.inWarning = false; this.onIdleCb?.(); }), this.GRACE_MS)
        })
    }

    resume(): void {
        clearTimeout(this.graceTimer);
        this.inWarning = false;
        this.resetIdle();
    }

    stop(): void {
        clearTimeout(this.idleTimer);
        clearTimeout(this.graceTimer);
        this.inWarning = false;
        this.activityEvents.forEach((evt) => window.removeEventListener(evt, this.resetIdle));
        this.onWarnCb = null;
        this.onIdleCb = null;
    }
}
