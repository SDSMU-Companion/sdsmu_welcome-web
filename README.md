# 山东第二医科大学指南 Web 版

本项目是山东第二医科大学指南的 Web 版本，包含[指南本体 LaTex 版](https://github.com/Mikachu2333/sdsmu_welcome_tex)与[指南切片](https://github.com/Mikachu2333/sdsmu_welcome_tex)的全部内容。

**本项目正式上线后，上述项目同时进入 Archive 状态**。

本项目旨在将原有 PDF 版本的指南线上化，让不同设备也可以轻松浏览相同的内容。

---

本指南的内容部分仍然遵循 CC BY SA 4.0 LICENSE，代码部分遵循 MIT 许可。

The code of this project is licensed under the MIT License, and the content is licensed under CC BY SA 4.0 LICENSE.

## Thanks

<a href="https://www.netlify.com">
  <img src="https://www.netlify.com/assets/badges/netlify-badge-color-accent.svg" alt="Deploys by Netlify" />
</a>

## Markdown 文件简要编辑说明

### 入门

请参考以下链接学习 Markdown 文件的编辑

1. [Markdown 备忘清单](https://reference.learntech.cn/docs/markdown.html)
2. [VuePress 生态系统](https://ecosystem.vuejs.press/zh/)
3. [HTML 备忘清单](https://reference.learntech.cn/docs/html.html)
4. [Vue 3 备忘清单](https://reference.learntech.cn/docs/vue.html)

### 示例

1. 插入图片请参考 [`map_full.md`](md_files/in_school/campus_fuyanshan/maps/map_full.md)中的做法
2. 提示块支持 `info`、`warning`、`important`、`note`、`tip`等，但是一般我们只用这几个
   - `tip` 因格式原因不便在正文处给出的注释
   - `warning` 警告
   - `info` 相关信息
   - `note` 提示
   - `important` 重要提示，少用
3. 强调请参考 [`thank_lists.md` 的最后](md_files/doc_related/thank_lists.md)
4. 双下划线请参考 [`dormitory_fuyanshan.md`](/md_files/in_school/campus_fuyanshan/dormitory_fuyanshan.md#住宿注意事项)
5. 文字标红参考 [`study.md`](/md_files/in_school/life/study.md#杂项)
6. 手动书签跳转参考 [`life.md` 的脚注 1](/md_files/in_school/tutorial/life.md#新生信息查询线上报到) 与 [`school_readiness.md` 的脚注 8](/md_files/before_school/school_readiness.md#宿舍用品)
7. 行内图片链接请参考 [`life.md` 链接的浮烟山校区部分](md_files/in_school/tutorial/life.md#浴室预约与使用)
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

本地运行

```shell
npm run docs:dev
```

本地测试

```shell
npm run docs:build
```

本地构建与上传

```shell
./deploy.ps1
```

**注意**：移动目录后需要先移除之前的缓存，再 `npm install`，最后运行 `deploy.ps1` 脚本，否则会报错

### 项目结构

```tree
sdsmu_welcome-web/
├── md_files/                  # Markdown 源文件
│   ├── .vuepress/            # VuePress 配置
│   │   ├── components/       # 自定义 Vue 组件
│   │   ├── public/           # 静态资源
│   │   ├── config.ts         # 主配置文件
│   │   ├── client.ts         # 客户端配置
│   │   └── style.css         # 全局样式
│   ├── before_school/        # 入学前内容
│   ├── in_school/            # 在校期间内容
│   ├── doc_related/          # 文档相关
│   └── CHANGELOG.md          # 更新日志
├── package.json              # 项目依赖配置
└── README.md                 # 本文件
```

## 依赖升级

1. 安装 `ncu`
   `npm install -g npm-check-updates`
2. 查看可升级的 package
   `ncu`
3. 升级 packages（Vue系统的插件包需要手动更新 alpha 版本）
   `ncu -u`
