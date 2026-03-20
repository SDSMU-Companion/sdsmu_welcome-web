<template>
  <section class="minxing-floor-search" id="door-search">
    <div class="search-row">
      <input id="door-search-input" v-model.trim="query" type="search" inputmode="text" autocomplete="off"
        placeholder="输入门牌号" aria-label="敏行楼门牌号搜索" @keydown.enter.prevent="searchDoor" />
      <button type="button" @click="searchDoor">搜索</button>
    </div>

    <p v-if="searchMessage" :class="['search-message', { error: searchError }]">
      {{ searchMessage }}
    </p>

    <div class="floor-switcher" role="tablist" aria-label="楼层切换">
      <button v-for="floor in floors" :key="floor" type="button"
        :class="['floor-btn', { active: floor === activeFloor }]" :aria-selected="floor === activeFloor" role="tab"
        @click="switchFloor(floor)">
        {{ floor }}
      </button>
    </div>

    <div class="map-stage">
      <div ref="activeSvgContainer" class="map-svg-container" v-html="activeSvgMarkup" />
    </div>
  </section>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from "vue";
import { withBase } from "@vuepress/client";

const floors = ["B1F", "1F", "2F", "3F", "4F"];
const activeFloor = ref("1F");
const query = ref("");
const searchMessage = ref("");
const searchError = ref(false);
// 统一搜索文本的格式（转小写并去除空格）
const normalizeSearchText = (value) =>
  typeof value === "string" ? value.toLowerCase().replace(/\s+/g, "") : "";

// 片区高亮的交替动画参数
const zoneAlternatePhaseModulo = 2;
const zoneAlternatePhaseRemainder = 1;
// 楼层对应的 SVG 文件映射，3F和4F没啥差别，直接共用了
const floorSvgPathMap = {
  B1F: "/resources/map/敏行楼剖面图B1F.svg",
  "1F": "/resources/map/敏行楼剖面图1F.svg",
  "2F": "/resources/map/敏行楼剖面图2F.svg",
  "3F": "/resources/map/敏行楼剖面图3F.svg",
  "4F": "/resources/map/敏行楼剖面图3F.svg",
};

// 缓存各层 SVG 数据
const floorSvgMarkupMap = ref({
  B1F: "",
  "1F": "",
  "2F": "",
  "3F": "",
  "4F": "",
});
const activeSvgContainer = ref(null);
// 缓存各层的文本节点和片区节点以加速搜索
let textIndexByFloor = {
  B1F: [],
  "1F": [],
  "2F": [],
  "3F": [],
  "4F": [],
};
let zoneIndexByFloor = {
  B1F: [],
  "1F": [],
  "2F": [],
  "3F": [],
  "4F": [],
};
// 记录当前被高亮的元素
let highlightedTextElsByFloor = {
  B1F: [],
  "1F": [],
  "2F": [],
  "3F": [],
  "4F": [],
};
let highlightedZoneElsByFloor = {
  B1F: [],
  "1F": [],
  "2F": [],
  "3F": [],
  "4F": [],
};

const activeSvgMarkup = computed(
  () => floorSvgMarkupMap.value[activeFloor.value] ?? "",
);

const zoneTokenRegex = /^(\d\d)(.)(\d\d)$/;

const parseZoneToken = (token) => {
  const normalized = normalizeSearchText(token);
  const match = normalized.match(zoneTokenRegex);
  if (!match) return null;
  return {
    prefix: match[1],
    middle: match[2],
    suffix: Number(match[3]),
  };
};

const parseZoneIdRange = (zoneId) => {
  const match = normalizeSearchText(zoneId).match(/^zone-([^-]+)-([^-]+)$/);
  if (!match) return null;
  const start = parseZoneToken(match[1]);
  const end = parseZoneToken(match[2]);
  if (!start || !end) return null;
  return { start, end };
};

const roomCodeRegex = /^(\d\d)([\dx])(\d\d)$/i;

const parseRoomCode = (value) => {
  const normalized = normalizeSearchText(value);
  const match = normalized.match(roomCodeRegex);
  if (!match) return null;
  return {
    normalized,
    prefix: match[1],
    middle: match[2],
    suffix: Number(match[3]),
  };
};

