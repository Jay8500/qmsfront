import { Injectable } from '@angular/core';

// One user per browser: which user is logged in in this browser (all tabs share localStorage).
// Written after a successful login, removed at that user's logout.
const KEY = 'hqms_active_user';

export interface ActiveUser {
  user_id: string;
  display_name: string;
}

@Injectable({ providedIn: 'root' })
export class ActiveUserService {
  private handler: ((e: StorageEvent) => void) | null = null;

  get(): ActiveUser | null {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  set(user: ActiveUser): void {
    localStorage.setItem(KEY, JSON.stringify({ user_id: user.user_id, display_name: user.display_name }));
  }

  // Removes the marker only if it still belongs to this user (another user may have signed in since).
  clear(userId: string | null | undefined): void {
    const current = this.get();
    if (current && userId && current.user_id === userId) localStorage.removeItem(KEY);
  }

  // Calls onOtherUser when a DIFFERENT user signs in in another tab of this browser.
  watch(myUserId: string, onOtherUser: (other: ActiveUser) => void): void {
    this.stopWatching();
    this.handler = (e: StorageEvent) => {
      if (e.key !== KEY || !e.newValue) return;
      try {
        const other: ActiveUser = JSON.parse(e.newValue);
        if (other.user_id && other.user_id !== myUserId) onOtherUser(other);
      } catch (err) { }
    };
    window.addEventListener('storage', this.handler);
  }

  stopWatching(): void {
    if (this.handler) window.removeEventListener('storage', this.handler);
    this.handler = null;
  }
}
