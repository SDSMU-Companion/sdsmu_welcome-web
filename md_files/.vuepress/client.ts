import { defineClientConfig } from "@vuepress/client";
import { onMounted, onBeforeUnmount } from "vue";
import FileDownload from "./components/FileDownload.vue";
import FigureImage from "./components/FigureImage.vue";
import InlineImage from "./components/InlineImage.vue";
import Donate from "./components/Donate.vue";
import QrCodeLink from "./components/QrCodeLink.vue";
import QrCodeBlock from "./components/QrCodeBlock.vue";
import MinxingFloorSearch from "./components/MinxingFloorSearch.vue";
import "./style.css";

const ANCHOR_OFFSET_PX = 96;
const HIGHLIGHT_CLASS = "anchor-highlight-block";

function shouldHandleFootnoteBackRef(hash: string): boolean {
  return (
    hash.startsWith("#fnref") ||
    hash.startsWith("#footnote-ref") ||
    hash.startsWith("#footnote-ref-")
  );
}

function applyFootnoteBackRefOffsetAndHighlight(
  hash: string | undefined
): void {
  if (!hash) return;
  if (!shouldHandleFootnoteBackRef(hash)) return;

  const id = decodeURIComponent(hash.slice(1));
  const target = document.getElementById(id);
  if (!target) return;

  // 等浏览器/路由先完成默认锚点跳转，再做偏移
  requestAnimationFrame(() => {
    const targetTop =
      target.getBoundingClientRect().top +
      window.pageYOffset -
      ANCHOR_OFFSET_PX;
    window.scrollTo({ top: Math.max(0, targetTop) });

    const block =
      target.closest("p, li, blockquote, dd") ?? (target as HTMLElement);

    block.classList.remove(HIGHLIGHT_CLASS);
    // 触发重排以重启动画
    void (block as HTMLElement).offsetWidth;
    block.classList.add(HIGHLIGHT_CLASS);

    window.setTimeout(() => {
      block.classList.remove(HIGHLIGHT_CLASS);
    }, 3000);
  });
}

export default defineClientConfig({
  enhance({ app, router }) {
    app.component("FileDownload", FileDownload);
    app.component("FigureImage", FigureImage);
    app.component("InlineImage", InlineImage);
    app.component("Donate", Donate);
    app.component("QrCodeLink", QrCodeLink);
    app.component("QrCodeBlock", QrCodeBlock);
    app.component("MinxingFloorSearch", MinxingFloorSearch);
    router.afterEach((to) => {
      applyFootnoteBackRefOffsetAndHighlight(to.hash);
    });
  },
  setup() {
    const onHashChange = () =>
      applyFootnoteBackRefOffsetAndHighlight(window.location.hash);

    onMounted(() => {
      window.addEventListener("hashchange", onHashChange);
      onHashChange();
    });

    onBeforeUnmount(() => {
      window.removeEventListener("hashchange", onHashChange);
    });
  },
  rootComponents: [],
});
