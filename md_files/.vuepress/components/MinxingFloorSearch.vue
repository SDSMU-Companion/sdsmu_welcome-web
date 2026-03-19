<template>
  <section class="minxing-floor-search" id="door-search">
    <div class="search-row">
      <input
        id="door-search-input"
        v-model.trim="query"
        type="search"
        inputmode="numeric"
        pattern="[0-9]*"
        autocomplete="off"
        placeholder="输入门牌号数字，如 101"
        aria-label="敏行楼门牌号数字搜索"
        @keydown.enter.prevent="searchDoor"
      />
      <button type="button" @click="searchDoor">搜索</button>
    </div>

    <p v-if="searchMessage" :class="['search-message', { error: !activeDoor }]">
      {{ searchMessage }}
    </p>

    <div class="floor-switcher" role="tablist" aria-label="楼层切换">
      <button
        v-for="floor in floors"
        :key="floor"
        type="button"
        :class="['floor-btn', { active: floor === activeFloor }]"
        :aria-selected="floor === activeFloor"
        role="tab"
        @click="switchFloor(floor)"
      >
        {{ floor }}
      </button>
    </div>

    <div v-if="activeFloor === '1F'" class="map-stage">
      <div class="map-inner">
        <img
          class="map-image"
          :src="withBase('/resources/map/敏行楼1楼剖面图.svg')"
          alt="敏行楼一楼剖面图"
        />

        <button
          v-for="door in floorDoors"
          :key="door.code"
          type="button"
          :class="['door-tag', { active: activeDoor?.code === door.code }]"
          :style="{ left: `${door.x}%`, top: `${door.y}%` }"
          @click="locateDoor(door)"
        >
          {{ door.code }}
        </button>
      </div>
    </div>

    <div v-else-if="activeFloor === '2F'" class="map-stage">
      <div
        ref="floor2SvgContainer"
        class="map-svg-container"
        v-html="floor2SvgMarkup"
      />
    </div>

    <div v-else class="placeholder">{{ activeFloor }} 剖面图暂未制作，敬请期待。</div>
  </section>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { withBase } from '@vuepress/client'

const floors = ['1F', '2F', '3F', '4F', '5F']
const activeFloor = ref('1F')
const query = ref('')
const activeDoor = ref(null)
const activeSvgLabel = ref('')
const floor2SvgMarkup = ref('')
const floor2SvgContainer = ref(null)
const floor2TextIndex = ref([])
const floor2HighlightedEls = ref([])

const floorDoorMap = {
  '1F': [
    { code: 'MX101', x: 17, y: 72 },
    { code: 'MX102', x: 35, y: 72 },
    { code: 'MX103', x: 52, y: 72 },
    { code: 'MX104', x: 70, y: 72 },
    { code: 'MX105', x: 85, y: 72 },
    { code: 'MX106', x: 17, y: 28 },
    { code: 'MX107', x: 35, y: 28 },
    { code: 'MX108', x: 52, y: 28 },
    { code: 'MX109', x: 70, y: 28 },
    { code: 'MX110', x: 85, y: 28 }
  ]
}

const floorDoors = computed(() => floorDoorMap[activeFloor.value] ?? [])

const searchMessage = computed(() => {
  if (!query.value) {
    return activeFloor.value === '2F'
      ? '支持搜索 2F SVG 文本/别名：如 31218、教务办公室、自习室'
      : '支持搜索门牌号：MX101-MX110 或 101-110'
  }

  if (activeFloor.value === '2F') {
    if (!activeSvgLabel.value) return `未找到：${query.value}`
    return `已高亮：${activeSvgLabel.value}`
  }

  if (!activeDoor.value) return `未找到门牌号：${query.value}`
  return `已定位：${activeDoor.value.code}`
})

const normalizeDoorNumber = (value) =>
  typeof value === 'string' ? value.replace(/\D+/g, '') : ''
const normalizeSearchText = (value) =>
  typeof value === 'string' ? value.toLowerCase().replace(/\s+/g, '') : ''

const floor2AliasMap = new Map([
  ['教务办公室', ['31218']],
  ['辅导员办公室', ['31217']],
  ['办公室', ['31218', '31217']],
  ['自习室', ['自习长廊']],
  ['自习', ['自习长廊']],
  ['电梯', ['楼梯/电梯']],
  ['楼梯', ['楼梯/电梯']],
  ['卫生间', ['厕所']],
])
const firstFloorLookupMap = new Map(
  floorDoorMap['1F'].map((door) => [normalizeDoorNumber(door.code), door]),
)

const locateDoor = (door) => {
  activeFloor.value = '1F'
  activeDoor.value = door
  query.value = normalizeDoorNumber(door.code)
  activeSvgLabel.value = ''
  clearFloor2Highlights()
}

const clearFloor2Highlights = () => {
  floor2HighlightedEls.value.forEach((el) => el.classList.remove('svg-text-hit'))
  floor2HighlightedEls.value = []
}

