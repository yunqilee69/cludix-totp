import { useState } from 'react';
import { parseOtpAuthUri, TotpAccount } from '../utils/uriParser';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (account: TotpAccount) => void;
}

export function AddAccountModal({ isOpen, onClose, onAdd }: AddAccountModalProps) {
  const [uri, setUri] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Parse and validate URI
      const account = parseOtpAuthUri(uri);
      onAdd(account);
      setUri('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '解析失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setUri('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>添加 TOTP 账号</h2>
          <button className="close-btn" onClick={handleClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>otpauth:// URI</label>
            <textarea
              value={uri}
              onChange={(e) => setUri(e.target.value)}
              placeholder="otpauth://totp/issuer:account?secret=..."
              rows={3}
              autoFocus
            />
          </div>

          {error && <div className="error-msg">{error}</div>}

          <button
            type="submit"
            className="submit-btn"
            disabled={!uri.trim() || isSubmitting}
          >
            {isSubmitting ? '添加中...' : '添加账号'}
          </button>
        </form>

        <div style={{ marginTop: 16, fontSize: 12, color: '#666' }}>
          <p>提示：直接粘贴从认证服务获取的 otpauth:// 链接即可</p>
        </div>
      </div>
    </div>
  );
}