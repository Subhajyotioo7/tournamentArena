import { useEffect, useState } from 'react';

function formatRemaining(milliseconds) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  return `${hours}h ${minutes}m ${seconds}s`;
}

export default function TournamentCountdown({ target, label = 'Starts in' }) {
  const targetTime = target ? new Date(target).getTime() : NaN;
  const [remaining, setRemaining] = useState(() => targetTime - Date.now());

  useEffect(() => {
    if (!Number.isFinite(targetTime)) return undefined;

    const update = () => setRemaining(targetTime - Date.now());
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [targetTime]);

  if (!Number.isFinite(targetTime)) return null;
  if (remaining <= 0) {
    return <span className="font-semibold text-red-600">Starting now</span>;
  }

  return (
    <span>
      {label}: <strong>{formatRemaining(remaining)}</strong>
    </span>
  );
}
