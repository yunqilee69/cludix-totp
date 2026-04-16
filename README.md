# Cludix TOTP

基于 Tauri + React 构建的轻量级 TOTP (Time-based One-Time Password) 桌面应用，用于管理多账号的两步验证密码。

## 功能特性

- ✅ 解析标准 `otpauth://totp` URI 格式
- ✅ 实时显示 TOTP 密码，每 30 秒自动刷新
- ✅ 倒计时进度条显示剩余时间
- ✅ 支持多账号管理（添加/删除）
- ✅ 点击密码一键复制到剪贴板
- ✅ 本地 JSON 文件存储配置

## 安装与运行

### 开发环境要求

- Node.js 18+
- Rust 1.70+
- pnpm / npm

### 开发模式

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run tauri dev
```

### 构建发布版本

```bash
# 构建生产版本
npm run tauri build
```

构建产物位于 `src-tauri/target/release/bundle/` 目录：

- Windows: `nsis/` 目录下的 `.exe` 安装包

## 使用方式

### 1. 添加账号

点击右上角「添加账号」按钮，粘贴从认证服务获取的 `otpauth://totp` URI：

```
otpauth://totp/issuer:account?secret=BASE32SECRET&issuer=issuer&algorithm=SHA1&digits=6&period=30
```

示例：
```
otpauth://totp/协力数字化管理平台:yunqi.li?secret=IYS4Y4UKUKHMKJTS5N2ORYYSJWQEFAPW&issuer=协力数字化管理平台&algorithm=SHA1&digits=6&period=30
```

### 2. 查看密码

添加成功后，TOTP 卡片会实时显示 6 位验证码：
- 绿色数字：当前有效的验证码
- 进度条：显示剩余有效时间（30 秒周期）
- 点击数字可复制到剪贴板

### 3. 删除账号

点击卡片底部的「删除」按钮移除账号。

## 配置存储

账号配置存储在本地 JSON 文件中：

### 存储位置

| 系统 | 路径 |
|------|------|
| Windows | `%APPDATA%\cludix-totp\config.json` |
| macOS | `~/Library/Application Support/cludix-totp/config.json` |
| Linux | `~/.config/cludix-totp/config.json` |

### 配置文件格式

```json
{
  "accounts": [
    {
      "id": "issuer:account:XXXX",
      "issuer": "服务名称",
      "account": "账号名",
      "uri": "otpauth://totp/...",
      "config": {
        "secret": "BASE32SECRET",
        "digits": 6,
        "period": 30,
        "algorithm": "SHA1"
      }
    }
  ]
}
```

### 手动编辑配置

可直接编辑 `config.json` 文件添加账号（适用于批量导入）。

**注意**：Secret 是敏感信息，请妥善保管配置文件。

## 支持的参数

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `secret` | Base32 编码的密钥（必需） | - |
| `issuer` | 服务提供商名称 | - |
| `algorithm` | HMAC 算法：SHA1/SHA256/SHA512 | SHA1 |
| `digits` | 密码位数：6 或 8 | 6 |
| `period` | 有效周期（秒）：30 或 60 | 30 |

## 项目结构

```
cludix-totp/
├── src/                          # React 前端
│   ├── components/
│   │   ├── TotpCard.tsx          # TOTP 显示卡片
│   │   └── AddAccountModal.tsx   # 添加账号弹窗
│   ├── utils/
│   │   ├── base32.ts             # Base32 解码器
│   │   ├── totp.ts               # TOTP 核心算法 (RFC 6238)
│   │   └── uriParser.ts          # otpauth:// URI 解析器
│   ├── App.tsx                   # 主应用
│   └── App.css                   # 样式
├── src-tauri/                    # Tauri 后端
│   ├── src/
│   │   ├── lib.rs                # Rust commands (配置读写)
│   │   └── main.rs               # 入口
│   ├── capabilities/             # 权限配置
│   ├── icons/                    # 应用图标
│   ├── Cargo.toml
│   └── tauri.conf.json           # Tauri 配置
├── package.json
└── README.md
```

## 技术栈

- **前端**: React 18 + TypeScript + Vite
- **后端**: Tauri v2 + Rust
- **算法**: RFC 6238 TOTP (Web Crypto API HMAC-SHA1)
- **存储**: 本地 JSON 文件

## 安全说明

- TOTP 密钥存储在本地，不上传任何服务器
- 应用不包含网络请求功能
- 密钥仅用于本地计算验证码

## License

MIT