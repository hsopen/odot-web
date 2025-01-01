<script setup lang="ts">
import { useLocaleStore } from '@/stores/i18n'
import Translate24Filled from '@vicons/fluent/Translate24Filled' // 导入图标
import { NButton, NIcon, NPopover } from 'naive-ui'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const localeStore = useLocaleStore()
const { locale } = useI18n()
const showPopover = ref(false) // 控制弹出框的显示状态

function changeLanguage(lang: string) {
  locale.value = lang
  localeStore.setLocale(lang)
  showPopover.value = false // 选择后关闭弹出框
}
</script>

<template>
  <NPopover
    v-model:show="showPopover"
    trigger="click"
    placement="bottom"
    :show-arrow="false"
  >
    <template #trigger>
      <NButton text>
        <NIcon :component="Translate24Filled" size="24" />
      </NButton>
    </template>

    <!-- 自定义选择框内容 -->
    <div style="padding: 8px; width: 120px">
      <div
        v-for="option in [
          { value: 'en', label: 'English' },
          { value: 'zh', label: '中文' },
        ]"
        :key="option.value"
        style="
          padding: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
        "
        @click="changeLanguage(option.value)"
      >
        <span>{{ option.label }}</span>
      </div>
    </div>
  </NPopover>
</template>
