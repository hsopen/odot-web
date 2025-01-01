<script setup lang="ts">
import { useLocaleStore } from '@/stores/i18n'
import { dateEnUS, dateZhCN, enUS, NConfigProvider, NMessageProvider, zhCN } from 'naive-ui'
import { computed } from 'vue'

const localeStore = useLocaleStore()

// 根据语言状态动态设置 Naive UI 的语言和日期格式
const naiveLocale = computed(() => {
  return localeStore.locale === 'zh' ? zhCN : enUS
})

const naiveDateLocale = computed(() => {
  return localeStore.locale === 'zh' ? dateZhCN : dateEnUS
})
</script>

<template>
  <NConfigProvider :locale="naiveLocale" :date-locale="naiveDateLocale">
    <NMessageProvider>
      <router-view />
    </NMessageProvider>
  </NConfigProvider>
</template>
