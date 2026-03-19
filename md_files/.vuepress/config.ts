import { defineUserConfig } from "vuepress";
import { defaultTheme } from "@vuepress/theme-default";
import { viteBundler } from "@vuepress/bundler-vite";
import { slimsearchPlugin } from "@vuepress/plugin-slimsearch";
import { markdownExtPlugin } from "@vuepress/plugin-markdown-ext";
import { markdownStylizePlugin } from "@vuepress/plugin-markdown-stylize";
import { markdownMathPlugin } from "@vuepress/plugin-markdown-math";
import { Jieba } from "@node-rs/jieba";
import fs from "fs";
import path from "path";

// 读取自定义词典并创建jieba实例
const loadJiebaWithCustomDict = () => {
  const dictPath = path.join(__dirname, "custom-dict.txt");
  if (!fs.existsSync(dictPath)) {
    return new Jieba();
  }
  const content = fs.readFileSync(dictPath, "utf-8");
  const words = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .filter((line, index, self) => self.indexOf(line) === index);

  if (words.length === 0) {
    return new Jieba();
  }

  // withDict需要Buffer格式，每行一个词
  const dictBuffer = Buffer.from(words.join("\n"), "utf-8");
  // 使用默认词典并加载自定义词典
  const jieba = new Jieba();
  jieba.loadDict(dictBuffer);
  return jieba;
};

// 初始化 jieba 实例
const jieba = loadJiebaWithCustomDict();

