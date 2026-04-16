import { useEffect, useMemo, useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { readFile } from '@tauri-apps/plugin-fs';
import { CodeVisibility, parseOtpAuthUri, TotpAccount } from '../utils/uriParser';
import { parseQrFromFile } from '../utils/qrParser';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (account: TotpAccount) => void;
  editAccount?: TotpAccount | null;
  onSaveEdit?: (account: TotpAccount) => void;
}

function buildUpdatedAccount(baseAccount: TotpAccount, issuer: string, codeVisibility: CodeVisibility): TotpAccount {
  const trimmedIssuer = issuer.trim();

  return {
    ...baseAccount,
    issuer: trimmedIssuer,
    codeVisibility,
  };
}

export function AddAccountModal({ isOpen, onClose, onAdd, editAccount, onSaveEdit }: AddAccountModalProps) {
  const [uri, setUri] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [inputMode, setInputMode] = useState<'uri' | 'qr'>('uri');
  const [issuer, setIssuer] = useState<string>('');
  const [codeVisibility, setCodeVisibility] = useState<CodeVisibility>('inherit');

  const isEditMode = Boolean(editAccount);
  const canSubmit = useMemo(() => {
    if (isEditMode) {
      return !isSubmitting;
    }

    return uri.trim().length > 0 && !isSubmitting;
  }, [isEditMode, isSubmitting, uri]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (editAccount) {
      setIssuer(editAccount.issuer);
      setCodeVisibility(editAccount.codeVisibility ?? 'inherit');
      setInputMode('uri');
      setUri(editAccount.uri);
      setError('');
      return;
    }

    setIssuer('');
    setCodeVisibility('inherit');
    setUri('');
    setError('');
    setInputMode('uri');
  }, [editAccount, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (editAccount) {
        const updatedAccount = buildUpdatedAccount(editAccount, issuer, codeVisibility);
        onSaveEdit?.(updatedAccount);
        onClose();
        return;
      }

      const parsedAccount = parseOtpAuthUri(uri);
      const account = buildUpdatedAccount(parsedAccount, issuer || parsedAccount.issuer, codeVisibility);
      onAdd(account);
      setUri('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '解析失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImportQrImage = async () => {
    setError('');
    setIsSubmitting(true);

    try {
      const selected = await open({
        multiple: false,
        directory: false,
        filters: [
          {
            name: 'Images',
            extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp']
          }
        ]
      });

      if (!selected || Array.isArray(selected)) {
        setIsSubmitting(false);
        return;
      }

      const bytes = await readFile(selected as string);
      const blob = new Blob([bytes], { type: 'image/png' });
      const file = new File([blob], 'qr-image.png', { type: 'image/png' });

      const parsedAccount = await parseQrFromFile(file);
      const account = buildUpdatedAccount(parsedAccount, parsedAccount.issuer, codeVisibility);
      onAdd(account);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '导入失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setUri('');
    setError('');
    setInputMode('uri');
    setIssuer('');
    setCodeVisibility('inherit');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditMode ? '编辑 TOTP 账号' : '添加 TOTP 账号'}</h2>
          <button className="close-btn" onClick={handleClose}>
            ×
          </button>
        </div>

        {!isEditMode && (
          <div className="mode-selector">
            <button
              className={`mode-btn ${inputMode === 'uri' ? 'active' : ''}`}
              onClick={() => setInputMode('uri')}
              type="button"
            >
              URI 输入
            </button>
            <button
              className={`mode-btn ${inputMode === 'qr' ? 'active' : ''}`}
              onClick={() => setInputMode('qr')}
              type="button"
            >
              扫描二维码
            </button>
          </div>
        )}

        {isEditMode || inputMode === 'uri' ? (
          <form onSubmit={handleSubmit}>
            {!isEditMode && (
              <div className="form-group">
                <label>otpauth:// URI</label>
                <textarea
                  value={uri}
                  onChange={(e) => {
                    const nextUri = e.target.value;
                    setUri(nextUri);

                    try {
                      const parsed = parseOtpAuthUri(nextUri);
                      setIssuer(parsed.issuer);
                    } catch {
                      // Ignore parse errors while user is typing.
                    }
                  }}
                  placeholder="otpauth://totp/issuer:account?secret=..."
                  rows={3}
                  autoFocus
                />
              </div>
            )}

            <div className="form-group">
              <label>Issuer 名称</label>
              <input
                value={issuer}
                onChange={(e) => setIssuer(e.target.value)}
                placeholder="例如 GitHub / Google / AWS"
                autoFocus={isEditMode}
              />
            </div>

            <div className="form-group">
              <label>验证码显示</label>
              <select
                className="form-select"
                value={codeVisibility}
                onChange={(e) => setCodeVisibility(e.target.value as CodeVisibility)}
              >
                <option value="inherit">跟随全局设置</option>
                <option value="hidden">始终隐藏</option>
                <option value="visible">始终显示</option>
              </select>
            </div>

            {error && <div className="error-msg">{error}</div>}

            <button
              type="submit"
              className="submit-btn"
              disabled={!canSubmit}
            >
              {isSubmitting ? (isEditMode ? '保存中...' : '添加中...') : (isEditMode ? '保存修改' : '添加账号')}
            </button>

            {!isEditMode && (
              <div style={{ marginTop: 16, fontSize: 12, color: '#666' }}>
                <p>提示：直接粘贴从认证服务获取的 otpauth:// 链接即可</p>
              </div>
            )}
          </form>
        ) : (
          <div className="qr-import-section">
            <div className="qr-import-box">
              <div className="qr-icon">📷</div>
              <p>选择包含 TOTP 二维码的图片文件</p>
              <div className="form-group compact">
                <label>验证码显示</label>
                <select
                  className="form-select"
                  value={codeVisibility}
                  onChange={(e) => setCodeVisibility(e.target.value as CodeVisibility)}
                >
                  <option value="inherit">跟随全局设置</option>
                  <option value="hidden">始终隐藏</option>
                  <option value="visible">始终显示</option>
                </select>
              </div>
              <button
                type="button"
                className="import-btn"
                onClick={handleImportQrImage}
                disabled={isSubmitting}
              >
                {isSubmitting ? '处理中...' : '选择图片文件'}
              </button>
            </div>

            {error && <div className="error-msg">{error}</div>}

            <div style={{ marginTop: 16, fontSize: 12, color: '#666' }}>
              <p>支持的格式：PNG、JPG、JPEG、WEBP、GIF、BMP</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
