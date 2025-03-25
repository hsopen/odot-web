<script lang="ts">
import instance from '@/utils/axios'
import { addDays, endOfMonth, format, isYesterday, startOfMonth } from 'date-fns'
import { NButton, NCalendar, NDrawer, NInput, NModal, NRadioButton, NRadioGroup, NTimePicker, useMessage } from 'naive-ui'
import { defineComponent, onMounted, ref } from 'vue'

interface Task {
  id: string
  title: string
  scheduled_task_time: string
  status: boolean
  priority: number
}

interface TaskResponse {
  status: boolean
  msg: string
  data: {
    tasks: Task[]
    count: number
  }
}

export default defineComponent({
  components: {
    NCalendar,
    NModal,
    NInput,
    NRadioGroup,
    NRadioButton,
    NButton,
    NTimePicker,
    NDrawer,
  },
  setup() {
    const message = useMessage()
    const value = ref(addDays(Date.now(), 1).valueOf())
    const tasks = ref<Record<string, Task[]>>({})
    const showModal = ref(false) // 控制弹框显示
    const taskTitle = ref('') // 任务标题
    const taskPriority = ref(0) // 任务优先级
    const selectedDate = ref('') // 选择的日期
    const selectedTime = ref(720) // 选择的时间，默认值为 12:00
    const showTaskListPanel = ref(false) // 控制右侧任务列表面板的显示
    const selectedTaskListDate = ref('') // 当前选中的日期
    const taskListForDate = ref<Task[]>([]) // 当前日期的任务列表

    // 打开右侧任务列表面板

    // 根据日期范围获取任务
    const fetchTasks = async (startDate: string, endDate: string) => {
      try {
        const response = await instance.get<TaskResponse>('/api/v1/task/getTasksByDateRange', {
          params: {
            startDate,
            endDate,
            timeZone: 'Asia/Shanghai', // 固定时区
          },
        })
        if (response.data.status) {
          tasks.value = {} // 清空旧数据
          response.data.data.tasks.forEach((task) => {
            if (task.scheduled_task_time) {
              const dateKey = format(new Date(task.scheduled_task_time), 'yyyy-MM-dd')
              if (!tasks.value[dateKey]) {
                tasks.value[dateKey] = []
              }
              tasks.value[dateKey].push(task)
            }
          })
        }
      }
      catch {
        message.error('获取任务失败')
      }
    }

    // 监听日历月份切换
    const handleMonthChange = (newValue: { year: number, month: number }) => {
      const startDate = format(startOfMonth(new Date(newValue.year, newValue.month - 1)), 'yyyy-MM-dd')
      const endDate = format(endOfMonth(new Date(newValue.year, newValue.month - 1)), 'yyyy-MM-dd')
      fetchTasks(startDate, endDate)
    }

    // 根据日期获取任务
    const getTasksForDate = (year: number, month: number, date: number): Task[] => {
      const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}`
      return tasks.value[dateKey] || []
    }
    const openTaskListPanel = (year: number, month: number, date: number) => {
      selectedTaskListDate.value = `${year}-${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}`
      taskListForDate.value = getTasksForDate(year, month, date)
      showTaskListPanel.value = true
    }
    // 判断日期是否禁用
    const isDateDisabled = (timestamp: number) => {
      if (isYesterday(timestamp)) {
        return true
      }
      return false
    }

    // 打开添加任务弹框
    const openAddTaskModal = (year: number, month: number, date: number) => {
      selectedDate.value = `${year}-${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}` // 确保格式为 yyyy-MM-dd
      showModal.value = true
    }
    // 提交任务
    const submitTask = async () => {
      if (!taskTitle.value) {
        message.error('请输入任务标题')
        return
      }

      // selectedTime 是时间戳（毫秒），需要转换为小时和分钟
      if (typeof selectedTime.value !== 'number' || Number.isNaN(selectedTime.value)) {
        message.error('时间选择无效，请重新选择时间')
        return
      }

      const dateObj = new Date(selectedTime.value)
      const hours = dateObj.getHours()
      const minutes = dateObj.getMinutes()
      const timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`

      // 生成任务时间，确保格式正确
      const scheduledTaskTime = `${selectedDate.value}T${timeString}:00+08:00`

      if (Number.isNaN(new Date(scheduledTaskTime).getTime())) {
        message.error('时间格式无效，请检查日期和时间')
        return
      }

      try {
        const response = await instance.post('/api/v1/task/createTask', {
          title: taskTitle.value,
          priority: taskPriority.value,
          scheduled_task_time: scheduledTaskTime,
        })
        if (response.data.status) {
          message.success('任务添加成功')
          showModal.value = false
          taskTitle.value = ''
          taskPriority.value = 0
          selectedTime.value = Date.now() // 重置为当前时间

          // 重新加载任务数据
          const startDate = format(startOfMonth(value.value), 'yyyy-MM-dd')
          const endDate = format(endOfMonth(value.value), 'yyyy-MM-dd')
          fetchTasks(startDate, endDate)
        }
      }
      catch {
        message.error('任务添加失败')
      }
    }

    // 初始化加载当前月份的任务
    onMounted(() => {
      const startDate = format(startOfMonth(value.value), 'yyyy-MM-dd')
      const endDate = format(endOfMonth(value.value), 'yyyy-MM-dd')
      fetchTasks(startDate, endDate)
    })

    return {
      value,
      tasks,
      showModal,
      taskTitle,
      taskPriority,
      selectedTime,
      getTasksForDate,
      isDateDisabled,
      openAddTaskModal,
      submitTask,
      handleMonthChange,
      showTaskListPanel,
      selectedTaskListDate,
      taskListForDate,
      openTaskListPanel,
      format,
    }
  },
})
</script>

