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

### 开发模式

```bash
npm install
npm run tauri:dev
```

### 构建桌面应用

```bash
# 构建当前平台
npm run build:current

# Windows x64
npm run build:win

# Windows ARM64
npm run build:win-arm64

# macOS Universal (Intel + Apple Silicon)
npm run build:mac

# macOS Intel
npm run build:mac-x64

# macOS Apple Silicon
npm run build:mac-arm64

# Linux x64
npm run build:linux

# Linux ARM64
npm run build:linux-arm64
```

**注意**：跨平台构建需要在对应操作系统上运行。

### 构建产物位置

| 平台 | 路径 | 格式 |
|------|------|------|
| Windows | `src-tauri/target/release/bundle/nsis/` | `.exe` 安装包 |
| macOS | `src-tauri/target/release/bundle/dmg/` | `.dmg` 安装包 |
| Linux | `src-tauri/target/release/bundle/deb/` | `.deb` 包 |
| Linux | `src-tauri/target/release/bundle/rpm/` | `.rpm` 包 |
| Linux | `src-tauri/target/release/bundle/appimage/` | `.AppImage` |

## 使用方式

### 添加账号

点击右上角「添加账号」按钮，粘贴从认证服务获取的 `otpauth://totp` URI。

**URI 格式说明**：

```
otpauth://totp/[服务商]:[账号]?secret=[密钥]&issuer=[服务商]&algorithm=SHA1&digits=6&period=30
```

**示例**（虚拟数据）：

```
otpauth://totp/ExampleCorp:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=ExampleCorp&algorithm=SHA1&digits=6&period=30
```

**参数说明**：

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `secret` | Base32 编码的密钥（必需） | - |
| `issuer` | 服务提供商名称 | - |
| `algorithm` | HMAC 算法：SHA1/SHA256/SHA512 | SHA1 |
| `digits` | 密码位数：6 或 8 | 6 |
| `period` | 有效周期（秒） | 30 |

### 查看密码

添加成功后，TOTP 卡片会：
- 实时显示 6 位验证码
- 进度条显示剩余有效时间
- 点击数字复制到剪贴板

### 删除账号

点击卡片底部的「删除」按钮移除账号。

## 配置存储

配置文件位置（所有平台统一）：

| 系统 | 路径 |
|------|------|
| Windows | `C:\Users\<用户名>\.config\cludix-totp\config.json` |
| macOS | `~/.config/cludix-totp/config.json` |
| Linux | `~/.config/cludix-totp/config.json` |

### 配置文件格式

```json
{
  "accounts": [
    {
      "id": "ExampleCorp:user@example.com:JBSW",
      "issuer": "ExampleCorp",
      "account": "user@example.com",
      "uri": "otpauth://totp/ExampleCorp:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=ExampleCorp",
      "config": {
        "secret": "JBSWY3DPEHPK3PXP",
        "digits": 6,
        "period": 30,
        "algorithm": "SHA1"
      }
    }
  ]
}
```

可直接编辑 `config.json` 批量导入账号。

**警告**：Secret 是敏感信息，请妥善保管配置文件！

## 项目结构

```
cludix-totp/
├── src/                    # React 前端
│   ├── components/         # UI 组件
│   ├── utils/              # TOTP 算法
│   └── App.tsx
├── src-tauri/              # Tauri 后端
│   ├── src/lib.rs          # 配置读写
│   └── tauri.conf.json
├── package.json
└── README.md
```

## 技术栈

- React 18 + TypeScript + Vite
- Tauri v2 + Rust
- RFC 6238 TOTP (Web Crypto API)

## 安全说明

- 密钥仅存储在本地
- 无网络请求
- 无数据上传

## License

MIT