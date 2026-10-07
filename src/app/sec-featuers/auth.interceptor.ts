import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, finalize, shareReplay, switchMap, throwError, from, map } from 'rxjs';
import { SecurityService } from './security.service';

// Calls that never trigger a refresh / logout (login screen, refresh itself, logout).
const AUTH_CALLS = ['fnGetLoginUser', 'fnOrganizationDetails', 'refresh', 'logout', 'fnHqmsUserMobileEmailOtpWrite'];

// One refresh at a time; parallel requests wait for the same result.
let refreshInProgress$: Observable<string> | null = null;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const security = inject(SecurityService);
    const token = security.getAccessToken();
    const withToken = (t: string | null) => t ? req.clone({ setHeaders: { Authorization: `Bearer ${t}` } }) : req;

    return next(withToken(token)).pipe(
        catchError((err: HttpErrorResponse) => {
            const isAuthCall = AUTH_CALLS.some((name) => req.url.includes(name));
            // No token on this request = already logged out (e.g. a request still in flight); nothing to do.
            if (err.status !== 401 || isAuthCall || !token) return throwError(() => err);

            // Backend sends { code, data } with 401 (see HQMS_BACKEND/api/utilities/util.js, commonRoutingFiles.js).
            let code = '';
            try {
                code = (typeof err.error === 'string' ? JSON.parse(err.error) : err.error)?.code || '';
            } catch { }

            if (code === 'SESSION_SUPERSEDED') {
                security.logout('superseded', false);
                return throwError(() => err);
            }
            if (code !== 'TOKEN_EXPIRED') {
                // Session ended / invalid, or token missing / invalid → back to login.
                security.logout(code.startsWith('SESSION') ? 'expired' : 'unauth', false);
                return throwError(() => err);
            }

            const refreshToken = security.getRefreshToken();
            if (!refreshToken) {
                security.logout('expired', false);
                return throwError(() => err);
            }
            if (!refreshInProgress$) {
                refreshInProgress$ = from(security.refresh(refreshToken)).pipe(
                    map((res: any) => {
                        // Keep the new tokens where this tab's login lives (own tab = sessionStorage).
                        const rememberMe = !sessionStorage.getItem('accessToken') && !!localStorage.getItem('accessToken');
                        security.storeTokens(res.accessToken, res.refreshToken, rememberMe);
                        return res.accessToken as string;
                    }),
                    catchError((refreshErr) => {
                        security.logout('expired', false);
                        return throwError(() => refreshErr);
                    }),
                    finalize(() => { refreshInProgress$ = null; }),
                    shareReplay(1)
                );
            }
            return refreshInProgress$.pipe(switchMap((newToken) => next(withToken(newToken))));
        })
    );
};
