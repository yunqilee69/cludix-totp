import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { TotpCard } from './components/TotpCard';
import { AddAccountModal } from './components/AddAccountModal';
import { TotpAccount } from './utils/uriParser';

interface AppConfig {
  accounts: TotpAccount[];
}

function App() {
  const [accounts, setAccounts] = useState<TotpAccount[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load config on mount
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const config = await invoke<AppConfig>('get_config');
      setAccounts(config.accounts || []);
    } catch (err) {
      console.error('Failed to load config:', err);
      setAccounts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async (newAccounts: TotpAccount[]) => {
    try {
      await invoke('save_config', {
        config: { accounts: newAccounts }
      });
    } catch (err) {
      console.error('Failed to save config:', err);
    }
  };

  const handleAddAccount = async (account: TotpAccount) => {
    const newAccounts = [...accounts, account];
    setAccounts(newAccounts);
    await saveConfig(newAccounts);
  };

  const handleDeleteAccount = async (id: string) => {
    const newAccounts = accounts.filter((a) => a.id !== id);
    setAccounts(newAccounts);
    await saveConfig(newAccounts);
  };

  if (isLoading) {
    return (
      <div className="container">
        <div className="empty-state">
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <h1>Nebula TOTP</h1>
        <button className="add-btn" onClick={() => setIsModalOpen(true)}>
          + 添加账号
        </button>
      </div>

      {accounts.length === 0 ? (
        <div className="empty-state">
          <p>暂无 TOTP 账号</p>
          <p style={{ fontSize: 14 }}>点击上方「添加账号」按钮开始</p>
        </div>
      ) : (
        <div className="totp-grid">
          {accounts.map((account) => (
            <TotpCard
              key={account.id}
              account={account}
              onDelete={handleDeleteAccount}
            />
          ))}
        </div>
      )}

      <AddAccountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddAccount}
      />
    </div>
  );
}

export default App;