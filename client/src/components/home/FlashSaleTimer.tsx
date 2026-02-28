import React, { useState, useEffect } from 'react';

interface FlashSaleTimerProps {
  endTime: string;
  compact?: boolean;
}

const FlashSaleTimer: React.FC<FlashSaleTimerProps> = ({ endTime, compact = false }) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculate = () => {
      const diff = new Date(endTime).getTime() - Date.now();
      if (diff <= 0) { setIsExpired(true); return; }
      setTimeLeft({
        hours: Math.floor(diff / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    calculate();
    const timer = setInterval(calculate, 1000);
    return () => clearInterval(timer);
  }, [endTime]);

  if (isExpired) return <span className="text-white/80 text-sm">Sale ended</span>;

  const fmt = (n: number) => n.toString().padStart(2, '0');

  if (compact) {
    return (
      <span className="font-mono font-bold text-white text-sm">
        {fmt(timeLeft.hours)}:{fmt(timeLeft.minutes)}:{fmt(timeLeft.seconds)}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1 ml-3">
      <span className="text-white/80 text-sm font-medium mr-1">Ends in:</span>
      {[
        { val: timeLeft.hours, label: 'H' },
        { val: timeLeft.minutes, label: 'M' },
        { val: timeLeft.seconds, label: 'S' },
      ].map((unit, i) => (
        <React.Fragment key={unit.label}>
          {i > 0 && <span className="text-white font-bold">:</span>}
          <div className="timer-box">
            <div className="font-mono">{fmt(unit.val)}</div>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
};

export default FlashSaleTimer;