// 从门牌号解析出目标楼层（如：0 对应 B1F，1-4 对应 1F-4F）
const parseFloorFromRoomCode = (value) => {
  const normalized = normalizeSearchText(value);
  // 支持 0-4 的楼层数字提取
  const match = normalized.match(/^(\d\d)([0-4])(\d\d)$/);
  if (!match) return null;
  const parsedFloor = match[2] === "0" ? "B1F" : `${match[2]}F`;
  return floors.includes(parsedFloor) ? parsedFloor : null;
};

// 检查片区匹配规则（x代表任意字符）
const zoneMiddleMatches = (zoneMiddle, roomMiddle) =>
  zoneMiddle === "x" || zoneMiddle === roomMiddle;

// 判断一个门牌号是否在某个指定片区的范围中
const isRoomInZoneRange = (roomCode, range) => {
  if (!roomCode || !range) return false;
  if (
    range.start.prefix > roomCode.prefix ||
    range.end.prefix < roomCode.prefix
  ) {
    return false;
  }
  if (!zoneMiddleMatches(range.start.middle, roomCode.middle)) return false;
  if (!zoneMiddleMatches(range.end.middle, roomCode.middle)) return false;
  if (
    range.start.prefix === roomCode.prefix &&
    roomCode.suffix < range.start.suffix
  ) {
    return false;
  }
  if (
    range.end.prefix === roomCode.prefix &&
    roomCode.suffix > range.end.suffix
  ) {
    return false;
  }
  return true;
};

// 地图关键字别名，将常用词自动映射到标准标注文本上
const floorAliasMap = new Map([
  ["自习室", ["自习长廊"]],
  ["自习", ["自习长廊"]],
  ["学习走廊", ["自习长廊"]],
  ["走廊", ["自习长廊"]],
  ["电梯", ["楼梯/电梯"]],
  ["楼梯", ["楼梯/电梯"]],
  ["卫生间", ["厕所"]],
]);

// 清除对应楼层文本的高亮状态
const clearTextHighlights = (floor) => {
  highlightedTextElsByFloor[floor].forEach((el) => {
    if (el) el.classList.remove("svg-text-hit");
  });
  highlightedTextElsByFloor[floor] = [];
};

// 清除对应楼层片区（划定区域）的高亮状态
const clearZoneHighlights = (floor) => {
  highlightedZoneElsByFloor[floor].forEach((el) => {
    if (el) {
      el.classList.remove("svg-zone-hit");
      el.classList.remove("svg-zone-hit-alt");
    }
  });
  highlightedZoneElsByFloor[floor] = [];
};

// 清除所有楼层的所有高亮状态
const clearAllHighlights = () => {
  floors.forEach((floor) => {
    clearTextHighlights(floor);
    clearZoneHighlights(floor);
  });
};

// 构建楼层的文本索引，用于搜索门牌号或关键词
const buildTextIndex = (floor) => {
  if (!activeSvgContainer.value) return;
  const textElements = Array.from(
    activeSvgContainer.value.querySelectorAll("svg text"),
  );
  textIndexByFloor[floor] = textElements
    .map((element) => {
      const text = element.textContent?.trim() ?? "";
      return {
        element,
        text,
        normalized: normalizeSearchText(text),
      };
    })
    .filter((item) => item.text.length > 0);
};

// 构建楼层片区的索引，通过解析 ID 为范围数据以便模糊过滤
const buildZoneIndex = (floor) => {
  if (!activeSvgContainer.value) return;
  const zoneElements = Array.from(
    activeSvgContainer.value.querySelectorAll('svg [id^="zone-"]'),
  );
  zoneIndexByFloor[floor] = zoneElements
    .map((element) => {
      const id = element.getAttribute("id") ?? "";
      const range = parseZoneIdRange(id);
      if (!range) return null;
      return {
        element,
        id: id.toLowerCase(),
        range,
      };
    })
    .filter(Boolean);
};

// 异步加载对应楼层的 SVG 文件并建立索引缓存
const loadFloorSvg = async (floor) => {
  if (!floorSvgMarkupMap.value[floor]) {
    const response = await fetch(withBase(floorSvgPathMap[floor]));
    floorSvgMarkupMap.value[floor] = await response.text();
  }

  await nextTick();
  buildTextIndex(floor);
  buildZoneIndex(floor);
};

