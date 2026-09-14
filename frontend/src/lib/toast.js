import { toast } from 'sonner';

let lastNotification = '';
let lastNotificationAt = 0;

export function notify(message, options = {}) {
  const text = String(message);
  const now = Date.now();
  if (text === lastNotification && now - lastNotificationAt < 800) return;
  lastNotification = text;
  lastNotificationAt = now;

  const [title, ...descriptionLines] = text.split('\n');
  const description = descriptionLines.join('\n').trim();
  const isError = options.variant === 'destructive'
    || /^(❌|Error|Failed|Update failed)/i.test(text);

  const toastOptions = description ? { description } : undefined;
  if (isError) {
    toast.error(title, toastOptions);
  } else {
    toast.success(title, toastOptions);
  }
}
