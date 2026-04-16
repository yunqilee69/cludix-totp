import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { TotpCard } from './components/TotpCard';
import { AddAccountModal } from './components/AddAccountModal';
import { TotpAccount } from './utils/uriParser';

interface AppSettings {
  hideCodesOnLaunch: boolean;
}

interface AppConfig {
  accounts: TotpAccount[];
  settings?: Partial<AppSettings>;
}

const defaultSettings: AppSettings = {
  hideCodesOnLaunch: false,
};

function normalizeConfig(config: AppConfig): { accounts: TotpAccount[]; settings: AppSettings } {
  return {
    accounts: config.accounts || [],
    settings: {
      ...defaultSettings,
      ...config.settings,
    },
  };
}

function App() {
  const [accounts, setAccounts] = useState<TotpAccount[]>([]);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingAccount, setEditingAccount] = useState<TotpAccount | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const rawConfig = await invoke<AppConfig>('get_config');
      const config = normalizeConfig(rawConfig);
      setAccounts(config.accounts);
      setSettings(config.settings);
    } catch (err) {
      console.error('Failed to load config:', err);
      setAccounts([]);
      setSettings(defaultSettings);
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async (newAccounts: TotpAccount[], newSettings: AppSettings = settings) => {
    try {
      await invoke('save_config', {
        config: {
          accounts: newAccounts,
          settings: newSettings,
        }
      });
    } catch (err) {
      console.error('Failed to save config:', err);
    }
  };

  const handleAddAccount = async (account: TotpAccount) => {
    const newAccounts = [...accounts, account];
    setAccounts(newAccounts);
    await saveConfig(newAccounts, settings);
  };

  const handleDeleteAccount = async (id: string) => {
    const newAccounts = accounts.filter((a) => a.id !== id);
    setAccounts(newAccounts);
    await saveConfig(newAccounts, settings);
  };

  const handleUpdateAccount = async (updatedAccount: TotpAccount) => {
    const newAccounts = accounts.map((account) => (
      account.id === updatedAccount.id ? updatedAccount : account
    ));
    setAccounts(newAccounts);
    setEditingAccount(null);
    await saveConfig(newAccounts, settings);
  };

  const handleToggleDefaultHidden = async () => {
    const newSettings = {
      ...settings,
      hideCodesOnLaunch: !settings.hideCodesOnLaunch,
    };
    setSettings(newSettings);
    await saveConfig(accounts, newSettings);
  };

  const openEditModal = (account: TotpAccount) => {
    setEditingAccount(account);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAccount(null);
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
        <div>
          <h1>Cludix TOTP</h1>
        </div>
        <div className="header-actions">
          <label className="settings-toggle">
            <input
              type="checkbox"
              checked={settings.hideCodesOnLaunch}
              onChange={handleToggleDefaultHidden}
            />
            <span>打开应用时默认隐藏验证码</span>
          </label>
          <button className="add-btn" onClick={() => setIsModalOpen(true)}>
            + 添加账号
          </button>
        </div>
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
              hideCodesOnLaunch={settings.hideCodesOnLaunch}
              onDelete={handleDeleteAccount}
              onEdit={openEditModal}
            />
          ))}
        </div>
      )}

      <AddAccountModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onAdd={handleAddAccount}
        editAccount={editingAccount}
        onSaveEdit={handleUpdateAccount}
      />
    </div>
  );
}

export default App;
