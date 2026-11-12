# 设计原型集（静态原型站）

静态原型站，纯 HTML + 内联 CSS/JS，无后端依赖，双击文件即可本地打开。

**线上地址**：https://zhanghui-new.github.io/prototype/

| 页面 | 文件 | 线上地址 |
| --- | --- | --- |
| 原型集导航 | `index.html` | [/](https://zhanghui-new.github.io/prototype/) |
| 95306 项目入口 | `95306/index.html` | [/95306/](https://zhanghui-new.github.io/prototype/95306/) |
| 发送 / 到达 / 股道现车 | `95306/ec95306-prototype.html` | [/95306/ec95306-prototype.html](https://zhanghui-new.github.io/prototype/95306/ec95306-prototype.html) |
| 使用统计 | `95306/usage-stats.html` | [/95306/usage-stats.html](https://zhanghui-new.github.io/prototype/95306/usage-stats.html) |

---

## 一、部署机制（先了解这个，后面都好懂）

- GitHub Pages 从 **`main` 分支根目录** 发布，不需要任何构建命令。
- 规则：**文件推到仓库 → 1~2 分钟自动生效**，地址 = `https://zhanghui-new.github.io/prototype/` + 文件在仓库里的路径。
- 访问**文件夹**会自动加载里面的 `index.html`，所以每个项目文件夹必须有一个 `index.html` 当入口。
- `.nojekyll` 是空文件，作用是让 GitHub 跳过 Jekyll 处理（纯静态页面必留，**不要删，注意文件名前面有个点**）。

## 二、目录结构

按「项目」分文件夹，一个项目一个文件夹：

```
prototype/                        ← 仓库根 = 线上根路径 /
├── index.html                    ← 原型集总导航（只放项目级卡片）
├── 95306/                        ← 一个项目 = 一个文件夹
│   ├── index.html                ← 项目自己的入口/小导航（必需）
│   ├── ec95306-prototype.html
│   └── usage-stats.html
├── xxx/                          ← 以后的新项目，同样结构
│   ├── index.html
│   └── ...
├── README.md                     ← 本文件
└── .nojekyll                     ← 别删
```

约定：

- **根目录 `index.html` 只放项目卡**，一张卡 = 一个项目，链接指向项目文件夹（`./95306/`）。**不要**在这里放单个页面的卡片。
- **项目文件夹的 `index.html` 放页面卡**，是这个项目自己的入口，页面级的导航都在这里。
- 所有内部链接都用**相对路径**（`./xxx.html`、`../`），**不要用 `/` 开头**（会解析到域名根，缺 `/prototype/` 这一层）。

---

## 三、新增一个页面

### 第 1 步：确定归属，命名文件

- 归到现有项目：放进对应文件夹（如 `95306/`）
- 全新项目：先在仓库根**新建文件夹**（小写英文，如 `new-project/`）
- 文件名用**小写英文 + 连字符**，例如 `dispatch-board.html`
- **不要用中文名、不要用空格、不要用大写**（Pages 区分大小写）
- 必须是 `.html` 结尾，单个文件最省事：CSS/JS 直接写在里面

### 第 2 步：把文件传到仓库

**方式 A：网页上传（最省事）**

1. 打开 https://github.com/zhanghui-new/prototype
2. 进对应文件夹（如 `95306/`）
3. 右上角 **Add file** → **Upload files**，拖入 `xxx.html`
4. 底部填 commit 说明 → **Commit changes**

**方式 B：命令行**

```bash
git clone https://github.com/zhanghui-new/prototype.git
cd prototype
# 把 html 放进对应项目文件夹
git add .
git commit -m "add 调度看板页面"
git push
```

**方式 C：网页新建**

仓库里进对应文件夹 → **Add file** → **Create new file** → 粘贴内容 → Commit。

### 第 3 步：加卡片

**新项目（在根 `index.html` 加项目卡）：**

打开根目录 `index.html`，找到 `<section class="grid">`，在最后一个 `</a>` 之后、`</section>` 之前插入：

```html
      <a class="item" href="./new-project/">
        <div class="item-top">
          <span class="idx">03</span>
          <span class="arrow">→</span>
        </div>
        <h2>项目名称</h2>
        <p>一两句话说明这个项目是干什么的，40 字左右最合适。</p>
        <div class="tags">
          <span class="tag">标签一</span>
          <span class="tag">标签二</span>
        </div>
      </a>
```

同时给新项目建 `new-project/index.html` —— 直接复制 `95306/index.html`，改标题、说明、卡片即可。

**现有项目加页面（在项目 `index.html` 加页面卡）：**

打开 `95306/index.html`，同样在 `<section class="grid">` 里插入：

```html
      <a class="item" href="./xxx.html">
        <div class="item-top">
          <span class="idx">03</span>
          <span class="arrow">→</span>
        </div>
        <h2>页面标题</h2>
        <p>一两句话说明这个页面是干什么的。</p>
        <div class="tags">
          <span class="tag">标签</span>
        </div>
      </a>
```

卡片里只改这几处：

| 位置 | 改成 |
| --- | --- |
| `href="..."` | 目标地址（项目卡指文件夹 `./xxx/`，页面卡指文件 `./xxx.html`） |
| `<span class="idx">03</span>` | 顺序编号，递增两位数 |
| `<h2>...</h2>` | 标题 |
| `<p>...</p>` | 说明 |
| `<span class="tag">...</span>` | 标签，可 1~3 个；不要就整段 `<div class="tags">...</div>` 删掉 |

> 布局自适应：桌面一行 3 张，超过自动换行，手机端单列。

---

## 四、修改 `index.html`（根导航页）

`index.html` 只有三块，从上往下：

### 1. 文案区（第 184~188 行附近）

```html
<span class="eyebrow"><i></i>设计原型 · 静态预览</span>
<h1>设计原型集</h1>
<p class="lead">这里是一段整体说明……</p>
```

改大标题、副标题就动这三行。`<i></i>` 是那个小圆点，别删。

### 2. 卡片区（第 190~203 行附近）

```html
<section class="grid">
  ...每张卡片是一个 <a class="item">...</a>，一张卡对应一个项目...
</section>
```

- **新增**：复制一整段 `<a class="item">...</a>`，粘贴在后面再改内容
- **删除**：把那一整段删干净（从 `<a` 到 `</a>`）
- **调顺序**：整段剪切粘贴，然后**重新编号** `idx`
- **改文案**：只动 `<h2>` 和 `<p>` 里的文字

### 3. 页脚（第 205~208 行附近）

```html
<footer class="foot">
  <span>静态原型 · 无后端依赖，双击 HTML 也能本地打开</span>
  <a href="https://github.com/zhanghui-new/prototype" target="_blank" rel="noopener">源码仓库</a>
</footer>
```

### 不要动的地方

- `<style>` 里的样式
- `class="item"` / `class="idx"` / `class="tag"` 这些类名，改了样式就丢
- 项目页 `95306/index.html` 的结构和根页完全一致，改法相同

### 改完怎么生效

网页上直接编辑：打开文件 → 右上角**铅笔图标** → 改 → 底部 **Commit changes** → 等 1~2 分钟刷新（不行就 `Ctrl+F5` 强刷）。

---

## 五、修改已有页面 / 删除页面

- **改页面内容**：网页打开对应 `.html` 点铅笔编辑，或本地改完重新上传（同名覆盖）。
- **删页面**：仓库里打开该文件 → 右上角**垃圾桶图标** → Commit。**同时删项目页里对应的卡片**，否则会留 404 入口。（删整个项目时，项目页和根页的项目卡都要删。）
- **移动文件**：网页上点进文件 → 铅笔 → 把文件名改成 `新路径/原文件名`（如 `95306/xxx.html`）→ Commit。注意同步更新所有指向它的 `href`。

---

## 六、本地预览

直接双击 `index.html` 即可（全部资源内联，不依赖网络）。点击卡片时浏览器会自动跳到子文件夹里的页面。

想更接近线上效果，可以起个本地服务：

```bash
python -m http.server 8000
# 然后访问 http://localhost:8000
```

---

## 七、常见问题

**Q：提交了，刷新页面没变化？**
等 1~2 分钟，然后 `Ctrl+F5` 强刷。GitHub Pages 有缓存。

**Q：访问某个页面 404？**
按顺序排查：
1. 路径是否和 `href` 里写的**完全一致**（含文件夹、大小写、扩展名）
2. 文件是否在仓库里对应的文件夹下
3. `href` 有没有漏掉 `./`
4. 提交后是否已经过了一两分钟

**Q：访问文件夹地址，出现「File not found」？**
该文件夹缺 `index.html`。每个文件夹必须有自己的入口页。

**Q：样式全乱了 / 字体不对？**
检查是不是把 `<style>` 块弄坏了（少了个 `}`），或删掉了某个 `class="..."`。

**Q：项目大了想拆出去？**
把文件夹内容原样复制到新仓库，开启 Pages 即可；文件夹内全是相对路径，拆走后不用改任何链接。

**Q：想让链接更好看？**
改仓库名（`Settings` → 重命名，注意旧链接失效）或在 `Settings → Pages → Custom domain` 绑自定义域名。改 GitHub **用户名**风险最大，旧 Pages 地址不会重定向、直接失效。