// 为命中搜索条件的文字添加高亮样式
const highlightTextMatches = (floor, matches) => {
  clearTextHighlights(floor);
  matches.forEach((match) => {
    // 强制触发重绘，重启CSS动画
    match.element.classList.remove("svg-text-hit");
    void match.element.offsetWidth;
    match.element.classList.add("svg-text-hit");
  });
  highlightedTextElsByFloor[floor] = matches.map(
    (match) => match.element,
  );
};

// 为命中搜索条件的区域添加高亮样式，当有多个匹配时交错动画
const highlightZoneMatches = (floor, matches) => {
  clearZoneHighlights(floor);
  matches.forEach((match, index) => {
    // 强制触发重绘
    match.element.classList.remove("svg-zone-hit", "svg-zone-hit-alt");
    void match.element.offsetWidth;
    match.element.classList.add("svg-zone-hit");
    if (
      matches.length > 1 &&
      index % zoneAlternatePhaseModulo === zoneAlternatePhaseRemainder
    ) {
      match.element.classList.add("svg-zone-hit-alt");
    }
  });
  highlightedZoneElsByFloor[floor] = matches.map(
    (match) => match.element,
  );
};

// 执行核心搜索逻辑：检测输入，自动切换楼层，寻找匹配项高亮并在页面显示反馈
const searchDoor = async () => {
  const rawQuery = query.value?.trim();
  if (!rawQuery) {
    searchMessage.value = "请输入门牌号（格式：xx?xx）或片区编号后点击搜索";
    searchError.value = true;
    clearAllHighlights();
    return;
  }

  const normalizedText = normalizeSearchText(rawQuery);
  let targetFloor = parseFloorFromRoomCode(rawQuery);

  // 处理自习长廊等别名跳转，指定为 2F（因为只在2层显示）
  const zixiKeywords = ["自习长廊", "自习", "自习室", "学习走廊", "走廊"];
  if (!targetFloor && zixiKeywords.includes(normalizedText)) {
    targetFloor = "2F";
  }

  if (targetFloor && activeFloor.value !== targetFloor) {
    await switchFloor(targetFloor);
  }

  // 确保DOM索引最新
  if (!floorSvgMarkupMap.value[activeFloor.value] || textIndexByFloor[activeFloor.value].length === 0) {
    await loadFloorSvg(activeFloor.value);
  }

  const textIndex = textIndexByFloor[activeFloor.value];
  const zoneIndex = zoneIndexByFloor[activeFloor.value];

  const directMatches = textIndex.filter(({ normalized }) =>
    normalized.includes(normalizedText),
  );
  const aliasTargets = floorAliasMap.get(normalizedText) ?? [];
  const aliasMatches = aliasTargets.flatMap((target) => {
    const normalizedTarget = normalizeSearchText(target);
    return textIndex.filter(({ normalized }) =>
      normalized.includes(normalizedTarget),
    );
  });
  // 当只有在2层并搜索相关关键字时，如果通过 directMatches 未命中，但关键词属于自习系列，可强制寻找自习长廊
  const mergedMatchesSet = new Map([...directMatches, ...aliasMatches].map((item) => [item.text, item]));
  if (mergedMatchesSet.size === 0 && activeFloor.value === "2F" && zixiKeywords.includes(normalizedText)) {
    const zixiTargets = textIndex.filter(({ normalized }) => normalized.includes(normalizeSearchText("自习长廊")));
    zixiTargets.forEach(item => mergedMatchesSet.set(item.text, item));
  }
  const mergedMatches = Array.from(mergedMatchesSet.values());

  const queryRoomCode = parseRoomCode(rawQuery);
  const zoneMatches = zoneIndex.filter((zone) => {
    if (normalizeSearchText(zone.id) === normalizedText) return true;
    return isRoomInZoneRange(queryRoomCode, zone.range);
  });

  clearAllHighlights();

  if (mergedMatches.length > 0 || zoneMatches.length > 0) {
    highlightTextMatches(activeFloor.value, mergedMatches);
    highlightZoneMatches(activeFloor.value, zoneMatches);
    const labels = [];
    if (mergedMatches.length > 0) {
      labels.push(...mergedMatches.slice(0, 2).map((item) => item.text));
    }
    if (zoneMatches.length > 0) {
      labels.push(...zoneMatches.slice(0, 2).map((zone) => zone.id));
    }
    searchMessage.value = `已定位 ${activeFloor.value}：${labels.join("、")}`;
    searchError.value = false;
    return;
  }

  searchMessage.value = `未找到 ${activeFloor.value} 对应门牌号：${rawQuery}`;
  searchError.value = true;
};
// 切换当前激活的楼层，如果尚未加载对应地图也会触发加载
const switchFloor = async (floor) => {
  activeFloor.value = floor;
  searchMessage.value = `当前 ${floor}，支持格式 xxxxx（纯数字）`;
  searchError.value = false;
  await loadFloorSvg(floor);
};

