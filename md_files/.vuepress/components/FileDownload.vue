<template>
    <div class="file-download-container">
        <span class="file-name">{{ name }}</span>
        <a href="javascript:void(0)" @click="handleDownload" class="download-btn">
            下载
        </a>
    </div>
</template>

<script setup>
import { withBase } from "@vuepress/client"

const props = defineProps({
    href: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    downloadName: {
        type: String,
        default: undefined
    }
})

const handleDownload = () => {
    const hostname = window.location.hostname
    // 判断是否为“公文字体包.zip”
    if (hostname.includes("sdsmu.com") && props.name === "公文字体包.zip") {
        // 跳转到 api.sdsmu.com 的专用链接
        window.open("https://download.sdsmu.com/%E5%85%AC%E6%96%87%E5%AD%97%E4%BD%93%E5%8C%85.zip", "_blank")
        return
    }
    // 其它情况
    const link = document.createElement("a")
    link.href = withBase(props.href)
    link.download = props.downloadName || props.name
    link.target = "_blank"
    link.click()
}
</script>

<style scoped>
.file-download-container {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    margin: 0.5rem 0;
}

.file-name {
    font-weight: 500;
    font-family: var(--font-family-code);
    font-size: 0.9em;
    color: var(--c-text);
    background-color: var(--c-bg-light, rgba(125, 125, 125, 0.1));
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    border: 1px solid var(--c-border, transparent);
}

.download-btn {
    display: inline-block;
    font-size: 0.95rem;
    font-weight: bold;
    padding: 4px 10px;
    border: 2px solid var(--c-brand);
    border-radius: 4px;
    color: var(--c-brand);
    text-decoration: none;
    transition: all 0.3s;
    cursor: pointer;
    white-space: nowrap;
}

.download-btn:hover {
    background-color: var(--c-brand);
    color: white;
    text-decoration: none;
}
</style>
