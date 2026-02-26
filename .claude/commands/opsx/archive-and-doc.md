---
name: "OPSX: Archive and Doc"
description: Archive a completed change and update project documentation
category: Workflow
tags: [workflow, archive, documentation, experimental]
---

归档已完成的变更，并自动更新 `docs/` 中的项目文档。

**Input**: 可选指定变更名称（如 `/opsx:archive-and-doc add-auth`）。如果省略，尝试从上下文推断；如果模糊，必须提示用户选择。

---

## 第一部分：归档变更（步骤 1-6）

### 步骤 1：选择变更

如果未提供变更名称：
- 从上下文推断用户提到的变更
- 如果只有一个活跃变更，自动选择
- 如果模糊，运行 `openspec list --json` 获取变更列表，使用 **AskUserQuestion tool** 让用户选择

始终宣布："使用变更: <name>"。

**重要**: 不要猜测或自动选择，始终让用户确认。

### 步骤 2：检查 artifact 完成状态

```bash
openspec status --change "<name>" --json
```

解析 JSON 获取：
- `schemaName`: 使用的工作流
- `artifacts`: artifact 列表及其状态

**如果有未完成的 artifact**：显示警告，使用 **AskUserQuestion tool** 确认是否继续。

### 步骤 3：检查任务完成状态

读取 tasks 文件（通常是 `tasks.md`），统计 `- [ ]`（未完成）和 `- [x]`（已完成）。

**如果有未完成任务**：显示警告，使用 **AskUserQuestion tool** 确认。

**如果没有 tasks 文件**：跳过此步骤。

### 步骤 4：评估 delta spec 同步状态

检查 `openspec/changes/<name>/specs/` 是否有 delta specs。如果没有，跳过。

**如果有 delta specs**：
- 与 `openspec/specs/<capability>/spec.md` 比较
- 显示摘要，提供选项："立即同步（推荐）"或"不同步直接归档"
- 如果用户选择同步，使用 Task tool 调用 `openspec-sync-specs`

### 步骤 5：执行归档

```bash
mkdir -p openspec/changes/archive
mv openspec/changes/<name> openspec/changes/archive/YYYY-MM-DD-<name>
```

检查目标是否已存在，已存在则报错。

### 步骤 6：显示归档摘要

显示：变更名、schema、归档位置、specs 同步状态、警告信息。

---

## 第二部分：更新文档（步骤 7-10）

### 步骤 7：读取已归档的 artifacts

读取 `openspec/changes/archive/YYYY-MM-DD-<name>/` 中的 proposal.md、design.md、tasks.md。

### 步骤 8：确定影响的文档区域

分析 artifacts 内容，判断需要更新哪些 `docs/` 文件。参考映射：

| 变更涉及的领域 | 目标文档 |
|---------------|---------|
| 协议、消息格式、帧格式 | `docs/protocol.md` |
| 服务端、CLI（cts）、会话管理 | `docs/server.md` |
| 客户端、CLI（ctc）、IPC | `docs/client.md` |
| 反向代理、端口注册 | `docs/reverse-proxy.md` |
| 正向穿透、客户端列表 | `docs/forward-proxy.md` |
| 管理页面、admin-ui | `docs/admin-ui.md` |
| 认证、Token、TLS | `docs/auth.md` |
| 部署、安装 | `docs/deployment.md` |
| 架构、三通道 | `docs/architecture.md` |

### 步骤 9：创建/更新文档

**如果 `docs/` 不存在**：首次初始化时，通读整个项目源码，为每个功能区域生成完整的文档（包含功能描述、实现细节、配置说明、代码路径）。创建 `docs/README.md` 索引和 `docs/changelog.md`。

**如果 `docs/` 已存在**：仅更新与本次变更相关的文档部分。

追加 `docs/changelog.md` 条目，更新 `docs/README.md` 索引。

### 步骤 10：显示合并摘要

```
## 归档并更新文档完成

**变更:** <change-name>
**Schema:** <schema-name>
**归档位置:** openspec/changes/archive/YYYY-MM-DD-<name>/

### 文档更新
- ✓ 更新/创建的文档列表
- ✓ 更新 docs/changelog.md
```

---

## Guardrails

- 不覆盖用户手写内容，只更新与变更相关的部分
- 先展示计划更新的文件列表，再执行
- 中文输出，技术术语保持英文
- 首次初始化 `docs/` 时需通读源码生成完整文档
- 不生成推测性内容
- 幂等 changelog，不重复添加
