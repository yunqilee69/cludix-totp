import { useState, useEffect, useCallback } from 'react';
import { TotpAccount } from '../utils/uriParser';
import { generateTotp, getRemainingSeconds, getProgressPercent } from '../utils/totp';

interface TotpCardProps {
  account: TotpAccount;
  hideCodesOnLaunch: boolean;
  onDelete: (id: string) => void;
  onEdit: (account: TotpAccount) => void;
}

function getCurrentCounter(period: number): number {
  return Math.floor(Date.now() / 1000 / period);
}

function shouldHideCode(account: TotpAccount, hideCodesOnLaunch: boolean): boolean {
  if (account.codeVisibility === 'hidden') {
    return true;
  }

  if (account.codeVisibility === 'visible') {
    return false;
  }

  return hideCodesOnLaunch;
}

export function TotpCard({ account, hideCodesOnLaunch, onDelete, onEdit }: TotpCardProps) {
  const [code, setCode] = useState<string>('------');
  const [remaining, setRemaining] = useState<number>(30);
  const [copied, setCopied] = useState<boolean>(false);
  const [isCodeVisible, setIsCodeVisible] = useState<boolean>(() => !shouldHideCode(account, hideCodesOnLaunch));
  const [isDeleteConfirming, setIsDeleteConfirming] = useState<boolean>(false);

  const period = account.config.period;
  const isHidden = !isCodeVisible;

  useEffect(() => {
    setIsCodeVisible(!shouldHideCode(account, hideCodesOnLaunch));
  }, [account, hideCodesOnLaunch]);

  useEffect(() => {
    if (!isDeleteConfirming) {
      return;
    }

    const timer = window.setTimeout(() => setIsDeleteConfirming(false), 4000);
    return () => window.clearTimeout(timer);
  }, [isDeleteConfirming]);

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

    updateCode();
    setRemaining(getRemainingSeconds(period));

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
    if (isHidden) {
      setIsCodeVisible(true);
      return;
    }

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
  const issuerInitial = (account.issuer || account.account).charAt(0).toUpperCase() || '#';
  return (
    <div className="totp-card">
      <div className="account-info">
        <div className="account-icon">
          {issuerInitial}
        </div>
        <div className="account-meta">
          <div className="account-issuer">{account.issuer || '未命名 issuer'}</div>
          <div className="account-name">{account.account}</div>
        </div>
      </div>

      <div className="otp-display">
        <div
          className={`otp-code ${copied ? 'copied' : ''} ${isHidden ? 'masked' : ''}`}
          onClick={copyToClipboard}
          title={isHidden ? '点击显示验证码' : '点击复制验证码'}
        >
          {copied ? '已复制' : isHidden ? '••••••' : code}
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
        <button className="secondary-btn" onClick={() => onEdit(account)}>
          编辑
        </button>
        {isDeleteConfirming ? (
          <>
            <button className="cancel-btn" onClick={() => setIsDeleteConfirming(false)}>
              取消
            </button>
            <button className="delete-btn confirm" onClick={() => onDelete(account.id)}>
              确认删除
            </button>
          </>
        ) : (
          <button className="delete-btn" onClick={() => setIsDeleteConfirming(true)}>
            删除
          </button>
        )}
      </div>
    </div>
  );
}
