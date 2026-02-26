---
name: archive-and-doc
description: Archive a completed change and automatically update project documentation in docs/. Use when the user wants to finalize a change and ensure docs stay in sync.
license: MIT
metadata:
  author: feng3d
  version: "1.0"
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
```

目标名：`YYYY-MM-DD-<change-name>`

**检查目标是否已存在**：
- 已存在：报错，建议重命名
- 不存在：移动目录

```bash
mv openspec/changes/<name> openspec/changes/archive/YYYY-MM-DD-<name>
```

### 步骤 6：显示归档摘要

显示：变更名、schema、归档位置、specs 同步状态、警告信息。

---

## 第二部分：更新文档（步骤 7-10）

### 步骤 7：读取已归档的 artifacts

读取归档目录中的关键文件：

```
openspec/changes/archive/YYYY-MM-DD-<name>/proposal.md
openspec/changes/archive/YYYY-MM-DD-<name>/design.md
openspec/changes/archive/YYYY-MM-DD-<name>/tasks.md
```

如有 delta specs 也一并读取。

### 步骤 8：确定影响的文档区域

分析 artifacts 内容，确定需要更新哪些 `docs/` 文件。参考映射：

| 变更涉及的领域 | 目标文档 |
|---------------|---------|
| 协议、消息格式、帧格式、魔数 | `docs/protocol.md` |
| 服务端、CLI（cts）、会话管理 | `docs/server.md` |
| 客户端、CLI（ctc）、IPC、单实例 | `docs/client.md` |
| 反向代理、端口注册、REGISTER | `docs/reverse-proxy.md` |
| 正向穿透、客户端列表、P2P | `docs/forward-proxy.md` |
| 管理页面、admin-ui、Web UI | `docs/admin-ui.md` |
| 认证、Token、TLS、安全 | `docs/auth.md` |
| 部署、安装、npx、Docker | `docs/deployment.md` |
| 架构、三通道、Monorepo | `docs/architecture.md` |

不要机械套用此表，根据 proposal 和 design 的实际内容判断。

### 步骤 9：创建/更新文档

**9a. 如果 `docs/` 目录不存在（首次初始化）**：

**重要：首次初始化时，必须通读整个项目源码，为所有功能区域生成完整的文档。**

创建基础结构：
```bash
mkdir -p docs
```

**使用 Task tool（subagent_type: "Explore"）深度扫描整个项目源码**，获取每个功能模块的完整信息：
- `packages/shared/src/` — 协议定义、消息类型、二进制帧格式
- `packages/server/src/` — 服务端实现、会话管理、协议分发、CLI
- `packages/client/src/` — 客户端实现、代理管理、IPC、配置加载、CLI
- `packages/server/admin-ui/` 和 `packages/client/admin-ui/` — 管理界面
- `test/` 和 `packages/*/test/` — 测试覆盖的功能场景

基于源码分析，为每个功能区域创建完整文档：

| 文档文件 | 内容要求 |
|---------|---------|
| `docs/architecture.md` | 系统架构概述、三通道设计、Monorepo 结构、模块依赖关系 |
| `docs/protocol.md` | 完整协议规格：WebSocket 消息类型、TCP 帧格式、UDP 帧格式、魔数检测、错误码 |
| `docs/server.md` | 服务端功能：CLI 命令、配置项、TLS、会话管理、端口分配、守护进程 |
| `docs/client.md` | 客户端功能：CLI 命令、配置加载、单实例 IPC、重连策略、守护进程 |
| `docs/reverse-proxy.md` | 反向代理机制：端口注册流程、连接转发、协议自动检测、数据通道认证 |
| `docs/forward-proxy.md` | 正向穿透机制：客户端发现、连接建立、P2P 转发 |
| `docs/admin-ui.md` | 管理界面：服务端面板功能、客户端面板功能、API 接口 |
| `docs/auth.md` | 认证与安全：Token 认证流程、TLS 配置、错误处理 |
| `docs/deployment.md` | 部署指南：npm 安装、CLI 使用、生产环境配置 |

每个文档必须包含：
- **功能描述**：这个模块/功能做什么
- **实现细节**：关键代码路径、核心类/函数、数据流
- **配置说明**：相关配置项、默认值、可选参数
- **代码路径**：涉及的源文件及其职责（如 `packages/server/src/server.ts` — ForwardServer 核心类）

创建 `docs/README.md`（包含所有文档的索引）和 `docs/changelog.md`（空的变更记录模板）。

每个文档末尾标注来源：
```markdown
---
*最后更新: YYYY-MM-DD（来自变更: <change-name>）*
```

**9b. 如果 `docs/` 已存在（增量更新）**：

对每个受影响的文档文件：

- **文件不存在**：基于 artifacts 内容创建新文档，末尾标注来源。

- **文件已存在**：读取现有内容，仅更新与本次变更相关的部分，保留其他内容不变。更新末尾的来源标注。

**9c. 追加 `docs/changelog.md`**：

在文件顶部（标题之后）插入新条目：

```markdown
## YYYY-MM-DD: <change-name>

**类型**: <新功能 | 增强 | 修复 | 重构>
**影响范围**: <受影响的文档列表>
**概要**: <来自 proposal 的 1-2 句总结>
**详情**: 参见 `openspec/changes/archive/YYYY-MM-DD-<name>/`
```

**9d. 更新 `docs/README.md`**：

如果创建了新的文档文件，将其添加到 README 的目录表中。

### 步骤 10：显示合并摘要

```
## 归档并更新文档完成

**变更:** <change-name>
**Schema:** <schema-name>
**归档位置:** openspec/changes/archive/YYYY-MM-DD-<name>/
**Specs:** ✓ 已同步到主 specs

### 文档更新
- ✓ 更新 docs/protocol.md（更新了 XXX 章节）
- ✓ 创建 docs/forward-proxy.md（新文档）
- ✓ 更新 docs/changelog.md（追加变更记录）
- ✓ 更新 docs/README.md（新增文档链接）
```

---

## Guardrails

- **不覆盖用户手写内容**：只更新与归档变更直接相关的部分
- **先展示再执行**：在写入文档之前，展示计划更新的文件列表
- **中文输出**：所有文档使用简体中文，保留 API、WebSocket、TCP、UDP 等技术术语为英文
- **按需创建**：`docs/` 和各文档文件首次涉及时才创建，不预生成空文档
- **不生成推测性内容**：只记录变更实际涉及的功能，不填充无关内容
- **幂等 changelog**：不重复添加相同变更的记录
- 始终提示变更选择（如果未提供）
- 使用 `openspec status --json` 检查完成状态
- 不因警告阻塞归档，仅提示并确认
- 移动目录时保留 `.openspec.yaml`
