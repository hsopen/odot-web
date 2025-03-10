<script setup lang="ts">
import instance from '@/utils/axios'
import { NButton, NDatePicker, NDynamicTags, NForm, NFormItem, NInput, NSelect, NUpload, type UploadFileInfo, useMessage } from 'naive-ui'
import { onMounted, onUnmounted, reactive, ref } from 'vue'

interface Attachment {
  attachmentsName: string
  attachments_path: string
}

interface Task {
  id: string
  title: string
  status: boolean
  scheduled_task_time: string | null
  tag: string[]
  remark?: string
  priority: number
  rrule?: string | null
  creation_time: string
  update_time: string
  attachments_path: Attachment[] | null
}

const message = useMessage()

// 响应式数据
const tasks = ref<Task[]>([])
const _cursor = ref<string | null>(null)
const _isLoading = ref<boolean>(false)
const _isEnd = ref<boolean>(false)
const selectedTask = ref<Task | null>(null)
const containerHeight = ref('100vh')

// 表单相关
const formRef = ref()
const formValue = reactive({
  id: '',
  title: '',
  remark: '',
  priority: 0,
  tag: [] as string[],
  scheduled_task_time: null as number | null,
  rrule: '',
  attachments: [] as Attachment[] | null,
})

const priorityOptions = [
  { label: '最高', value: 2 },
  { label: '高', value: 1 },
  { label: '中', value: 0 },
  { label: '低', value: -1 },
  { label: '最低', value: -2 },
]

// 获取颜色
function getColorByIndex(index: number): string {
  const fixedColors = ['#ff7f50', '#87cefa', '#32cd32', '#6495ed']
  return fixedColors[index % fixedColors.length]
}

// 加载任务
async function handleLoad(): Promise<void> {
  if (_isLoading.value || _isEnd.value)
    return
  _isLoading.value = true

  try {
    const response = await instance.get<{
      status: boolean
      data: {
        tasks: Task[]
        nextCursor: string | null
      }
      msg: string
    }>(`${import.meta.env.VITE_API_HOST}/api/v1/task/getAllTasks`, {
      params: { cursor: _cursor.value },
    })

    if (response.data.status) {
      const newTasks = response.data.data.tasks
      tasks.value = [...tasks.value, ...newTasks]
      _cursor.value = response.data.data.nextCursor

      if (newTasks.length < 10 || !_cursor.value) {
        _isEnd.value = true
      }
    }
  }
  catch (error) {
    console.error('请求失败:', error)
  }
  finally {
    _isLoading.value = false
  }
}

// 更新任务状态
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

// 格式化时间
function formatDateTime(dateTime: string | null): string {
  return dateTime ? new Date(dateTime).toLocaleString() : '未设置时间'
}

// 处理任务点击
function handleTaskClick(task: Task): void {
  if (selectedTask.value?.id === task.id) {
    selectedTask.value = null
  }
  else {
    selectedTask.value = task
    Object.assign(formValue, {
      id: task.id,
      title: task.title,
      remark: task.remark || '',
      priority: task.priority,
      tag: task.tag || [],
      scheduled_task_time: task.scheduled_task_time
        ? new Date(task.scheduled_task_time).getTime()
        : null,
      rrule: task.rrule || '',
      attachments: task.attachments_path || [], // 将 attachments_path 映射到 attachments
    })
  }
}

// 关闭右侧面板
function closeRightPanel(): void {
  selectedTask.value = null
}

// 提交表单
async function handleSubmit() {
  try {
    const formattedTime = formValue.scheduled_task_time
      ? new Date(formValue.scheduled_task_time).toISOString()
      : null

    const response = await instance.post(`${import.meta.env.VITE_API_HOST}/api/v1/task/modifyTask`, {
      taskId: formValue.id,
      title: formValue.title,
      remark: formValue.remark,
      priority: formValue.priority,
      tag: formValue.tag,
      scheduled_task_time: formattedTime,
      rrule: formValue.rrule || null,
    })

    if (response.data.status) {
      const index = tasks.value.findIndex(t => t.id === formValue.id)
      if (index !== -1) {
        tasks.value[index] = {
          ...tasks.value[index],
          ...formValue,
          scheduled_task_time: formattedTime,
        }
      }
      closeRightPanel()
    }
  }
  catch (error) {
    console.error('修改失败:', error)
  }
}

// 处理文件上传
async function handleUpload(data: {
  file: Required<UploadFileInfo>
  fileList: Required<UploadFileInfo>[]
  event?: Event | ProgressEvent<EventTarget>
}): Promise<void> {
  const file = data.file.file // 从 UploadFileInfo 中提取 File 对象

  // 检查 file 是否为 null
  if (!file) {
    message.error('文件无效，请重新选择文件')
    return
  }

  const formData = new FormData()
  formData.append('file', file, encodeURIComponent(file.name)) // 确保 file 是 File 类型
  formData.append('taskId', formValue.id)
  try {
    const response = await instance.put(`${import.meta.env.VITE_API_HOST}/api/v1/task/uploadTaskAttachment`, formData, {
      headers: {
        // 'Content-Type': 'multipart/form-data',
      },
    })

    if (response.data.status) {
      message.success('上传成功')

      // 更新当前任务的附件列表
      const task = tasks.value.find(t => t.id === response.data.data.taskId)
      if (task) {
        task.attachments_path = response.data.data.result
      }

      // 更新表单中的附件列表
      if (formValue.id === response.data.data.taskId) {
        formValue.attachments = response.data.data.result
      }
    }
  }
  catch (error) {
    message.error('上传失败')
    console.error('上传失败:', error)
  }
}

