# 山东第二医科大学指南 Web 版

本项目是山东第二医科大学指南的 Web 版本，包含原 [指南本体（LaTex 版）](https://github.com/SDSMU-Companion/sdsmu_welcome_tex)与 [指南切片](https://github.com/SDSMU-Companion/sdsmu_welcome_tex) 的全部内容。

本项目旨在将原有 PDF 版本的指南线上化，让指南在不同设备上轻松浏览。

因**本项目已正式上线**，故**上述项目已全部进入 Archive 状态**，不再维护。

---

本指南的内容部分遵循 [CC BY SA 4.0 LICENSE](./LICENSE-CC)，代码部分遵循 [MIT LICENSE](./LICENSE-MIT)。

The code of this project is licensed under [MIT LICENSE](./LICENSE-MIT), and the content is licensed under [CC BY SA 4.0 LICENSE](./LICENSE-CC).

## Thanks

<a href="https://www.netlify.com">
  <img src="https://www.netlify.com/assets/badges/netlify-badge-color-accent.svg" alt="Deploys by Netlify" />
</a>

## Markdown 文件简要编辑说明

### 入门

请参考以下链接学习 Markdown 文件的编辑

1. [Markdown 备忘清单](https://wangchujiang.com/reference/docs/markdown.html)
2. [VuePress 生态系统](https://ecosystem.vuejs.press/zh/)
3. [HTML 备忘清单](https://reference.learntech.cn/docs/html.html)
4. [Vue 3 备忘清单](https://reference.learntech.cn/docs/vue.html)

### 示例

> 看到此处则默认你已经看完了上面的markdown入门基本知识

1. 图片插入
   1. 插入不缩放的大图片请参考 [`map_full.md`](md_files/in_school/campus_fuyanshan/maps/map_full.md) 中的做法，注意图片 svg 与 webp 的问题（仅地图需要两个）

      `<FigureImage src="图片路径" title="自己起的自定义标题" downloadLink="图片路径（通常和上面的一致，仅地图有svg与webp之分）"></FigureImage>`

   2. 行内图片（自动缩放）请参考 [`life.md` 浴室预约与使用-浮烟山校区](md_files/in_school/tutorial/life.md#浴室预约与使用)的文本

      `前面的文字 <InlineImage src="图片路径"></InlineImage> 后面的文字`

2. 提示块

    ```markdown
    ::: 以下几项根据情况选择
    文字
    :::
    ```

   - `tip` 因格式原因不便在正文处给出的注释
   - `warning` 警告
   - `info` 相关信息
   - `note` 提示
   - `important` 重要提示，少用
3. 强调请参考 [`thank_lists.md` 的最后](md_files/doc_related/thank_lists.md)

   1. 加粗代码为 `font-size:2em;`
   2. 字体颜色通用代码为 `color:rgb(0,0,0);`，特殊颜色可以直接写英文
   3. 背景色通用代码为 `background:rgb(0,0,0);`，特殊颜色可以直接写英文
   4. 字体加粗为 `font-weight:bold;`

   综合示例如下：

    ```markdown
    <span style="font-size:2em; color:red; font-weight:bold; background:yellow">需要加粗的文本，效果为大字、红色、背景黄色</span>
    ```

4. 双下划线请参考 [`dormitory_fuyanshan.md`](/md_files/in_school/campus_fuyanshan/dormitory_fuyanshan.md#住宿注意事项)
5. 文字标红参考 [`study.md`](/md_files/in_school/life/study.md#杂项)
6. 手动书签跳转参考 [`life.md` 的脚注 1](/md_files/in_school/tutorial/life.md#新生信息查询线上报到) 与 [`school_readiness.md` 的脚注 8](/md_files/before_school/school_readiness.md#宿舍用品)
7.
8. 行内二维码参考 [`common_public_accounts.md`](/md_files/in_school/tutorial/common_public_accounts.md)，行间二维码参考 [thank_lists.md](/md_files/doc_related/thank_lists.md#宣传发布)

### 写作风格说明

1. 除版权声明以外，句子结尾无句号
2. 使用 `→` 作为操作步骤的连接符号
3. 穿插使用 `raw HTML` 以实现更复杂的排版需求，在可能的情况下尽量优先使用 Markdown 语法，若同时有加粗、标红等 Markdown 和 HTML 语法混杂的情况时，仅使用 HTML 语法
4. 部分行间脚注、特殊书签通过 `<span id="XXX"></span>` 的实现
5. 未显著区分 `important`、`warning`与`note`
6. 表格排版未调整
7. 大量使用了 AI 协助排版，内容无任何 AI

## 本地构建与运行

- 双击 `WORKPLACE.code-workspace` 以打开 VSCode 工作区
- 开始编辑
- 本地运行
  1. 打开“终端”，首次运行需先输入 `npm install package.json` 安装依赖
  2. 本地预览修改后的文件 `npm run docs:dev`
  3. 本地测试 `npm run docs:build`
- 上传修改后的文件到 GitHub 仓库
   1. 上传前先运行 `git pull` 同步远程仓库的修改
   2. 再通过 lazygit 或左侧边栏提交修改 或 `git add *;git commit -am "提交文件的概括信息"`
   3. 通过 lazygit 或左侧边栏或 `git push` 上传修改

**注意**：移动目录后需要先移除之前的缓存，再 `npm install`，否则会报错

### 项目结构

```tree
sdsmu_welcome-web/
├── md_files/                  # Markdown 源文件
│   ├── .vuepress/             # VuePress 配置
│   │   ├── components/       # 自定义 Vue 组件
│   │   ├── public/           # 静态资源
│   │   ├── config.ts         # 主配置文件
│   │   ├── client.ts         # 客户端配置
│   │   └── style.css         # 全局样式
│   ├── before_school/        # 入学前内容
│   ├── in_school/            # 在校期间内容
│   ├── doc_related/          # 文档相关
│   └── CHANGELOG.md          # 更新日志
├── package.json               # 项目依赖配置
└── README.md                  # 本文件
```

## 依赖升级

1. 安装 `ncu`
   - `npm install -g npm-check-updates`
2. 查看可升级的 package
   - `ncu`
3. 升级 packages（Vue系统的插件包需要手动更新 alpha 版本）
   - `ncu -u`
