<script setup lang="ts">
import { useThemeStore } from '@/stores/themeStore'
import WeatherMoon24Regular from '@vicons/fluent/WeatherMoon24Regular'
import WeatherSunny24Regular from '@vicons/fluent/WeatherSunny24Regular'
import { darkTheme, NButton, NCard, NConfigProvider, NIcon } from 'naive-ui'

const themeStore = useThemeStore()
</script>

<template>
  <NConfigProvider :theme="themeStore.theme">
    <NButton text @click="themeStore.toggleTheme">
      <NIcon size="24">
        <!-- 根据 themeStore.theme 判断使用的图标 -->
        <component :is="themeStore.theme === null ? WeatherMoon24Regular : WeatherSunny24Regular" />
      </NIcon>
    </NButton>
  </NConfigProvider>
</template>