// 下载附件
function downloadAttachment(path: string, name: string) {
  instance.get(path, {
    responseType: 'blob',
    params: { filename: encodeURIComponent(name) }, // 编码文件名
  }).then((response) => {
    const filename = decodeURIComponent(
      response.headers['content-disposition']
        ?.split('filename=')[1]
        ?.replace(/"/g, '') || name,
    )

    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename) // 使用解码后的文件名
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  })
}

onMounted(() => {
  const header = document.querySelector('.task-title-header')
  const headerHeight = header ? header.clientHeight + 40 : 100
  containerHeight.value = `calc(100vh - ${headerHeight}px)`
  handleLoad()

  // 添加滚动事件监听器
  const scrollContainer = document.querySelector('.infinite-scroll-container')
  if (scrollContainer) {
    scrollContainer.addEventListener('scroll', handleScroll)
  }
})

function handleScroll() {
  const scrollContainer = document.querySelector('.infinite-scroll-container')
  if (scrollContainer) {
    const { scrollTop, scrollHeight, clientHeight } = scrollContainer
    if (scrollTop + clientHeight >= scrollHeight - 10) { // 接近底部时加载
      handleLoad()
    }
  }
}

onUnmounted(() => {
  const scrollContainer = document.querySelector('.infinite-scroll-container')
  if (scrollContainer) {
    scrollContainer.removeEventListener('scroll', handleScroll)
  }
})
</script>

<template>
  <div class="task-container">
    <h2 class="task-title-header">
      所有任务
    </h2>

    <div class="main-content" :style="{ height: containerHeight }">
      <div class="infinite-scroll-container">
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
              >{{ tag }}</span>
            </template>
          </div>
        </div>

        <div v-if="_isLoading" class="loading-state">
          加载中...
        </div>
        <div v-if="_isEnd" class="end-state">
          已加载全部任务
        </div>
      </div>

      <transition name="panel-slide">
        <div v-if="selectedTask" class="detail-panel">
          <button class="close-btn" @click="closeRightPanel">
            ×
          </button>
          <h3>编辑任务</h3>

          <NForm ref="formRef" :model="formValue" label-placement="left" label-width="auto">
            <NFormItem label="标题" path="title">
              <NInput v-model:value="formValue.title" placeholder="输入任务标题" />
            </NFormItem>

            <NFormItem label="备注" path="remark">
              <NInput v-model:value="formValue.remark" type="textarea" placeholder="输入任务备注" />
            </NFormItem>

            <NFormItem label="优先级" path="priority">
              <NSelect v-model:value="formValue.priority" :options="priorityOptions" placeholder="选择优先级" />
            </NFormItem>

            <NFormItem label="任务时间" path="scheduled_task_time">
              <NDatePicker
                v-model:value="formValue.scheduled_task_time"
                type="datetime"
                clearable
                placeholder="选择任务时间"
              />
            </NFormItem>

            <NFormItem label="标签" path="tag">
              <NDynamicTags v-model:value="formValue.tag" />
            </NFormItem>
            <NFormItem label="附件" path="attachments">
              <div class="attachments-container">
                <!-- 渲染附件列表 -->
                <div v-if="formValue.attachments?.length" class="attachment-list">
                  <div
                    v-for="(attachment, index) in formValue.attachments"
                    :key="index"
                    class="attachment-item"
                    @click="downloadAttachment(attachment.attachments_path, attachment.attachmentsName)"
                  >
                    <span class="file-name">{{ attachment.attachmentsName }}</span>
                    <span class="download-icon">⬇️</span>
                  </div>
                </div>

                <!-- 上传附件按钮 -->
                <NUpload
                  :multiple="false"
                  :show-file-list="false"
                  class="upload-btn"
                  @change="handleUpload"
                >
                  <NButton>上传附件</NButton>
                </NUpload>
              </div>
            </NFormItem>

            <NFormItem label="重复规则" path="rrule">
              <NInput v-model:value="formValue.rrule" placeholder="输入iCalendar RRULE规则" />
            </NFormItem>

            <div class="form-footer">
              <NButton type="primary" @click="handleSubmit">
                保存修改
              </NButton>
            </div>
          </NForm>

          <div class="time-info">
            <div class="time-item">
              <span class="time-label">创建时间:</span>
              <span class="time-value">{{ formatDateTime(selectedTask.creation_time) }}</span>
            </div>
            <div class="time-item">
              <span class="time-label">更新时间:</span>
              <span class="time-value">{{ formatDateTime(selectedTask.update_time) }}</span>
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
  max-width: 100vw;
  box-sizing: border-box;
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
  max-width: 100%;
}

.infinite-scroll-container {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
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
  min-height: 24px;
}

.tag {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 10px;
  height: 18px;
  color: white;
}

.detail-panel {
  flex: 0 0 480px;
  padding: 10px;
  position: relative;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  height: 100%; /* 占满父容器高度 */
  overflow-y: auto; /* 启用垂直滚动 */
  box-sizing: border-box; /* 确保 padding 不会影响高度 */
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

.form-footer {
  margin-top: 24px;
  display: flex;
  justify-content: flex-start;
}

.time-info {
  display: flex;
  gap: 20px;
  margin-top: 16px;
  font-size: 12px;
  color: #666;
}

.attachments-container {
  width: 100%;
}

.attachment-list {
  margin-bottom: 12px;
}

.attachment-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  margin: 4px 0;
  background-color: #f5f7fa;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.attachment-item:hover {
  background-color: #e1e7ef;
}

.file-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
}

.download-icon {
  margin-left: 8px;
  padding: 4px;
}

.upload-btn {
  margin-top: 8px;
}
</style>
