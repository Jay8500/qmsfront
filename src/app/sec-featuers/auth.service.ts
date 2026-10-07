import { Injectable } from '@angular/core';
import { HqmsService } from '../services/hqms.service';

// Browser storage keys written at login (sessionStorage, or localStorage with "Remember me").
const LOGIN_KEYS = ['accessToken', 'refreshToken', 'user_info', 'selected_session_id', 'slctdLctnRle', 'role_name', 'OrgDetials', 'idle_timeout', 'date_format'];

@Injectable({ providedIn: 'root' })
export class AuthService {
    constructor(private _hqms: HqmsService) { }

    // New token pair from the refresh token; the active session id is added by customGetApiCall.
    async refresh(refreshToken: string) {
        const info: any = await this._hqms.customGetApiCall('GET', 'refresh', { refresh_token: refreshToken });
        if (info?.status == 200 && info.data?.[0]?.accessToken) {
            return info.data[0];
        }
        throw new Error('Refresh failed');
    }

    storeTokens(accessToken: string, refreshToken: string, rememberMe: boolean): void {
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem('accessToken', accessToken);
        storage.setItem('refreshToken', refreshToken);
    }

    // This tab's own login (sessionStorage) first, then the remembered one (localStorage).
    getAccessToken(): string | null {
        return sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
    }

    getRefreshToken(): string | null {
        return sessionStorage.getItem('refreshToken') || localStorage.getItem('refreshToken');
    }

    // Removes every login key from both storages (logout).
    clearTokens(): void {
        LOGIN_KEYS.forEach((key) => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        });
    }

    // Encrypted user_info (decrypt with HqmsService.decryptString).
    getUserId(): string | null {
        return sessionStorage.getItem('user_info') || localStorage.getItem('user_info');
    }

    // Removes this tab's login keys only (another tab took over the login).
    clearTabTokens(): void {
        LOGIN_KEYS.forEach((key) => sessionStorage.removeItem(key));
    }

    // Removes the previous user's "Remember me" login (localStorage) when a different user logs in.
    // OrgDetials stays: the login page in progress uses it.
    clearRememberedLogin(): void {
        LOGIN_KEYS.filter((key) => key !== 'OrgDetials').forEach((key) => localStorage.removeItem(key));
    }
}
