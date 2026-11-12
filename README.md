# 95306 货运业务原型集

静态原型站，纯 HTML + 内联 CSS/JS，无后端依赖，双击文件即可本地打开。

**线上地址**：https://zhanghui-new.github.io/prototype/

| 页面 | 文件 | 线上地址 |
| --- | --- | --- |
| 导航页 | `index.html` | [/](https://zhanghui-new.github.io/prototype/) |
| 发送 / 到达 / 股道现车 | `ec95306-prototype.html` | [/ec95306-prototype.html](https://zhanghui-new.github.io/prototype/ec95306-prototype.html) |
| 使用统计 | `usage-stats.html` | [/usage-stats.html](https://zhanghui-new.github.io/prototype/usage-stats.html) |

---

## 一、部署机制（先了解这个，后面都好懂）

- GitHub Pages 从 **`main` 分支根目录** 发布，不需要任何构建命令。
- 规则：**文件推到仓库 → 1~2 分钟自动生效**，地址就是 `https://zhanghui-new.github.io/prototype/文件名`。
- `index.html` 是默认首页，所以它被拿来当导航页。
- `.nojekyll` 是空文件，作用是让 GitHub 跳过 Jekyll 处理（纯静态页面必留，**不要删，注意文件名前面有个点**）。

---

## 二、新增一个页面

### 第 1 步：命名文件

- 用**小写英文 + 连字符**，例如 `dispatch-board.html`、`car-report.html`
- **不要用中文名、不要用空格、不要用大写**（Pages 区分大小写，`Report.html` 和 `report.html` 是两个地址）
- 必须是 `.html` 结尾
- 单个 HTML 文件最省事：CSS/JS 直接写在里面（参考现有三个页面）

### 第 2 步：把文件传到仓库根目录

**方式 A：网页上传（最省事，推荐非技术同学）**

1. 打开 https://github.com/zhanghui-new/prototype
2. 右上角 **Add file** → **Upload files**
3. 把 `xxx.html` 拖进去
4. 底部填一句 commit 说明，例如 `add 调度看板页面`
5. 点 **Commit changes**

**方式 B：命令行**

```bash
git clone https://github.com/zhanghui-new/prototype.git
cd prototype
# 把你的 html 文件复制进来
git add xxx.html
git commit -m "add 调度看板页面"
git push
```

**方式 C：网页新建**

仓库页 **Add file** → **Create new file** → 文件名填 `xxx.html` → 粘贴内容 → Commit。

### 第 3 步：在 `index.html` 里加一张卡片

打开 `index.html`，找到 `<section class="grid">` 和它对应的 `</section>`，在**最后一个 `</a>` 后面、`</section>` 前面**插入下面这段：

```html
      <a class="item" href="./xxx.html">
        <div class="item-top">
          <span class="idx">03</span>
          <span class="arrow">→</span>
        </div>
        <h2>页面标题</h2>
        <p>一两句话说明这个页面是干什么的，40 字左右最合适。</p>
        <div class="tags">
          <span class="tag">标签一</span>
          <span class="tag">标签二</span>
        </div>
      </a>
```

改这几处就够了：

| 位置 | 改成 |
| --- | --- |
| `href="./xxx.html"` | 你的文件名，**前面必须带 `./`** |
| `<span class="idx">03</span>` | 顺序编号，递增两位数 |
| `<h2>...</h2>` | 卡片标题 |
| `<p>...</p>` | 卡片说明 |
| `<span class="tag">...</span>` | 标签，可 1~3 个，不要就整行 `<div class="tags">...</div>` 删掉 |

> 布局是自适应的：桌面一行 3 张，超过 3 张自动换行，手机端单列。卡片数量不用管排版。

---

## 三、修改 `index.html`

`index.html` 只有三块，从上往下：

### 1. 文案区（第 185~188 行附近）

```html
<span class="eyebrow"><i></i>设计原型 · 静态预览</span>
<h1>95306 货运业务原型集</h1>
<p class="lead">这里是一段整体说明……</p>
```

改大标题、副标题就动这三行。`<i></i>` 是那个小圆点，别删。

### 2. 卡片区（第 190~217 行附近）

```html
<section class="grid">
  ...每张卡片是一个 <a class="item">...</a>...
</section>
```

- **新增**：复制一整段 `<a class="item">...</a>`，粘贴在后面再改内容
- **删除**：把那一整段 `<a ...>...</a>` 删干净（从 `<a` 到 `</a>`）
- **调顺序**：整段剪切粘贴，然后**重新编号** `idx`
- **改名/改说明**：只动 `<h2>` 和 `<p>` 里的文字

### 3. 页脚（第 219~222 行附近）

```html
<footer class="foot">
  <span>静态原型 · 无后端依赖，双击 HTML 也能本地打开</span>
  <a href="https://github.com/zhanghui-new/prototype" target="_blank" rel="noopener">源码仓库</a>
</footer>
```

### 不要动的地方

- `<style>` 里的样式（改了会影响所有卡片）
- 顶部的 `<title>` 尽量别改（浏览器标签页标题）
- `class="item"` / `class="idx"` / `class="tag"` 这些类名，改了样式就丢

### 改完怎么生效

网页上直接编辑：打开 `index.html` → 右上角**铅笔图标** → 改 → 底部 **Commit changes** → 等 1~2 分钟刷新页面（不行就 `Ctrl+F5` 强刷）。

---

## 四、修改已有页面 / 删除页面

- **改页面内容**：方法同上，网页打开对应 `.html` 点铅笔编辑，或本地改完重新上传（上传同名文件会自动覆盖）。
- **删页面**：仓库里打开该文件 → 右上角 **垃圾桶图标** → Commit。**记得同时去 `index.html` 删掉对应卡片**，否则导航页会留一个点进去 404 的入口。

---

## 五、本地预览

直接双击 `index.html` 即可（全部资源内联，不依赖网络）。

想更接近线上效果，可以起个本地服务：

```bash
python -m http.server 8000
# 然后访问 http://localhost:8000
```

---

## 六、常见问题

**Q：提交了，刷新页面没变化？**
等 1~2 分钟，然后 `Ctrl+F5` 强刷。GitHub Pages 有缓存，构建完成前访问到的还是旧版本。

**Q：访问某个页面 404？**
按顺序排查：
1. 文件名是否和 `href` 里写的**完全一致**（含大小写、扩展名）
2. 文件是否在**仓库根目录**（不是子文件夹里）
3. `href` 有没有漏掉 `./`
4. 提交后是否已经过了一两分钟

**Q：样式全乱了 / 字体不对？**
检查是不是把 `<style>` 块弄坏了（少了个 `}`），或删掉了某个 `class="..."`。

**Q：能在子文件夹里放页面吗？**
可以，`href` 写成 `./子目录/页面.html`，但建议保持扁平，路径越短越不容易错。

**Q：想让别人访问时链接更好看？**
两种方式：改仓库名（`Settings` → 重命名，注意旧链接失效）或在 `Settings → Pages → Custom domain` 绑自己的域名。改 GitHub **用户名**风险最大，旧 Pages 地址不会重定向、直接失效。