export default defineUserConfig({
  base: "/",
  bundler: viteBundler(),
  lang: "zh-CN",
  title: "山东第二医科大学指南 SDSMU-Companion",
  description: "321指南",

  head: [
    ["link", { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" }],
    [
      "link",
      {
        rel: "stylesheet",
        href: "/fonts/local-fonts.css",
      },
    ],
  ],

  theme: defaultTheme({
    repo: "https://github.com/SDSMU-Companion/sdsmu_welcome-web",
    logo: "/favicon.svg",
    sidebar: [
      {
        text: "前言",
        collapsible: false,
        link: "/doc_related/thank_lists.md",
        children: [
          { text: "致谢", link: "/doc_related/thank_lists.md" },
          {
            text: "版权与声明",
            link: "/doc_related/copyright_statements.md",
          },
          { text: "指南简介", link: "/doc_related/document_introduction.md" },
        ],
      },
      {
        text: "校历",
        link: "/doc_related/calender.md",
      },
      {
        text: "新生入学",
        collapsible: false,
        children: [
          {
            text: "入学准备",
            link: "/before_school/school_readiness.md",
          },
          {
            text: "报到",
            link: "/before_school/school_register.md",
          },
          {
            text: "交通指引",
            link: "/before_school/goto_school.md",
          },
          {
            text: "军训概况",
            link: "/before_school/military_training.md",
          },
          {
            text: "费用与银行卡",
            link: "/before_school/cost.md",
          },
          {
            text: "新生常见问题",
            link: "/before_school/common_questions.md",
          },
        ],
      },
      {
        text: "浮烟山校区",
        collapsible: false,
        children: [
          {
            text: "校区概况",
            link: "/in_school/campus_fuyanshan/summary_fuyanshan.md",
          },
          {
            text: "地图",
            collapsible: false,
            link: "/in_school/campus_fuyanshan/maps/map_full.md",
            children: [
              {
                text: "整体地图",
                link: "/in_school/campus_fuyanshan/maps/map_full.md",
              },
              {
                text: "教学楼",
                link: "/in_school/campus_fuyanshan/maps/map_ABCDEF.md",
              },
              {
                text: "敏行楼",
                link: "/in_school/campus_fuyanshan/maps/map_minxing.md",
              },
              {
                text: "附院",
                link: "/in_school/campus_fuyanshan/maps/map_hospital.md",
              },
            ],
          },
          {
            text: "宿舍",
            link: "/in_school/campus_fuyanshan/dormitory_fuyanshan.md",
          },
          {
            text: "校园生活",
            link: "/in_school/campus_fuyanshan/school_life_fuyanshan.md",
          },
        ],
      },
      {
        text: "虞河校区",
        collapsible: false,
        link: "/in_school/campus_yuhe/summary_yuhe.md",
        children: [
          {
            text: "校区概况",
            link: "/in_school/campus_yuhe/summary_yuhe.md",
          },
          {
            text: "地图",
            link: "/in_school/campus_yuhe/maps/map_full.md",
            children: [
              {
                text: "整体地图",
                link: "/in_school/campus_yuhe/maps/map_full.md",
              },
              {
                text: "人民医院",
                link: "/in_school/campus_yuhe/maps/map_renmin.md",
              },
              {
                text: "附院",
                link: "/in_school/campus_yuhe/maps/map_hospital.md",
              },
            ],
          },
          {
            text: "宿舍",
            link: "/in_school/campus_yuhe/dormitory_yuhe.md",
          },
          {
            text: "校园生活",
            link: "/in_school/campus_yuhe/school_life_yuhe.md",
          },
        ],
      },
      {
        text: "安全",
        link: "/in_school/life/security.md",
      },
      {
        text: "学习方面",
        link: "/in_school/life/study.md",
      },
      {
        text: "就业指引",
        link: "/in_school/further/employment.md",
      },
      {
        text: "兼职指南",
        link: "/in_school/further/sideline.md",
      },
      {
        text: "教程",
        collapsible: false,
        children: [
          {
            text: "生活类教程",
            link: "/in_school/tutorial/life.md",
          },
          {
            text: "学习类教程",
            link: "/in_school/tutorial/study_related.md",
          },
          {
            text: "其它",
            collapsible: false,
            children: [
              {
                text: "不便分类的教程",
                link: "/in_school/tutorial/others.md",
              },
              {
                text: "PPT制作指南",
                link: "/in_school/tutorial/ppt.md",
              },
            ],
          },
          {
            text: "通用信息汇总",
            collapsible: false,
            children: [
              {
                text: "常用网站",
                link: "/in_school/tutorial/common_web.md",
              },
              {
                text: "各级组织信息汇总",
                link: "/in_school/summary/community_summary.md",
              },
              {
                text: "常用软件",
                link: "/in_school/tutorial/common_app.md",
              },
              {
                text: "常用公众号",
                link: "/in_school/tutorial/common_public_accounts.md",
              },
              {
                text: "其它推荐的资源",
                link: "/in_school/tutorial/recommand_res.md",
              },
            ],
          },
        ],
      },
      {
        text: "后记",
        link: "/doc_related/epilogue.md",
      },
      {
        text: "更新日志",
        collapsible: true,
        link: "/CHANGELOG.md",
        children: [
          { text: "更新日志（现 Web 版本）", link: "/CHANGELOG.md" },
          { text: "更新日志（旧 TeX 版本）", link: "/CHANGELOG_old.md" },
        ],
      },
    ],
  }),

  plugins: [
    slimsearchPlugin({
      indexContent: true,
      suggestion: false,
      queryHistoryCount: 0,
      resultHistoryCount: 0,
      hotKeys: [{ key: "f", ctrl: true }],
      indexOptions: {
        tokenize: (text, _fieldName) => {
          const textWithoutLinks = text.replace(
            /https?:\/\/[^\s\]\)\$]+/g,
            " ",
          );
          const cleanedText = textWithoutLinks.replace(/[\p{P}\p{S}]/gu, " ");
          const result = jieba.cutForSearch(cleanedText, true);
          return result;
        },
      },
      filter: (page) => {
        const excludedFiles = new Set(["CHANGELOG.md", "CHANGELOG_old.md"]);
        const excludedPaths = new Set([
          "/CHANGELOG.html",
          "/CHANGELOG_old.html",
        ]);
        const filePath = page.filePathRelative?.replace(/\\/g, "/");
        return !(
          (filePath && excludedFiles.has(filePath)) ||
          (page.path && excludedPaths.has(page.path))
        );
      },
      locales: {
        "/": {
          placeholder: "搜索",
        },
      },
      customFields: [
        {
          getter: (page) => page.frontmatter.tags as string[] | undefined,
          formatter: "标签：$content",
        },
      ],
    }),
    markdownExtPlugin({
      footnote: true,
    }),
    markdownStylizePlugin({
      mark: true,
    }),
    markdownMathPlugin({
      type: "mathjax",
      output: "svg",
    }),
  ],
});
