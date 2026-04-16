import { useState, useEffect, useCallback } from 'react';
import { TotpAccount } from '../utils/uriParser';
import { generateTotp, getRemainingSeconds, getProgressPercent } from '../utils/totp';

interface TotpCardProps {
  account: TotpAccount;
  onDelete: (id: string) => void;
}

function getCurrentCounter(period: number): number {
  return Math.floor(Date.now() / 1000 / period);
}

export function TotpCard({ account, onDelete }: TotpCardProps) {
  const [code, setCode] = useState<string>('------');
  const [remaining, setRemaining] = useState<number>(30);
  const [copied, setCopied] = useState<boolean>(false);

  const period = account.config.period;

  const updateCode = useCallback(async () => {
    try {
      const newCode = await generateTotp(account.config);
      setCode(newCode);
    } catch (err) {
      console.error('Failed to generate TOTP:', err);
      setCode('ERROR');
    }
  }, [account.config]);

  useEffect(() => {
    let lastCounter = getCurrentCounter(period);

    // Generate initial code
    updateCode();
    setRemaining(getRemainingSeconds(period));

    // Update remaining time every 100ms for smooth progress bar
    const timeInterval = setInterval(() => {
      const newRemaining = getRemainingSeconds(period);
      const currentCounter = getCurrentCounter(period);

      setRemaining(newRemaining);

      if (currentCounter !== lastCounter) {
        lastCounter = currentCounter;
        updateCode();
      }
    }, 100);

    return () => clearInterval(timeInterval);
  }, [period, updateCode]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const progress = getProgressPercent(period);
  const isWarning = remaining <= 10 && remaining > 5;
  const isCritical = remaining <= 5;

  return (
    <div className="totp-card">
      <div className="account-info">
        <div className="account-icon">
          {account.issuer.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="account-name">{account.account}</div>
          <div className="account-issuer">{account.issuer}</div>
        </div>
      </div>

      <div className="otp-display">
        <div
          className={`otp-code ${copied ? 'copied' : ''}`}
          onClick={copyToClipboard}
          title="Click to copy"
        >
          {copied ? '已复制' : code}
        </div>

        <div className="progress-bar">
          <div
            className={`progress-fill ${isWarning ? 'warning' : ''} ${isCritical ? 'critical' : ''}`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="time-left">
          <span>{remaining} 秒后刷新</span>
          <span>{period}秒周期</span>
        </div>
      </div>

      <div className="card-actions">
        <button className="delete-btn" onClick={() => onDelete(account.id)}>
          删除
        </button>
      </div>
    </div>
  );
}