<script setup lang="ts">
import type { Component } from 'vue'
import { useThemeStore } from '@/stores/themeStore'
import instance from '@/utils/axios'
import CalendarCheckmark24Regular from '@vicons/fluent/CalendarCheckmark24Regular' // 导入图标
import TaskListLtr24Filled from '@vicons/fluent/TaskListLtr24Filled' // 导入图标

import { type MenuOption, NAvatar, NButton, NIcon, NLayout, NLayoutSider, NMenu, NPopover, NSpace } from 'naive-ui'
import { h, onBeforeMount, ref } from 'vue'

const themeStore = useThemeStore()

const avatarLink = ref('')

onBeforeMount(async () => {
  // 模拟异步获取头像地址
  const response = await instance.get('/api/v1/user/getTheAvatar')
  const data = await response.data.data
  avatarLink.value = data
})
// 控制 Popover 的显示状态
const showPopover = ref(false)
function renderIcon(icon: Component) {
  return () => h(NIcon, { style: 'display: flex; align-items: center; justify-content: center;' }, { default: () => h(icon) })
}

// 处理菜单项点击事件
function handleMenuClick(action: string) {
  console.log('点击了:', action)
  showPopover.value = false // 关闭 Popover
}

const menuOptions: MenuOption[] = [
  {
    key: 'task',
    icon: renderIcon(TaskListLtr24Filled),
  },
  {
    key: 'calendar',
    icon: renderIcon(CalendarCheckmark24Regular),
  },
]
</script>

<template>
  <NConfigProvider :theme="themeStore.theme">
    <NLayout class="NLayoutSider" has-sider>
      <NLayoutSider
        bordered
        collapse-mode="width"
        :width="50"
        style="height: 100vh;"
      >
        <NSpace align="center" vertical style="height: 100%;">
          <!-- 使用 NPopover 包裹 NAvatar -->
          <NPopover
            v-model:show="showPopover"
            trigger="click"
            placement="right"
            :show-arrow="false"
          >
            <template #trigger>
              <NAvatar
                size="large"
                :src="avatarLink"
                style="cursor: pointer; margin-top: 20px;"
              />
            </template>
            <!-- Popover 内容 -->
            <div style="padding: 8px;">
              <NButton
                text
                block
                style="display: flex; justify-content: center; align-items: center;"
                @click="handleMenuClick('profile')"
              >
                <NIcon style="margin-right: 8px;">
                  <TaskListLtr24Filled />
                </NIcon>
                个人资料
              </NButton>
              <NButton
                text
                block
                style="display: flex; justify-content: center; align-items: center;"
                @click="handleMenuClick('settings')"
              >
                <NIcon style="margin-right: 8px;">
                  <CalendarCheckmark24Regular />
                </NIcon>
                设置
              </NButton>
              <NButton
                text
                block
                style="display: flex; justify-content: center; align-items: center;"
                @click="handleMenuClick('logout')"
              >
                退出登录
              </NButton>
            </div>
          </NPopover>
          <NMenu
            :options="menuOptions"
            style="flex: 1; display: flex; flex-direction: column; justify-content: center; height: 100%; align-items: center;"
          />
        </NSpace>
      </NLayoutSider>
      <NLayout>内容</NLayout>
    </NLayout>
  </NConfigProvider>
</template>

<style lang="css" scoped>
/* 使用 ::v-deep 使样式覆盖 NMenu 的默认样式 */
::v-deep .n-menu .n-menu-item-content {
  padding-left: 25px !important; /* 移除默认的 padding-left */
  display: flex;
  align-items: center;
  justify-content: center; /* 确保图标和文本居中 */
}

::v-deep .n-menu-item-content .n-menu-item-content__icon {
  margin-right: 8px; /* 可以设置图标和文本之间的间距 */
}
</style>
