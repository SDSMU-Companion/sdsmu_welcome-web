---
title: 浮烟山校区 - 敏行楼
tags:
  - MX101
  - MX102
  - MX103
  - MX104
  - MX105
  - MX106
  - MX107
  - MX108
  - MX109
  - MX110
---

## 敏行楼门牌号搜索

<MinxingFloorSearch />

### 门牌号搜索入口

右上角全局搜索命中门牌号后，可跳转到本区域，再在上方搜索框中继续定位。

### 如何基于现有 SVG 制作或修改楼层剖面图（当前已完成 1 楼）

1. 复制 `/resources/map/浮烟山校区敏行楼.svg` 的整体风格（配色、线宽、圆角）新建楼层图。
2. 保持 `viewBox` 固定，走廊与房间使用矩形/路径分层表达，门牌号用文本元素叠加。
3. 一楼剖面图使用 `/resources/map/敏行楼1楼剖面图.svg`，后续楼层可按同尺寸补齐。
4. 若门牌位置有变动，只需同步更新 `MinxingFloorSearch` 组件内的坐标数据即可。

<FigureImage src="/resources/map/浮烟山校区敏行楼.svg" title="浮烟山校区敏行楼地图" downloadLink="/resources/map/浮烟山校区敏行楼.webp"></FigureImage>
