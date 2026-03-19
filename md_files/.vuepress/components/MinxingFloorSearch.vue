<template>
  <section class="minxing-floor-search" id="door-search">
    <div class="search-row">
      <input
        id="door-search-input"
        v-model.trim="query"
        type="search"
        inputmode="text"
        autocomplete="off"
        placeholder="输入门牌号/片区，如 31201、zone-31x01-31x14"
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

    <div class="map-stage">
      <div
        ref="activeSvgContainer"
        class="map-svg-container"
        v-html="activeSvgMarkup"
      />
    </div>
  </section>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { withBase } from '@vuepress/client'

const floors = ['1F', '2F', '3F', '4F']
const activeFloor = ref('1F')
const query = ref('')
const searchMessage = ref('')
const normalizeSearchText = (value) =>
  typeof value === 'string' ? value.toLowerCase().replace(/\s+/g, '') : ''

const zoneAlternatePhaseModulo = 2
const zoneAlternatePhaseRemainder = 1
const floorSvgPathMap = {
  '1F': '/resources/map/敏行楼剖面图1.svg',
  '2F': '/resources/map/敏行楼剖面图2.svg',
  '3F': '/resources/map/敏行楼剖面图3.svg',
  '4F': '/resources/map/敏行楼剖面图4.svg',
}

const floorSvgMarkupMap = ref({
  '1F': '',
  '2F': '',
  '3F': '',
  '4F': '',
})
const activeSvgContainer = ref(null)
const textIndexByFloor = ref({
  '1F': [],
  '2F': [],
  '3F': [],
  '4F': [],
})
const zoneIndexByFloor = ref({
  '1F': [],
  '2F': [],
  '3F': [],
  '4F': [],
})
const highlightedTextElsByFloor = ref({
  '1F': [],
  '2F': [],
  '3F': [],
  '4F': [],
})
const highlightedZoneElsByFloor = ref({
  '1F': [],
  '2F': [],
  '3F': [],
  '4F': [],
})

const activeSvgMarkup = computed(() => floorSvgMarkupMap.value[activeFloor.value] ?? '')

const zoneTokenRegex = /^(\d\d)(.)(\d\d)$/

const parseZoneToken = (token) => {
  const normalized = normalizeSearchText(token)
  const match = normalized.match(zoneTokenRegex)
  if (!match) return null
  return {
    prefix: match[1],
    middle: match[2],
    suffix: Number(match[3]),
  }
}

const parseZoneIdRange = (zoneId) => {
  const match = normalizeSearchText(zoneId).match(/^zone-([^-]+)-([^-]+)$/)
  if (!match) return null
  const start = parseZoneToken(match[1])
  const end = parseZoneToken(match[2])
  if (!start || !end) return null
  return { start, end }
}

const roomCodeRegex = /^(\d\d)([\dx])(\d\d)$/i

const parseRoomCode = (value) => {
  const normalized = normalizeSearchText(value)
  const match = normalized.match(roomCodeRegex)
  if (!match) return null
  return {
    normalized,
    prefix: match[1],
    middle: match[2],
    suffix: Number(match[3]),
  }
}

const parseFloorFromRoomCode = (value) => {
  const normalized = normalizeSearchText(value)
  const match = normalized.match(/^(\d\d)([1-4])(\d\d)$/)
  if (!match) return null
  const parsedFloor = `${match[2]}F`
  return floors.includes(parsedFloor) ? parsedFloor : null
}

const zoneMiddleMatches = (zoneMiddle, roomMiddle) =>
  zoneMiddle === 'x' || zoneMiddle === roomMiddle

const isRoomInZoneRange = (roomCode, range) => {
  if (!roomCode || !range) return false
  if (
    range.start.prefix > roomCode.prefix ||
    range.end.prefix < roomCode.prefix
  ) {
    return false
  }
  if (!zoneMiddleMatches(range.start.middle, roomCode.middle)) return false
  if (!zoneMiddleMatches(range.end.middle, roomCode.middle)) return false
  if (range.start.prefix === roomCode.prefix && roomCode.suffix < range.start.suffix) {
    return false
  }
  if (range.end.prefix === roomCode.prefix && roomCode.suffix > range.end.suffix) {
    return false
  }
  return true
}

const floorAliasMap = new Map([
  ['自习室', ['自习长廊']],
  ['自习', ['自习长廊']],
  ['电梯', ['楼梯/电梯']],
  ['楼梯', ['楼梯/电梯']],
  ['卫生间', ['厕所']],
])

const clearTextHighlights = (floor) => {
  highlightedTextElsByFloor.value[floor].forEach((el) =>
    el.classList.remove('svg-text-hit'),
  )
  highlightedTextElsByFloor.value[floor] = []
}

const clearZoneHighlights = (floor) => {
  highlightedZoneElsByFloor.value[floor].forEach((el) => {
    el.classList.remove('svg-zone-hit')
    el.classList.remove('svg-zone-hit-alt')
  })
  highlightedZoneElsByFloor.value[floor] = []
}

const clearAllHighlights = () => {
  floors.forEach((floor) => {
    clearTextHighlights(floor)
    clearZoneHighlights(floor)
  })
}

