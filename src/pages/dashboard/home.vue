<script setup lang="ts">
import type { Component } from 'vue'
import allTaskComponents from '@/components/dashboard/allTaskComponents.vue'
import todayComponents from '@/components/dashboard/todayTaskComponents.vue'
import instance from '@/utils/axios'
import CalendarCheckmark24Regular from '@vicons/fluent/CalendarCheckmark24Regular'
import Settings24Regular from '@vicons/fluent/Settings24Regular'
import TaskListLtr24Filled from '@vicons/fluent/TaskListLtr24Filled'
import {
  NAvatar,
  NButton,
  NIcon,
  NLayout,
  NLayoutSider,
  NPopover,
  NSpace,
} from 'naive-ui'
import { onBeforeMount, ref, shallowRef } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const avatarLink = ref('')
const showPopover = ref(false)
const currentComponent = shallowRef<Component | null>(allTaskComponents)

onBeforeMount(async () => {
  try {
    const response = await instance.get(`${import.meta.env.VITE_API_HOST}/api/v1/user/getAvatar`)
    avatarLink.value = response.data?.data?.url || ''
  }
  catch (error) {
    console.error('获取头像失败:', error)
  }
})

function handleMenuClick(action: string) {
  showPopover.value = false
  if (action === 'task') {
    currentComponent.value = allTaskComponents
  }
  else if (action === 'calendar') {
    currentComponent.value = todayComponents
  }
  else if (action === 'settings') {
    console.log('打开设置')
  }
  else if (action === 'profile') {
    router.push('/dashboard/profile')
  }
}

function handleLogout() {
  localStorage.clear()
  sessionStorage.clear()
  document.cookie.split(';').forEach((cookie) => {
    document.cookie = cookie.replace(/^ +/, '')
      .replace(/=.*/, `=;expires=${new Date(0).toUTCString()};path=/`)
  })
  window.location.href = '/login'
}
</script>

<template>
  <NLayout class="NLayoutSider" has-sider>
    <NLayoutSider
      bordered collapse-mode="width" :width="50"
      style="height: 100vh; display: flex; flex-direction: column;"
    >
      <NSpace align="center" vertical style="height: 100%;">
        <!-- 头像和弹出菜单 -->
        <NPopover
          v-model:show="showPopover" trigger="click" placement="right" :show-arrow="false"
          style="width: 100px;"
        >
          <template #trigger>
            <NAvatar
              size="large" :src="avatarLink"
              style="cursor: pointer; margin-top: 20px; border: 2px solid #ccc;"
            />
          </template>
          <div style="padding: 8px;">
            <NButton
              text block style="justify-content: flex-start; padding-left: 12px; margin-bottom: 8px;"
              @click="handleMenuClick('profile')"
            >
              个人资料
            </NButton>
            <NButton
              text block style="justify-content: flex-start; padding-left: 12px; color: #ff4500;"
              @click="handleLogout"
            >
              退出登录
            </NButton>
          </div>
        </NPopover>

        <!-- 自定义菜单 -->
        <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 16px; margin-top: 20px;">
          <NButton text @click="handleMenuClick('task')">
            <NIcon size="24">
              <TaskListLtr24Filled />
            </NIcon>
          </NButton>
          <NButton text @click="handleMenuClick('calendar')">
            <NIcon size="24">
              <CalendarCheckmark24Regular />
            </NIcon>
          </NButton>
          <NButton text @click="handleMenuClick('settings')">
            <NIcon size="24">
              <Settings24Regular />
            </NIcon>
          </NButton>
        </div>
      </NSpace>
    </NLayoutSider>
    <NLayout>
      <component :is="currentComponent" />
    </NLayout>
  </NLayout>
</template>

<style lang="css" scoped>
/* 侧边栏布局 */
.NLayoutSider {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

/* 菜单项样式 */
.n-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 8px;
}

/* 弹出菜单左对齐 */
:deep(.n-popover .n-button__content) {
  justify-content: flex-start !important;
  width: 100%;
}
</style>
