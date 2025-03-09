<script setup lang="ts">
import instance from '@/utils/axios'
import { NInfiniteScroll } from 'naive-ui'
import { nextTick, onMounted, ref } from 'vue'

interface Task {
  id: string
  title: string
  status: boolean
  scheduled_task_time: string
  tag: string[]
}

// 响应式数据
const tasks = ref<Task[]>([])
const cursor = ref<string | null>(null)
const isLoading = ref<boolean>(false)
const isEnd = ref<boolean>(false)
const selectedTask = ref<Task | null>(null)
const containerHeight = ref('100vh')

// 样式相关
const fixedColors: string[] = ['#ff7f50', '#87cefa', '#32cd32', '#6495ed']

// 方法
function getColorByIndex(index: number): string {
  return fixedColors[index % fixedColors.length]
}

async function handleLoad(): Promise<void> {
  if (isLoading.value || isEnd.value)
    return
  isLoading.value = true

  try {
    const response = await instance.get<{
      status: boolean
      data: {
        tasks: Task[]
        nextCursor: string | null
      }
      msg: string
    }>(`${import.meta.env.VITE_API_HOST}/api/v1/task/getAllTasks`, {
      params: { cursor: cursor.value },
    })

    if (response.data.status) {
      const newTasks = response.data.data.tasks
      tasks.value = [...tasks.value, ...newTasks]
      cursor.value = response.data.data.nextCursor

      // 根据返回数据量判断是否结束
      if (newTasks.length < 10 || !cursor.value) {
        isEnd.value = true
      }

      // 强制滚动容器更新
      nextTick(() => {
        const container = document.querySelector('.infinite-scroll-container')
        if (container)
          container.scrollTop += 1
      })
    }
  }
  catch (error) {
    console.error('请求失败:', error)
  }
  finally {
    isLoading.value = false
  }
}

async function updateTaskStatus(taskId: string, status: boolean): Promise<void> {
  try {
    const response = await instance.post(`${import.meta.env.VITE_API_HOST}/api/v1/task/updateTaskStatus`, {
      taskId,
      status,
    })

    if (response.data.status) {
      const task = tasks.value.find(t => t.id === taskId)
      if (task)
        task.status = status
    }
  }
  catch (error) {
    console.error('请求失败:', error)
  }
}

function formatDateTime(dateTime: string): string {
  return dateTime ? new Date(dateTime).toLocaleString() : '未设置时间'
}

function handleTaskClick(task: Task): void {
  if (selectedTask.value?.id === task.id) {
    selectedTask.value = null // 如果当前已选中，再次点击关闭
  }
  else {
    selectedTask.value = task // 选择新任务
  }
}

function closeRightPanel(): void {
  selectedTask.value = null
}

// 生命周期
onMounted(() => {
  // 动态计算容器高度
  const header = document.querySelector('.task-title-header')
  const headerHeight = header ? header.clientHeight + 40 : 100
  containerHeight.value = `calc(100vh - ${headerHeight}px)`

  handleLoad()
})
</script>

<template>
  <div class="task-container">
    <h2 class="task-title-header">
      所有任务
    </h2>

    <div class="main-content" :style="{ height: containerHeight }">
      <NInfiniteScroll
        :distance="10"
        class="infinite-scroll-container"
        @load="handleLoad"
      >
        <div
          v-for="task in tasks"
          :key="task.id"
          class="task-item"
          :class="{ selected: task.id === selectedTask?.id }"
          @click="handleTaskClick(task)"
        >
          <div class="task-row">
            <input
              type="checkbox"
              :checked="task.status"
              @change.stop="updateTaskStatus(task.id, !task.status)"
            >
            <div class="task-title">
              {{ task.title }}
            </div>
            <div class="task-time">
              {{ formatDateTime(task.scheduled_task_time) }}
            </div>
          </div>
          <div class="task-tags">
            <template v-if="task.tag?.length">
              <span
                v-for="(tag, index) in task.tag"
                :key="tag"
                class="tag"
                :style="{ backgroundColor: getColorByIndex(index) }"
              >
                {{ tag }}
              </span>
            </template>
          </div>
        </div>

        <div v-if="isLoading" class="loading-state">
          加载中...
        </div>
        <div v-if="isEnd" class="end-state">
          已加载全部任务
        </div>
      </NInfiniteScroll>

      <transition name="panel-slide">
        <div v-if="selectedTask" class="detail-panel">
          <button class="close-btn" @click="closeRightPanel">
            ×
          </button>
          <h3>任务详情</h3>
          <div class="detail-section">
            <label>标题：</label>
            <div>{{ selectedTask.title }}</div>
          </div>
          <div class="detail-section">
            <label>状态：</label>
            <div>{{ selectedTask.status ? '已完成' : '进行中' }}</div>
          </div>
          <div class="detail-section">
            <label>时间：</label>
            <div>{{ formatDateTime(selectedTask.scheduled_task_time) }}</div>
          </div>
          <div class="detail-section">
            <label>标签：</label>
            <div class="tag-container">
              <span
                v-for="(tag, index) in selectedTask.tag"
                :key="tag"
                class="detail-tag"
                :style="{ backgroundColor: getColorByIndex(index) }"
              >
                {{ tag }}
              </span>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<style scoped>
.task-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  padding: 20px;
  background: #f5f7fa;
  max-width: 100vw; /* 确保容器宽度不超过视口宽度 */
  box-sizing: border-box; /* 防止 padding 导致溢出 */
}

.task-title-header {
  font-size: 24px;
  margin: 0 0 20px 0;
  color: #2c3e50;
}

.main-content {
  display: flex;
  flex: 1;
  gap: 20px;
  min-height: 0;
  overflow: hidden;
  max-width: 100%; /* 防止内容溢出 */
}

.infinite-scroll-container {
  flex: 1;
  overflow-y: auto; /* 允许滚动 */
  min-height: 0; /* 关键修复 */
}

.task-item {
  background: white;
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 5px;
  margin-left: 5px;
  margin-right: 5px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
  cursor: pointer;
}

.task-item.selected {
  background: #e8f4ff;
  box-shadow: 0 2px 12px rgba(0, 120, 255, 0.2);
}

.task-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.task-row input[type='checkbox'] {
  width: 18px;
  height: 18px;
  accent-color: #409eff;
}

.task-title {
  flex: 1;
  font-weight: 500;
  color: #303133;
}

.task-time {
  font-size: 13px;
  color: #909399;
}

.task-tags {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  min-height: 24px; /* 根据实际标签高度调整 */
}

.tag {
  padding: 2px 6px; /* 调小内边距 */
  border-radius: 3px; /* 调小圆角 */
  font-size: 10px; /* 调小字体大小 */
  height: 18px;
  color: white;
}

.detail-panel {
  flex: 0 0 380px;
  overflow: hidden; /* 禁止右侧面板滚动 */
  position: relative;
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #909399;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #303133;
}

.detail-section {
  margin-bottom: 16px;
}

.detail-section label {
  display: block;
  color: #606266;
  margin-bottom: 4px;
}

.tag-container {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.detail-tag {
  padding: 2px 6px; /* 调小内边距 */
  border-radius: 3px; /* 调小圆角 */
  font-size: 10px; /* 调小字体大小 */
  color: white;
  line-height: 1.2; /* 调整行高 */
}

.loading-state,
.end-state {
  text-align: center;
  padding: 16px;
  color: #909399;
  font-size: 14px;
}

.panel-slide-enter-active,
.panel-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.panel-slide-enter-from,
.panel-slide-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
