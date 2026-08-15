# 贡献指南

感谢每位参与贡献的开发者！

## 快速开发

### 1. 环境准备

- [mise](https://mise.jdx.dev/getting-started.html)
- [Tauri2](https://tauri.app/)
- [Node.js](https://nodejs.org/) (版本 >= 24)

### 2. 克隆项目

```bash
git clone https://github.com/shichen437/Quinco.git
cd Quinco
```

### 3. 项目启动

```bash

# 统一开发环境（需要安装 mise,可选）
mise trust
mise install

# 安装前端依赖
npm install

# 启动项目 (启动时自动安装 Rust 依赖)
mise run dev

```

## PR 规范

- 提交规范：[约定式提交](https://www.conventionalcommits.org/zh-hans/v1.0.0/)
- 提交数：同一 PR 建议不超过 2 个提交，超过请 squash
- 变更范围：尽量保持 PR 专注于单一主题；避免“大杂烩”式改动
- 必要说明：列出主要变更点、兼容性影响、迁移步骤
- 性能与安全：无明显性能回退与安全隐患
