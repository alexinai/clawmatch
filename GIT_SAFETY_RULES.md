# Git 操作安全准则
## Git Safety Guidelines - MANDATORY RULES

---

## ⚠️ 强制规则 / MANDATORY RULES

### 规则 1：敏感文件提交前必须确认

**在执行 `git add` 或 `git commit` 包含以下类型文件时，必须先获得用户明确确认：**

#### 📋 需要确认的文件类型清单

##### 1. **商业敏感文件**
- [ ] 合同文件（*.md, *.pdf, *.docx 中包含合同内容的）
- [ ] 报价单、发票
- [ ] 财务数据
- [ ] 商业计划书
- [ ] 客户信息列表
- [ ] 供应商信息

##### 2. **密钥和凭证**
- [ ] API Keys（任何包含 `key`, `token`, `secret` 的文件）
- [ ] 密码文件
- [ ] 证书文件（.pem, .key, .crt）
- [ ] SSH 密钥
- [ ] 数据库连接字符串

##### 3. **个人隐私信息**
- [ ] 身份证、护照扫描件
- [ ] 银行账户信息
- [ ] 个人联系方式
- [ ] 员工信息

##### 4. **特定目录**
- [ ] `docs/` 目录（可能包含合同）
- [ ] `contracts/` 目录
- [ ] `private/` 目录
- [ ] `confidential/` 目录
- [ ] `.env` 文件
- [ ] `secrets/` 目录

---

## 🚨 操作流程 / WORKFLOW

### 提交文件前的检查清单：

```
BEFORE running `git add` or `git commit`:

Step 1: 检查文件类型
  └─ 是否包含上述敏感文件？
      ├─ 是 → 继续 Step 2
      └─ 否 → 可以安全提交

Step 2: 询问用户确认
  └─ "检测到敏感文件 [文件名]，是否要提交到 Git？"
      ├─ 用户回答"是" → 继续提交
      ├─ 用户回答"否" → 撤销操作
      └─ 用户未回答 → 暂停操作，等待确认

Step 3: 提交前再次提醒
  └─ "即将提交到 [远程仓库]，确认继续？"
```

---

## 🛡️ 自动检测规则 / AUTO-DETECTION RULES

### 文件路径模式匹配

**如果文件路径匹配以下模式，必须确认：**

```regex
# 目录模式
^docs/.*\.(md|pdf|docx|xlsx)$
^contracts/
^private/
^confidential/
^secrets/

# 文件名模式
.*contract.*\.(md|pdf|docx)$
.*agreement.*\.(md|pdf|docx)$
.*invoice.*
.*confidential.*
.*secret.*
.*password.*
.*credential.*

# 特定文件
^\.env$
^\.env\..*$
^config.*secret.*$
```

### 内容关键词检测

**如果文件内容包含以下关键词，必须确认：**

```
# 合同相关
"合同编号", "Contract No.", "甲方", "乙方", "Party A", "Party B"
"签署", "Signature", "盖章", "Company Seal"

# 金融信息
"Bank Account", "银行账户", "Account Number", "SWIFT"
"US$", "USD", "$$$", "总金额"

# 个人信息
"身份证", "ID Card", "Passport", "护照"
"电话", "Phone:", "邮箱", "Email:"

# 密钥
"API_KEY", "SECRET", "TOKEN", "PASSWORD"
"sk-", "pk-", "Bearer "
```

---

## 📋 标准响应模板 / RESPONSE TEMPLATES

### 检测到敏感文件时：

```
⚠️ 安全提醒 / Security Warning

检测到以下文件可能包含敏感信息：

文件清单：
1. docs/香港数字广告代理服务合同-HK-Digital-Ad-Agency-Contract.md
   - 类型：商业合同
   - 内容：包含公司名称、金额、银行账户等敏感信息

2. docs/合同签署检查清单-Nova-Crystal.md
   - 类型：商业文档
   - 内容：公司信息

这些文件即将提交到公开的 GitHub 仓库。

⚠️ 风险：
- 商业信息泄露
- 财务数据暴露
- 可能违反保密协议

建议操作：
1. 将这些文件添加到 .gitignore
2. 将文件移动到本地私有目录
3. 如需共享，使用私有仓库或加密方式

是否继续提交？请明确回答：
- 回答"是"或"继续" → 将提交这些文件
- 回答"否"或"取消" → 撤销操作
- 回答"添加到 gitignore" → 自动配置忽略规则
```

---

## ✅ 安全提交流程 / SAFE COMMIT WORKFLOW

### 正确的操作流程：

```bash
# Step 1: 检查要提交的文件
git status

# Step 2: AI 自动检测敏感文件
# → 如果发现，询问用户

# Step 3: 用户确认后再执行
git add [经确认的文件]
git commit -m "message"

# Step 4: 推送前再次确认
# → 特别是首次推送或推送到公开仓库
git push origin main
```

