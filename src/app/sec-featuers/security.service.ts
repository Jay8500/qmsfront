import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { IdleService } from './idle.service';
import { TabLockService } from './tab-lock.service';
import { PermissionService } from './permission.service';
import { HqmsService } from '../services/hqms.service';
import { ActiveUser, ActiveUserService } from './active-user.service';

// Why the user lands on the login page; the login page shows a matching message.
export type LogoutReason = 'logout' | 'idle' | 'denied' | 'superseded' | 'expired' | 'duplicate' | 'unauth' | 'switched';

@Injectable({ providedIn: 'root' })
export class SecurityService {
    constructor(private auth: AuthService,
        private idle: IdleService,
        private tabLock: TabLockService,
        private perms: PermissionService,
        private _hqms: HqmsService,
        private router: Router,
        private activeUser: ActiveUserService
    ) { }

    refresh(refreshToken: string) {
        return this.auth.refresh(refreshToken);
    }

    // One logout for the header, idle timeout, route guard and interceptor:
    // 1. tell the server first (the request still carries the session id) — skipped when the
    //    server already ended the session (superseded / expired),
    // 2. release this tab's claim and the login tab lock, 3. clear storage and caches, 4. go to login.
    async logout(reason: LogoutReason = 'logout', callServer = true): Promise<void> {
        const user = this.readUserInfo();
        if (callServer && user?.user_id) {
            try {
                await this._hqms.customGetApiCall('GET', 'logout', { user_id: user.user_id, reason: reason === 'idle' ? 'IDLE' : 'LOGOUT' });
            } catch (e) { }
        }
        if (user?.user_id) this.tabLock.releaseClaim(user.user_id);
        this.activeUser.clear(user?.user_id);
        this.activeUser.stopWatching();
        if (user?.user_name) this.tabLock.forceRelease(String(user.user_name).trim().toLowerCase());
        this.idle.stop();
        this.auth.clearTokens();
        this.perms.clear();
        this._hqms.clearApiCache();
        this._hqms.closeConfirm();
        // First cause wins (a later failing request must not replace "expired" / "superseded").
        if (reason !== 'logout' && !sessionStorage.getItem('logout_reason')) sessionStorage.setItem('logout_reason', reason);
        await this.router.navigate(['/login']);
    }

    // ---- One user per browser (ActiveUserService) ----

    // A DIFFERENT user who is logged in in this browser now (an open tab, or a "Remember me" login), else null.
    async otherUserInBrowser(myUserId: string): Promise<ActiveUser | null> {
        const marked = this.activeUser.get();
        if (marked && marked.user_id != myUserId) {
            if (this.rememberedUser()?.user_id == marked.user_id || await this.tabLock.isClaimAlive(marked.user_id)) return marked;
            this.activeUser.clear(marked.user_id); // left by a browser closed without logout; nobody is logged in
        }
        const remembered = this.rememberedUser();
        return remembered && remembered.user_id != myUserId ? remembered : null;
    }

    // Called by the login page before the new user's login is stored: ends the previous user's
    // "Remember me" login (server + storage), then marks the new user. The previous user's open
    // tabs see the new mark and log themselves out (switchedOut).
    async takeOverBrowser(newUser: ActiveUser): Promise<void> {
        const remembered = this.rememberedUser();
        if (remembered && remembered.user_id != newUser.user_id) {
            try {
                // Still the previous user's token and session id here (this login tab has none of its own yet).
                await this._hqms.customGetApiCall('GET', 'logout', { user_id: remembered.user_id, reason: 'LOGOUT' });
            } catch (e) { }
            this.auth.clearRememberedLogin();
        }
        this.activeUser.set(newUser);
    }

    // Another user signed in in this browser: end THIS tab's login only. Shared (localStorage) data
    // now belongs to the new user and is not touched; a remembered login was already ended by takeOverBrowser.
    async switchedOut(myUserId: string): Promise<void> {
        if (sessionStorage.getItem('accessToken')) {
            try {
                await this._hqms.customGetApiCall('GET', 'logout', { user_id: myUserId, reason: 'LOGOUT' });
            } catch (e) { }
        }
        this.tabLock.releaseClaim(myUserId);
        this.activeUser.stopWatching();
        this.idle.stop();
        this.auth.clearTabTokens();
        this.perms.clear();
        this._hqms.clearApiCache();
        this._hqms.closeConfirm();
        if (!sessionStorage.getItem('logout_reason')) sessionStorage.setItem('logout_reason', 'switched');
        await this.router.navigate(['/login']);
    }

    getActiveUser(): ActiveUser | null {
        return this.activeUser.get();
    }

    setActiveUser(user: ActiveUser): void {
        this.activeUser.set(user);
    }

    watchActiveUser(myUserId: string, onOtherUser: () => void): void {
        this.activeUser.watch(myUserId, onOtherUser);
    }

    stopWatchingActiveUser(): void {
        this.activeUser.stopWatching();
    }

    // The "Remember me" login stored in localStorage (shared by all tabs), if any.
    private rememberedUser(): ActiveUser | null {
        if (!localStorage.getItem('accessToken')) return null;
        try {
            const stored = localStorage.getItem('user_info');
            const info: any = stored ? this._hqms.decryptString(stored) : null;
            return info?.user_id ? { user_id: info.user_id, display_name: info.user_display_name || '' } : null;
        } catch (e) {
            return null;
        }
    }

    private readUserInfo(): any {
        try {
            const info = this.auth.getUserId();
            return info ? this._hqms.decryptString(info) : null;
        } catch (e) {
            return null;
        }
    }

    storeTokens(accessToken: string, refreshToken: string, rememberMe: boolean) {
        this.auth.storeTokens(accessToken, refreshToken, rememberMe);
    }

    getAccessToken(): string | null {
        return this.auth.getAccessToken();
    }

    getRefreshToken(): string | null {
        return this.auth.getRefreshToken();
    }

    clearTokens(): void {
        this.auth.clearTokens();
    }

    clearTabTokens(): void {
        this.auth.clearTabTokens();
    }

    getUserId(): string | null {
        return this.auth.getUserId();
    }

    startIdleWatch(onWarn: () => void, onIdle: () => void): void {
        this.idle.start(onWarn, onIdle);
    }

    tryLockTab(id: string): boolean {
        return this.tabLock.tryLock(id);
    }

    releaseTabLock(id: string): void {
        this.tabLock.releaseLock(id);
    }

    claimTab(id: string, onTakeover: () => void): boolean {
        return this.tabLock.claim(id, onTakeover);
    }

    releaseTabClaim(id: string): void {
        this.tabLock.releaseClaim(id);
    }

    isTabClaimAlive(id: string): Promise<boolean> {
        return this.tabLock.isClaimAlive(id);
    }

    forceReleaseTab(id: string): void {
        this.tabLock.forceRelease(id);
    }

    resumeIdleWatch(): void {
        this.idle.resume();
    }

    stopIdleWatch(): void {
        this.idle.stop();
    }
}
