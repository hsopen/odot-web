import { darkTheme } from 'naive-ui'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<any>(null) // 主题的类型可以是 `any`，因为是 Naive UI 的 `ConfigProvider` 主题

  // 切换主题的函数
  function toggleTheme() {
    if (theme.value && theme.value.name === 'dark') {
      theme.value = null
      localStorage.setItem('theme', 'light')
    }
    else {
      theme.value = darkTheme
      localStorage.setItem('theme', 'dark')
    }
  }

  // 页面加载时从 localStorage 获取存储的主题
  function loadThemeFromStorage() {
    const storedTheme = localStorage.getItem('theme')
    if (storedTheme === 'dark') {
      theme.value = darkTheme
    }
    else {
      theme.value = null
    }
  }

  // 初始化时加载主题
  loadThemeFromStorage()

  return { theme, toggleTheme }
})
