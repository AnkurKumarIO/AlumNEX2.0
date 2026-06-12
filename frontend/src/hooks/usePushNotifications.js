import { useEffect, useRef } from 'react';
import { API_BASE } from '../api';

/**
 * Registers the service worker and subscribes the user to web push.
 * Call this after the user has logged in (pass a valid userId).
 * The hook is idempotent — calling it multiple times is safe.
 */
export function usePushNotifications(userId) {
  const registered = useRef(false);

  useEffect(() => {
    if (!userId || registered.current) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    registered.current = true;

    (async () => {
      try {
        // 1. Register service worker
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        await navigator.serviceWorker.ready;

        // 2. Check/request permission
        let permission = Notification.permission;
        if (permission === 'default') {
          permission = await Notification.requestPermission();
        }
        if (permission !== 'granted') return;

        // 3. Fetch VAPID public key from backend (no auth needed)
        const keyRes = await fetch(`${API_BASE}/push/vapid-public-key`);
        if (!keyRes.ok) return;
        const { publicKey } = await keyRes.json();
        if (!publicKey) return;

        // 4. Subscribe (or reuse existing subscription)
        const existing = await reg.pushManager.getSubscription();
        let sub = existing;
        if (!sub) {
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey),
          });
        }

        // 5. Send subscription to backend with auth token
        const token = localStorage.getItem('alumnex_token');
        const json = sub.toJSON();
        await fetch(`${API_BASE}/push/subscribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            endpoint: json.endpoint,
            keys: json.keys,
            userAgent: navigator.userAgent,
          }),
        });

        console.log('[Push] Subscribed for user', userId);
      } catch (err) {
        // Silently fail — push is a nice-to-have
        console.warn('[Push] Setup failed:', err.message);
      }
    })();
  }, [userId]);
}

/** Convert a base64 VAPID public key to a Uint8Array (required by PushManager) */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}
