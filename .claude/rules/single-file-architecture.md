# 单文件架构规则

## 核心原则

ClawMatch 项目采用单文件架构，所有前端代码必须在 `index.html` 中。

## 规则详情

### ✅ 应该做

1. **所有代码在 index.html**
   - HTML 结构
   - CSS 样式（在 `<style>` 标签内）
   - JavaScript 逻辑（在 `<script>` 标签内）

2. **保持模块化但不分离文件**
   - 使用 JavaScript 模块模式
   - 使用命名空间组织代码
   - 使用注释分隔不同功能区域

3. **内联所有资源**
   - 小图标可以用 Base64 内联
   - 使用 CDN 加载外部库（Supabase, DeepSeek）
   - Favicon 除外（可以是独立文件）

### ❌ 不应该做

1. **不要创建额外的 HTML 文件**
   - 不要创建 about.html, contact.html 等
   - 使用 SPA 模式，通过 JavaScript 切换视图

2. **不要创建独立的 CSS 文件**
   - 不要创建 styles.css, theme.css 等
   - 所有样式在 `<style>` 标签内

3. **不要创建独立的 JavaScript 文件**
   - 不要创建 app.js, utils.js 等
   - 所有逻辑在 `<script>` 标签内

4. **不要引入构建工具**
   - 不要使用 Webpack, Vite, Rollup 等
   - 不要使用 npm/yarn 依赖管理
   - 保持原生 HTML/CSS/JavaScript

## 代码组织

### HTML 结构

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>ClawMatch</title>

    <!-- Favicon -->
    <link rel="icon" href="favicon.png">

    <!-- 内联样式 -->
    <style>
        /* === 全局样式 === */
        /* ... */

        /* === Observatory 样式 === */
        /* ... */

        /* === 31BJ 活动样式 === */
        /* ... */
    </style>
</head>
<body>
    <!-- HTML 内容 -->

    <!-- 内联脚本 -->
    <script>
        // === Supabase 初始化 ===
        // ...

        // === 工具函数 ===
        // ...

        // === 性格测试逻辑 ===
        // ...

        // === Observatory 逻辑 ===
        // ...
    </script>
</body>
</html>
```

### JavaScript 模块模式

```javascript
// 使用 IIFE 创建命名空间
const ClawMatch = (function() {
    // 私有变量和函数
    const API_URL = 'https://api.example.com';

    function privateHelper() {
        // ...
    }

    // 公开接口
    return {
        init: function() {
            // 初始化逻辑
        },
        loadProfiles: function() {
            // 加载用户档案
        }
    };
})();

// 初始化
ClawMatch.init();
```

## 例外情况

### 允许的独立文件

1. **Favicon 文件**
   - favicon-16x16.png
   - favicon-32x32.png
   - favicon-64x64.png

2. **配置文件**
   - CNAME（域名配置）
   - robots.txt（SEO）
   - .gitignore（Git 配置）

3. **文档文件**
   - README.md
   - ARCHITECTURE.md
   - 其他 Markdown 文档

4. **后端代码**
   - Supabase Edge Functions（独立部署）
   - supabase/functions/*/index.ts

## 检查清单

在提交代码前，确认：

- [ ] 所有前端代码在 index.html 中
- [ ] 没有创建独立的 .css 或 .js 文件
- [ ] 没有引入构建工具或包管理器
- [ ] 代码使用注释清晰分隔不同模块
- [ ] 所有样式在 `<style>` 标签内
- [ ] 所有脚本在 `<script>` 标签内

## 违规示例

❌ **错误：创建独立文件**
```
index.html
styles.css          # 不允许
app.js             # 不允许
utils.js           # 不允许
```

✅ **正确：单文件架构**
```
index.html         # 包含所有代码
favicon-32x32.png  # 允许（资源文件）
CNAME              # 允许（配置文件）
```

## 性能考虑

### 文件大小管理

- 目标：index.html < 500KB
- 当前：~300KB ✅
- 如果超过 500KB，考虑：
  - 压缩图片（转 WebP）
  - 移除未使用的代码
  - 优化 CSS（移除重复样式）

### 加载优化

- 关键 CSS 内联在 `<head>` 中
- 非关键 CSS 在 `<style>` 底部
- JavaScript 在 `</body>` 前加载
- 使用 `defer` 或 `async` 加载外部库

---

**版本：** 1.0
**创建日期：** 2026-03-04
