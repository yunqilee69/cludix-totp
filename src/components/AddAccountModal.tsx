import { useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { readFile } from '@tauri-apps/plugin-fs';
import { parseOtpAuthUri, TotpAccount } from '../utils/uriParser';
import { parseQrFromFile } from '../utils/qrParser';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (account: TotpAccount) => void;
}

export function AddAccountModal({ isOpen, onClose, onAdd }: AddAccountModalProps) {
  const [uri, setUri] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [inputMode, setInputMode] = useState<'uri' | 'qr'>('uri');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
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

  const handleImportQrImage = async () => {
    setError('');
    setIsSubmitting(true);

    try {
      // Open file dialog for image selection
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

      // Read file content
      const bytes = await readFile(selected as string);
      
      // Create File object from bytes
      const blob = new Blob([bytes], { type: 'image/png' });
      const file = new File([blob], 'qr-image.png', { type: 'image/png' });

      // Parse QR code
      const account = await parseQrFromFile(file);
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

        {/* Mode selector */}
        <div className="mode-selector">
          <button 
            className={`mode-btn ${inputMode === 'uri' ? 'active' : ''}`}
            onClick={() => setInputMode('uri')}
          >
            URI 输入
          </button>
          <button 
            className={`mode-btn ${inputMode === 'qr' ? 'active' : ''}`}
            onClick={() => setInputMode('qr')}
          >
            扫描二维码
          </button>
        </div>

        {inputMode === 'uri' ? (
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

            <div style={{ marginTop: 16, fontSize: 12, color: '#666' }}>
              <p>提示：直接粘贴从认证服务获取的 otpauth:// 链接即可</p>
            </div>
          </form>
        ) : (
          <div className="qr-import-section">
            <div className="qr-import-box">
              <div className="qr-icon">📷</div>
              <p>选择包含 TOTP 二维码的图片文件</p>
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