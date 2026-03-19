<template>
  <section class="minxing-floor-search" id="door-search">
    <div class="search-row">
      <input
        id="door-search-input"
        v-model.trim="query"
        type="search"
        inputmode="search"
        autocomplete="off"
        placeholder="输入门牌号，如 MX101"
        aria-label="敏行楼门牌号搜索"
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
      <div
        class="map-inner"
        :style="{
          transform: `scale(${zoomScale})`,
          transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`
        }"
      >
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

    <div v-else class="placeholder">{{ activeFloor }} 剖面图暂未制作，敬请期待。</div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { withBase } from '@vuepress/client'

const floors = ['1F', '2F', '3F', '4F', '5F']
const activeFloor = ref('1F')
const query = ref('')
const activeDoor = ref(null)

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
const ACTIVE_ZOOM_SCALE = 1.35

const floorDoors = computed(() => floorDoorMap[activeFloor.value] ?? [])

const searchMessage = computed(() => {
  if (!query.value) return '支持搜索门牌号：MX101 - MX110'
  if (!activeDoor.value) return `未找到门牌号：${query.value}`
  return `已定位：${activeDoor.value.code}`
})

const zoomScale = computed(() => (activeDoor.value ? ACTIVE_ZOOM_SCALE : 1))
const zoomOrigin = computed(() => {
  if (!activeDoor.value) return { x: 50, y: 50 }
  return { x: activeDoor.value.x, y: activeDoor.value.y }
})

const normalizeRoomCode = (value) =>
  typeof value === 'string' ? value.replace(/\s+/g, '').toUpperCase() : ''
const firstFloorLookupMap = new Map(
  floorDoorMap['1F'].map((door) => [normalizeRoomCode(door.code), door]),
)

const locateDoor = (door) => {
  activeFloor.value = '1F'
  activeDoor.value = door
  query.value = door.code
}

const searchDoor = () => {
  const normalized = normalizeRoomCode(query.value)
  if (!normalized) {
    activeDoor.value = null
    return
  }

  const matchedDoor = firstFloorLookupMap.get(normalized)

  if (matchedDoor) {
    locateDoor(matchedDoor)
    return
  }

  activeDoor.value = null
}

const switchFloor = (floor) => {
  activeFloor.value = floor
  if (floor !== '1F') {
    activeDoor.value = null
  }
}
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
  flex: 1;
  padding: 0.45rem 0.6rem;
  border: 1px solid var(--c-border);
  border-radius: 6px;
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
  transform-origin: center;
  transition: transform 0.35s ease;
}

.map-image {
  display: block;
  width: 100%;
  height: auto;
}

.door-tag {
  position: absolute;
  transform: translate(-50%, -50%);
  padding: 0.05rem 0.32rem;
  font-size: 0.65rem;
  line-height: 1.3;
  transition: transform 0.2s ease;
}

.door-tag.active {
  background: #ffefef;
  color: var(--door-active-color);
  border-color: var(--door-active-color);
  transform: translate(-50%, -50%) scale(1.25);
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
