<script setup lang="ts">
import { NLayout, NLayoutContent, NLayoutSider, NSpace } from 'naive-ui'
import { computed, ref, watch } from 'vue'

import allTasks from './allTaskComponents/allTasks.vue' // 全部任务组件
import importantTask from './allTaskComponents/importantTask.vue' // 重要任务组件
import todayTasks from './allTaskComponents/todayTasks.vue' // 今日任务组件

// 侧边栏选项
const sidebarOptions = computed(() => [
  {
    value: 'allTasks',
    label: '全部任务',
    component: allTasks, // 绑定对应的组件
  },
  {
    value: 'todayTasks',
    label: '今日任务',
    component: todayTasks, // 绑定对应的组件
  },
  {
    value: 'importantTask',
    label: '重要任务',
    component: importantTask, // 绑定对应的组件
  },

])

// 当前选中的值
const sidebarSelectedValue = ref<string | null>('allTasks') // 默认选中今日任务

// 处理按钮点击事件
function handleButtonClick(value: string) {
  sidebarSelectedValue.value = value
}

// 监听选中的值变化
watch(sidebarSelectedValue, (newValue, oldValue) => {
  console.log(`sidebarSelectedValue 变化: ${oldValue} -> ${newValue}`)
})

// 获取当前选中的组件
const currentComponent = computed(() => {
  const option = sidebarOptions.value.find(opt => opt.value === sidebarSelectedValue.value)
  return option ? option.component : null
})
</script>

<template>
  <NSpace vertical size="large">
    <NLayout style="display: flex;" has-sider>
      <!-- 侧边栏 -->
      <NLayoutSider class="sider">
        <div class="sider-Button-Group">
          <button
            v-for="option in sidebarOptions" :key="option.value" class="sider-Button"
            :class="{ 'sider-Button--selected': sidebarSelectedValue === option.value }"
            @click="handleButtonClick(option.value)"
          >
            {{ option.label }}
          </button>
        </div>
      </NLayoutSider>

      <!-- 内容区域 -->
      <NLayoutContent class="content">
        <component :is="currentComponent" /> <!-- 动态渲染组件 -->
      </NLayoutContent>
    </NLayout>
  </NSpace>
</template>

<style scoped>
.sider {
  display: block;
  background-color: rgb(241, 255, 255);
  height: 100vh;
  width: 250px; /* 修改为 250px */
  overflow-y: auto; /* 侧边栏独立滚动 */
}

.content {
  background-color: rgb(210, 253, 239);
  height: 100vh;
  /* 内容区域高度 */
  overflow-y: auto;
  /* 内容区域独立滚动 */
}

.sider-Button-Group {
  width: 100%;
  /* 让按钮组充满整个容器 */
  display: flex;
  flex-direction: column;
  /* 垂直排列按钮 */
}

.sider-Button {
  width: 100%;
  /* 让按钮宽度填满容器 */
  text-align: left;
  /* 文本左对齐 */
  border: none;
  /* 移除边框 */
  background-color: transparent;
  /* 移除背景色 */
  padding: 10px 15px;
  /* 内边距 */
  cursor: pointer;
  /* 鼠标指针样式 */
  font-size: 14px;
  /* 字体大小 */
  transition:
    background-color 0.3s,
    font-weight 0.3s;
  /* 过渡效果 */
}

.sider-Button:hover {
  background-color: rgba(0, 0, 0, 0.05);
  /* 鼠标悬停时的背景色 */
}

/* 选中状态的样式 */
.sider-Button--selected {
  font-weight: bold;
  /* 加粗 */
  background-color: #e6f7ff;
  /* 浅蓝色背景 */
}

/* 聚焦状态的样式 */
.sider-Button:focus {
  outline: none;
  /* 移除默认的聚焦轮廓 */
  font-weight: bold;
  /* 加粗 */
  background-color: #e6f7ff;
  /* 浅蓝色背景 */
  color: rgb(34, 100, 255);
}
</style>