---

## 🚫 禁止的操作 / FORBIDDEN OPERATIONS

### 以下操作绝对禁止（除非用户明确要求）：

```bash
# ❌ 禁止：直接 git add 整个目录而不检查
git add .
git add *
git add -A

# ✅ 允许：逐个文件添加（经过检查）
git add index.html
git add README.md
```

### 例外情况：

**仅在以下情况可以使用 `git add .`：**
1. 用户明确说"提交所有文件"
2. 已经检查过所有文件都安全
3. 没有敏感文件存在

---

## 📝 .gitignore 强制规则 / MANDATORY .gitignore RULES

### 任何新项目必须包含以下 .gitignore 规则：

```gitignore
# 敏感文件和目录（强制）
docs/
contracts/
private/
confidential/
secrets/

# 环境变量
.env
.env.*
!.env.example

# 密钥和证书
*.key
*.pem
*.crt
*.p12
*.pfx

# 配置文件（可能包含密钥）
config/secrets.json
config/credentials.json

# 临时文件
*.tmp
*.log
.DS_Store

# PDF 文件（可能是合同）
*.pdf

# Office 文件（可能是商业文档）
*.docx
*.xlsx
```

---

## 🔄 紧急撤销流程 / EMERGENCY ROLLBACK

### 如果不小心提交了敏感文件：

```bash
# 1. 立即停止（如果还没 push）
git reset HEAD~1  # 撤销最后一次 commit

# 2. 如果已经 push 到远程
# ⚠️ 警告：以下操作会改写历史，需谨慎
git reset --hard HEAD~1
git push --force origin main

# 3. 更安全的方法：创建新 commit 删除文件
git rm --cached [敏感文件]
git commit -m "Remove sensitive file"
git push origin main

# 4. 立即通知用户文件已泄露
```

---

## 📞 特殊场景处理 / SPECIAL SCENARIOS

### 场景 1：用户说"提交所有更改"

```
AI Response:
"我检测到以下文件可能包含敏感信息：
- [文件列表]

是否排除这些文件，只提交其他文件？"

选项：
A. 排除敏感文件，提交其他文件
B. 全部提交（需再次确认）
C. 取消操作
```

### 场景 2：用户说"把代码推送到 GitHub"

```
AI Response:
"准备推送到 GitHub。检查清单：
✅ 代码文件：安全
⚠️ 敏感文件：[列表]

建议操作：
1. 仅推送代码文件
2. 敏感文件添加到 .gitignore

是否继续？"
```

### 场景 3：用户创建了新的敏感文件

```
AI Response:
"检测到新文件 [文件名] 可能包含敏感信息。

建议操作：
1. 立即添加到 .gitignore
2. 移动到非 Git 管理的目录

是否自动配置？"
```

---

## ✅ 检查清单 / CHECKLIST

### 每次 Git 操作前必须确认：

- [ ] 没有 API Keys
- [ ] 没有密码
- [ ] 没有合同文件
- [ ] 没有财务数据
- [ ] 没有个人身份信息
- [ ] 没有客户信息
- [ ] 没有银行账户
- [ ] .gitignore 已正确配置
- [ ] 用户已明确授权提交

---

## 🎯 实施要求 / IMPLEMENTATION REQUIREMENTS

### AI 助手必须：

1. **主动检测**：在执行 git add/commit 前自动检查
2. **明确提醒**：使用清晰的警告消息
3. **等待确认**：不在用户明确同意前执行
4. **提供建议**：给出安全的替代方案
5. **记录决策**：如果用户坚持提交敏感文件，记录原因

### 违反规则的后果：

- ❌ 立即停止操作
- ❌ 撤销已执行的不安全操作
- ❌ 向用户道歉并说明风险

---

## 📚 参考案例 / REFERENCE CASES

### 案例 1：Nova Crystal Limited 合同事件

**时间**：2026-02-25

**事件**：
- AI 差点将包含公司信息、金额、地址的合同文件提交到公开 GitHub 仓库
- 用户及时阻止
- AI 立即撤销操作并添加 .gitignore 规则

**教训**：
1. docs/ 目录默认应被忽略
2. 任何包含"合同"、"Contract"、"Agreement"的文件必须确认
3. 用户说"不"时，立即停止并道歉

**正确做法**：
1. 检测到合同文件
2. 询问用户："这些合同文件要提交到 Git 吗？"
3. 等待明确回答
4. 如果"否"，添加到 .gitignore

---

## 🔐 最终原则 / FINAL PRINCIPLE

> **宁可多问一次，也不要泄露一次。**
>
> **Better to ask twice than to leak once.**

---

**创建日期**：2026-02-25
**最后更新**：2026-02-25
**强制执行**：✅ YES
**优先级**：🔴 CRITICAL
**适用范围**：所有 Git 操作

---

**此规则为强制性规则，不得违反。**