onMounted(() => {
  searchMessage.value = "支持 -1～4 层门牌号搜索（格式：xxxxx，纯数字）";
  loadFloorSvg(activeFloor.value);
});
</script>

<style scoped>
.minxing-floor-search {
  --door-active-color: #d1242f;
  --zone-blink-duration: 0.8s;
  margin: 1rem 0 1.5rem;
}

.search-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

#door-search-input {
  flex: 0 0 24ch;
  max-width: 100%;
  padding: 0.45rem 0.6rem;
  border: 1px solid var(--c-border, #c5d0db);
  background: var(--c-bg, #fff);
  color: var(--c-text, #2c3e50);
  border-radius: 6px;
}

#door-search-input::placeholder {
  color: var(--c-text-light, #6b7280);
}

#door-search-input:focus {
  border-color: var(--c-brand);
  outline: 2px solid rgba(62, 175, 124, 0.2);
  outline-offset: 1px;
}

:global(html.dark) #door-search-input,
:global(html[data-theme="dark"]) #door-search-input,
:global(:root[data-theme="dark"]) #door-search-input {
  background: #1f2530;
  color: #e5e7eb;
  border-color: #4b5563;
}

:global(html.dark) #door-search-input::placeholder,
:global(html[data-theme="dark"]) #door-search-input::placeholder,
:global(:root[data-theme="dark"]) #door-search-input::placeholder {
  color: #9ca3af;
}

:global(html.dark) #door-search-input:focus,
:global(html[data-theme="dark"]) #door-search-input:focus,
:global(:root[data-theme="dark"]) #door-search-input:focus {
  border-color: #8cb4ff;
  outline: 2px solid rgba(140, 180, 255, 0.32);
}

.search-row button,
.floor-btn {
  border: 1px solid var(--c-brand);
  background: transparent;
  color: var(--c-brand);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.search-row button:hover,
.floor-btn:hover {
  background: var(--c-brand);
  color: var(--c-bg, #fff);
}

.search-row button {
  padding: 0.42rem 0.85rem;
}

.search-message {
  margin: 0.5rem 0 0.8rem;
  font-size: 0.9rem;
  color: var(--c-text-light);
}

.search-message.error {
  color: var(--door-active-color);
}

.floor-switcher {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 0.8rem;
}

.floor-btn {
  padding: 0.3rem 0.65rem;
}

.floor-btn.active {
  background: var(--c-brand);
  color: var(--c-bg, #fff);
}

.map-stage {
  border: 1px solid var(--c-border);
  border-radius: 8px;
  overflow: auto;
  max-height: 85vh;
  background: #f7f9fb;
}

.map-svg-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.map-svg-container :deep(svg) {
  display: block;
  max-width: 90%;
  max-height: 85vh;
  width: auto;
  height: auto;
}

.map-svg-container :deep(svg text.svg-text-hit) {
  fill: #000 !important;
  stroke: #fff;
  stroke-width: 10px;
  paint-order: stroke fill;
  font-weight: 700;
  animation: blink 0.8s ease-in-out infinite;
}

.map-svg-container :deep(svg .svg-zone-hit) {
  fill: #000 !important;
  stroke: none !important;
  fill-opacity: 0.8 !important;
  animation: blink var(--zone-blink-duration) ease-in-out infinite;
}

.map-svg-container :deep(svg .svg-zone-hit.svg-zone-hit-alt) {
  animation-delay: calc(var(--zone-blink-duration) / 2);
}

@keyframes blink {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.25;
  }
}
</style>