const buildTextIndex = (floor) => {
  if (!activeSvgContainer.value) return
  const textElements = Array.from(activeSvgContainer.value.querySelectorAll('svg text'))
  textIndexByFloor.value[floor] = textElements
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

const buildZoneIndex = (floor) => {
  if (!activeSvgContainer.value) return
  const zoneElements = Array.from(activeSvgContainer.value.querySelectorAll('svg [id^="zone-"]'))
  zoneIndexByFloor.value[floor] = zoneElements
    .map((element) => {
      const id = element.getAttribute('id') ?? ''
      const range = parseZoneIdRange(id)
      if (!range) return null
      return {
        element,
        id: id.toLowerCase(),
        range,
      }
    })
    .filter(Boolean)
}

const loadFloorSvg = async (floor) => {
  if (floorSvgMarkupMap.value[floor]) return
  const response = await fetch(withBase(floorSvgPathMap[floor]))
  floorSvgMarkupMap.value[floor] = await response.text()
  await nextTick()
  buildTextIndex(floor)
  buildZoneIndex(floor)
}

const highlightTextMatches = (floor, matches) => {
  clearTextHighlights(floor)
  matches.forEach((match) => {
    match.element.classList.add('svg-text-hit')
  })
  highlightedTextElsByFloor.value[floor] = matches.map((match) => match.element)
}

const highlightZoneMatches = (floor, matches) => {
  clearZoneHighlights(floor)
  matches.forEach((match, index) => {
    match.element.classList.add('svg-zone-hit')
    if (
      matches.length > 1 &&
      index % zoneAlternatePhaseModulo === zoneAlternatePhaseRemainder
    ) {
      match.element.classList.add('svg-zone-hit-alt')
    }
  })
  highlightedZoneElsByFloor.value[floor] = matches.map((match) => match.element)
}

const searchDoor = async () => {
  const rawQuery = query.value?.trim()
  if (!rawQuery) {
    searchMessage.value = '请输入门牌号（格式：xx?xx）或片区编号后点击搜索'
    clearAllHighlights()
    return
  }

  const targetFloor = parseFloorFromRoomCode(rawQuery)
  if (targetFloor && activeFloor.value !== targetFloor) {
    switchFloor(targetFloor)
  }

  if (!floorSvgMarkupMap.value[activeFloor.value]) {
    await loadFloorSvg(activeFloor.value)
  }

  const normalizedText = normalizeSearchText(rawQuery)
  const textIndex = textIndexByFloor.value[activeFloor.value]
  const zoneIndex = zoneIndexByFloor.value[activeFloor.value]

  const directMatches = textIndex.filter(({ normalized }) =>
    normalized.includes(normalizedText),
  )
  const aliasTargets = floorAliasMap.get(normalizedText) ?? []
  const aliasMatches = aliasTargets.flatMap((target) => {
    const normalizedTarget = normalizeSearchText(target)
    return textIndex.filter(({ normalized }) =>
      normalized.includes(normalizedTarget),
    )
  })
  const mergedMatches = Array.from(
    new Map(
      [...directMatches, ...aliasMatches].map((item) => [item.text, item]),
    ).values(),
  )

  const queryRoomCode = parseRoomCode(rawQuery)
  const zoneMatches = zoneIndex.filter((zone) => {
    if (normalizeSearchText(zone.id) === normalizedText) return true
    return isRoomInZoneRange(queryRoomCode, zone.range)
  })

  clearAllHighlights()

  if (mergedMatches.length > 0 || zoneMatches.length > 0) {
    highlightTextMatches(activeFloor.value, mergedMatches)
    highlightZoneMatches(activeFloor.value, zoneMatches)
    const labels = []
    if (mergedMatches.length > 0) {
      labels.push(...mergedMatches.slice(0, 2).map((item) => item.text))
    }
    if (zoneMatches.length > 0) {
      labels.push(...zoneMatches.slice(0, 2).map((zone) => zone.id))
    }
    searchMessage.value = `已定位 ${activeFloor.value}：${labels.join('、')}`
    return
  }

  searchMessage.value = `未找到 ${activeFloor.value} 对应门牌号：${rawQuery}`
}

const switchFloor = (floor) => {
  activeFloor.value = floor
  searchMessage.value = `当前 ${floor}，支持格式 xx?xx（?为楼层）与 zone-xx?xx-xx?xx`
  if (!floorSvgMarkupMap.value[floor]) {
    loadFloorSvg(floor)
  }
}

onMounted(() => {
  searchMessage.value = '支持 1-4 层门牌号搜索（格式：xx?xx，?为楼层）'
  loadFloorSvg(activeFloor.value)
})
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
  background: #fff;
  border-radius: 6px;
}

#door-search-input:focus {
  border-color: var(--c-brand);
  outline: 2px solid rgba(62, 175, 124, 0.2);
  outline-offset: 1px;
}

.search-row button,
.floor-btn {
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

.map-svg-container :deep(svg .svg-zone-hit) {
  stroke: var(--door-active-color) !important;
  stroke-width: 10px !important;
  fill-opacity: 0.6 !important;
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
