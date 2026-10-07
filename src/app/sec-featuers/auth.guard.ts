import { CanActivateChildFn, CanMatchFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { SecurityService } from './security.service';
import { PermissionService } from './permission.service';
import { HqmsService } from '../services/hqms.service';
import { firstSegment } from './route-access';

// Layout (all screens after login): a stored access token is needed; otherwise → login.
export const authGuard: CanMatchFn = () => {
    const auth = inject(SecurityService);
    const router = inject(Router);
    if (auth.getAccessToken()) return true;
    // Keep a more specific reason already set by the logout (expired / superseded / idle …).
    if (!sessionStorage.getItem('logout_reason')) sessionStorage.setItem('logout_reason', 'unauth');
    return router.parseUrl('/login');
};

// Every screen inside the layout.
// - In-app navigation (menu, buttons, redirect after login) is always allowed.
// - A typed / bookmarked / refreshed URL, or an unknown one, must be in the user's permission list
//   (module_route / primary_url, or a sub-page of one — see route-access.ts).
// - Not allowed → "Access Denied": Login = log out and go to login; Stay = go to the home screen.
//   The denied page is never loaded.
export const permissionGuard: CanActivateChildFn = async (childRoute, state) => {
    const router = inject(Router);
    const perms = inject(PermissionService);
    const security = inject(SecurityService);
    const _hqms = inject(HqmsService);

    const path = firstSegment(state.url);
    const isUnknownRoute = childRoute.routeConfig?.path === '**';
    const nav = router.getCurrentNavigation();
    const isInAppNavigation = router.navigated && nav?.trigger === 'imperative';

    if (!isUnknownRoute && isInAppNavigation) return true;
    if (!isUnknownRoute && await perms.isAllowed(path)) return true;

    // Logged out while the permission list was loading (session superseded / ended): no "Access Denied";
    // the logout already went to the login page, which shows the real reason.
    if (!security.getAccessToken()) return router.parseUrl('/login');

    const home = await perms.homeUrl();
    const goLogin = await _hqms.showConfirmMessage(
        isUnknownRoute
            ? `The page "/${path}" does not exist or you do not have access to it.`
            : `You do not have permission to open "/${path}".`,
        'Access Denied',
        'confirmsubmit',
        'Login',
        'Stay',
        false,
    );
    if (goLogin) {
        await security.logout('denied');
        return false;
    }
    return router.parseUrl(home);
};