const buildFloor2TextIndex = () => {
  if (!floor2SvgContainer.value) return

  const textElements = Array.from(
    floor2SvgContainer.value.querySelectorAll('svg text'),
  )

  floor2TextIndex.value = textElements
    .map((element) => {
      const text = element.textContent?.trim() ?? ''
      return {
        element,
        text,
        normalized: normalizeSearchText(text),
      }
    })
    .filter((item) => item.text.length > 0)
}

const loadFloor2Svg = async () => {
  if (floor2SvgMarkup.value) return

  const response = await fetch(withBase('/resources/map/敏行楼2楼剖面图.svg'))
  floor2SvgMarkup.value = await response.text()
  await nextTick()
  buildFloor2TextIndex()
}

const highlightFloor2Matches = (matches) => {
  clearFloor2Highlights()

  matches.forEach((match) => {
    match.element.classList.add('svg-text-hit')
  })

  floor2HighlightedEls.value = matches.map((match) => match.element)
  activeSvgLabel.value = matches.slice(0, 3).map((match) => match.text).join('、')
}

const searchDoor = async () => {
  const rawQuery = query.value?.trim()
  if (!rawQuery) {
    activeDoor.value = null
    activeSvgLabel.value = ''
    clearFloor2Highlights()
    return
  }

  if (activeFloor.value === '2F') {
    if (!floor2SvgMarkup.value) {
      await loadFloor2Svg()
    }

    const normalizedText = normalizeSearchText(rawQuery)
    const directMatches = floor2TextIndex.value.filter(({ normalized }) =>
      normalized.includes(normalizedText),
    )
    const aliasTargets = floor2AliasMap.get(normalizedText) ?? []
    const aliasMatches = aliasTargets.flatMap((target) => {
      const normalizedTarget = normalizeSearchText(target)
      return floor2TextIndex.value.filter(({ normalized }) =>
        normalized.includes(normalizedTarget),
      )
    })
    const mergedMatches = Array.from(
      new Map(
        [...directMatches, ...aliasMatches].map((item) => [item.text, item]),
      ).values(),
    )

    if (mergedMatches.length > 0) {
      activeDoor.value = null
      highlightFloor2Matches(mergedMatches)
      return
    }

    activeDoor.value = null
    activeSvgLabel.value = ''
    clearFloor2Highlights()
    return
  }

  const normalizedNumber = normalizeDoorNumber(rawQuery)
  const normalizedCode = rawQuery.toUpperCase().replace(/\s+/g, '')
  const matchedDoor =
    firstFloorLookupMap.get(normalizedNumber) ??
    floorDoorMap['1F'].find((door) => door.code === normalizedCode)

  if (matchedDoor) {
    locateDoor(matchedDoor)
    return
  }

  activeDoor.value = null
  activeSvgLabel.value = ''
}

const switchFloor = (floor) => {
  activeFloor.value = floor
  if (floor === '2F' && !floor2SvgMarkup.value) {
    loadFloor2Svg()
  }
  if (floor !== '1F') {
    activeDoor.value = null
  }
  if (floor !== '2F') {
    activeSvgLabel.value = ''
    clearFloor2Highlights()
  }
}

onMounted(() => {
  if (activeFloor.value === '2F') {
    loadFloor2Svg()
  }
})
</script>

<style scoped>
.minxing-floor-search {
  --door-active-color: #d1242f;
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
  background: #fff;
  border-radius: 6px;
}

#door-search-input:focus {
  border-color: var(--c-brand);
  outline: 2px solid rgba(62, 175, 124, 0.2);
  outline-offset: 1px;
}

.search-row button,
.floor-btn,
.door-tag {
  border: 1px solid var(--c-brand);
  background: var(--c-bg-light);
  color: var(--c-brand);
  border-radius: 6px;
  cursor: pointer;
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
  color: #fff;
}

.map-stage {
  border: 1px solid var(--c-border);
  border-radius: 8px;
  overflow: hidden;
  background: #f7f9fb;
}

.map-inner {
  position: relative;
}

.map-image {
  display: block;
  width: 100%;
  height: auto;
}

.map-svg-container :deep(svg) {
  display: block;
  width: 100%;
  height: auto;
}

.map-svg-container :deep(svg text.svg-text-hit) {
  fill: var(--door-active-color) !important;
  stroke: #fff;
  stroke-width: 6px;
  paint-order: stroke fill;
  font-weight: 700;
  animation: blink 0.8s ease-in-out infinite;
}

.door-tag {
  position: absolute;
  transform: translate(-50%, -50%);
  padding: 0.05rem 0.32rem;
  font-size: 0.65rem;
  line-height: 1.3;
}

.door-tag.active {
  background: #ffefef;
  color: var(--door-active-color);
  border-color: var(--door-active-color);
  animation: blink 0.8s ease-in-out infinite;
}

.placeholder {
  border: 1px dashed var(--c-border);
  border-radius: 8px;
  padding: 1rem;
  color: var(--c-text-light);
  background: var(--c-bg-light);
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