<template>
  <div class="calendar-container">
    <div class="calendar-container" :class="{ shrink: showTaskListPanel }">
      <NCalendar v-model:value="value" :is-date-disabled="isDateDisabled" @panel-change="handleMonthChange">
        <template #default="{ year, month, date }">
          <div class="calendar-day">
            <div class="tasks">
              <div
                v-if="getTasksForDate(year, month, date).length > 0" class="task"
                :title="getTasksForDate(year, month, date)[0].title"
              >
                {{ getTasksForDate(year, month, date)[0].title }}
              </div>
              <div
                v-if="getTasksForDate(year, month, date).length > 1" class="remaining-tasks"
                @click="openTaskListPanel(year, month, date)"
              >
                +{{ getTasksForDate(year, month, date).length - 1 }}
              </div>
            </div>
            <div class="add-task-button" @click="openAddTaskModal(year, month, date)">
              <span class="add-icon">+</span>
              <span class="add-text">添加任务</span>
            </div>
          </div>
        </template>
      </NCalendar>
    </div>
    <!-- 添加任务弹框 -->
    <NModal v-model:show="showModal" title="添加任务">
      <div class="modal-content">
        <div class="modal-row">
          <NInput v-model:value="taskTitle" placeholder="请输入任务标题" />
          <NTimePicker v-model:value="selectedTime" format="HH:mm" />
        </div>
        <div class="modal-row">
          <NRadioGroup v-model:value="taskPriority">
            <NRadioButton :value="-2">
              最低
            </NRadioButton>
            <NRadioButton :value="-1">
              较低
            </NRadioButton>
            <NRadioButton :value="0">
              普通
            </NRadioButton>
            <NRadioButton :value="1">
              较高
            </NRadioButton>
            <NRadioButton :value="2">
              最高
            </NRadioButton>
          </NRadioGroup>
          <NButton type="primary" @click="submitTask">
            提交
          </NButton>
        </div>
      </div>
    </NModal>

    <!-- 右侧任务列表面板 -->
    <NDrawer v-model:show="showTaskListPanel" placement="right" :mask-closable="true" :width="400" :close-on-esc="true">
      <div class="task-list-panel">
        <h3>{{ selectedTaskListDate }} 的任务列表</h3>
        <ul>
          <li v-for="task in taskListForDate" :key="task.id" class="task-item">
            <span>{{ task.title }}</span>
            <span>{{ format(new Date(task.scheduled_task_time), 'HH:mm') }}</span>
          </li>
        </ul>
      </div>
    </NDrawer>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  width: 100%;
  height: 100vh;
}

.calendar-container {
  flex: 1;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  background-color: #fff;
  padding: 12px;
  height: 100%;
  max-height: 100vh;
  box-sizing: border-box;
  transition: all 0.3s ease-in-out;
}

.calendar-day {
  padding: 4px;
  min-height: 80px;
  max-height: 80px;
  border-radius: 6px;
  background-color: #fff;
  transition: all 0.2s ease;
  border: none;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.calendar-day:hover {
  background-color: #f9f9f9;
  transform: translateY(-1px);
}

.tasks {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 4px;
  flex-grow: 1;
  overflow: hidden;
  max-height: 50px;
}

.task {
  font-size: 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 2px 4px;
  background-color: #f0f7ff;
  color: #335ea8;
  border-radius: 3px;
  border-left: 2px solid #335ea8;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.task:hover {
  background-color: #e6f0ff;
  transform: translateX(1px);
}

.remaining-tasks {
  font-size: 9px;
  color: #888;
  background-color: #f5f5f5;
  border-radius: 3px;
  padding: 2px 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
}

.remaining-tasks:hover {
  background-color: #eee;
  color: #666;
}

.add-task-button {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8f8f8;
  border-radius: 3px;
  padding: 2px 0;
  margin-top: 2px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 9px;
  color: #666;
  border: 1px dashed #ddd;
}

.add-task-button:hover {
  background-color: #f0f0f0;
  color: #333;
  border-color: #ccc;
}

.add-icon {
  font-size: 10px;
  margin-right: 2px;
}

.add-text {
  font-size: 9px;
}

.modal-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.modal-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.task-list-panel {
  padding: 16px;
  background-color: #fff;
  height: 100%;
  width: 90%;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
}

.task-list-panel h3 {
  margin-bottom: 16px;
  font-size: 16px;
  color: #333;
}

.task-list-panel ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.task-item span:first-child {
  white-space: nowrap;
  /* 禁止换行 */
  overflow: hidden;
  /* 隐藏溢出内容 */
  text-overflow: ellipsis;
  /* 显示省略号 */
  max-width: 160px;
  /* 设置最大宽度，根据面板宽度调整 */
  display: inline-block;
  /* 确保样式生效 */
}

.task-list-panel .task-item {
  display: flex;
  justify-content: space-between;
  padding: 8px;
  border-bottom: 1px solid #eee;
  font-size: 14px;
}

.task-list-panel .task-item:hover {
  background-color: #f9f9f9;
}
</style>
