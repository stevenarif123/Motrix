<template>
  <div class="task-table-wrapper">
    <table class="task-table">
      <thead>
        <tr>
          <th class="col-select" @click="toggleSelectAll">
            <input type="checkbox" :checked="isAllSelected" />
          </th>
          <th class="col-name">{{ $t('task.task-name') || 'Name' }}</th>
          <th class="col-size">Size</th>
          <th class="col-progress">Progress</th>
          <th class="col-status">Status</th>
          <th class="col-speed">Speed</th>
          <th class="col-eta">ETA</th>
          <th class="col-connections">Threads</th>
          <th class="col-actions">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="task in taskList"
          :key="task.gid"
          :class="{ selected: selectedGidList.includes(task.gid) }"
          @click="handleRowClick(task, $event)"
          @dblclick="onDbClick(task)"
        >
          <td class="col-select" @click.stop>
            <input
              type="checkbox"
              :checked="selectedGidList.includes(task.gid)"
              @change="toggleSelect(task.gid)"
            />
          </td>
          <td class="col-name" :title="getTaskFullName(task)">
            <div class="name-cell">
              <span class="file-icon">{{ getFileIcon(task) }}</span>
              <span class="file-name">{{ getTaskFullName(task) }}</span>
            </div>
          </td>
          <td class="col-size">
            <div class="size-cell">
              <span class="completed">{{ Number(task.completedLength || 0) | bytesToSize(1) }}</span>
              <span class="total" v-if="Number(task.totalLength) > 0"> / {{ Number(task.totalLength) | bytesToSize(1) }}</span>
            </div>
          </td>
          <td class="col-progress">
            <div class="progress-cell">
              <div class="mini-progress-bar">
                <div
                  class="progress-fill"
                  :class="getProgressClass(task)"
                  :style="{ width: getProgressPercent(task) + '%' }"
                ></div>
              </div>
              <span class="progress-text">{{ getProgressPercent(task) }}%</span>
            </div>
          </td>
          <td class="col-status">
            <span class="status-badge" :class="getStatusBadgeClass(task)">
              {{ getStatusText(task) }}
            </span>
          </td>
          <td class="col-speed">
            <div class="speed-cell" v-if="task.status === 'active' || Number(task.downloadSpeed) > 0">
              <span class="down-speed">↓ {{ Number(task.downloadSpeed || 0) | bytesToSize }}/s</span>
              <span class="up-speed" v-if="checkIsBT(task) && Number(task.uploadSpeed) > 0">↑ {{ Number(task.uploadSpeed || 0) | bytesToSize }}/s</span>
            </div>
            <span v-else class="text-muted">-</span>
          </td>
          <td class="col-eta">
            <span v-if="(task.status === 'active' || Number(task.downloadSpeed) > 0) && getRemainingTime(task) > 0">
              {{ getRemainingTime(task) | timeFormat }}
            </span>
            <span v-else-if="task.status === 'complete'" class="text-success">Done</span>
            <span v-else class="text-muted">-</span>
          </td>
          <td class="col-connections">
            <span class="conn-badge" v-if="task.status === 'active' || Number(task.connections) > 0">
              {{ Number(task.connections || 0) }} conn
            </span>
            <span v-else class="text-muted">-</span>
          </td>
          <td class="col-actions" @click.stop>
            <mo-task-item-actions mode="GRID" :task="task" />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
  import { mapState } from 'vuex'
  import { bytesToSize, checkTaskIsBT, checkTaskIsSeeder, timeFormat, timeRemaining, getTaskName } from '@shared/utils'
  import { TASK_STATUS } from '@shared/constants'
  import { openItem, getTaskFullPath } from '@/utils/native'
  import TaskItemActions from './TaskItemActions'

  export default {
    name: 'mo-task-table',
    components: {
      [TaskItemActions.name]: TaskItemActions
    },
    computed: {
      ...mapState('task', {
        taskList: state => state.taskList,
        selectedGidList: state => state.selectedGidList
      }),
      isAllSelected () {
        return this.taskList.length > 0 && this.selectedGidList.length === this.taskList.length
      }
    },
    filters: {
      bytesToSize,
      timeFormat
    },
    methods: {
      getTaskFullName (task) {
        return getTaskName(task, {
          defaultName: this.$t('task.get-task-name'),
          maxLen: -1
        })
      },
      checkIsBT (task) {
        return checkTaskIsBT(task)
      },
      getProgressPercent (task) {
        const total = Number(task.totalLength)
        const completed = Number(task.completedLength)
        if (!total || total === 0) return 0
        return Math.min(100, Math.floor((completed / total) * 100))
      },
      getProgressClass (task) {
        if (task.status === TASK_STATUS.COMPLETE) return 'complete'
        if (task.status === TASK_STATUS.PAUSED) return 'paused'
        if (task.status === TASK_STATUS.ERROR) return 'error'
        return 'active'
      },
      getStatusBadgeClass (task) {
        if (checkTaskIsSeeder(task)) return 'badge-seeding'
        switch (task.status) {
        case TASK_STATUS.ACTIVE: return 'badge-active'
        case TASK_STATUS.WAITING: return 'badge-waiting'
        case TASK_STATUS.PAUSED: return 'badge-paused'
        case TASK_STATUS.COMPLETE: return 'badge-complete'
        case TASK_STATUS.ERROR: return 'badge-error'
        default: return 'badge-default'
        }
      },
      getStatusText (task) {
        if (checkTaskIsSeeder(task)) return 'SEEDING'
        return (task.status || 'unknown').toUpperCase()
      },
      getRemainingTime (task) {
        return timeRemaining(task.totalLength, task.completedLength, task.downloadSpeed)
      },
      getFileIcon (task) {
        const name = this.getTaskFullName(task).toLowerCase()
        if (checkTaskIsBT(task)) return '🧲'
        if (name.match(/\.(mp4|mkv|avi|mov|wmv|flv|webm)$/)) return '🎬'
        if (name.match(/\.(mp3|flac|wav|aac|ogg|m4a)$/)) return '🎵'
        if (name.match(/\.(zip|rar|7z|tar|gz|bz2)$/)) return '📦'
        if (name.match(/\.(exe|msi|apk|dmg|iso|deb|rpm)$/)) return '⚙️'
        if (name.match(/\.(pdf|doc|docx|txt|xls|xlsx|ppt|pptx)$/)) return '📄'
        return '💾'
      },
      handleRowClick (task, event) {
        if (event.ctrlKey || event.metaKey) {
          const selected = [...this.selectedGidList]
          const index = selected.indexOf(task.gid)
          if (index > -1) {
            selected.splice(index, 1)
          } else {
            selected.push(task.gid)
          }
          this.$store.dispatch('task/selectTasks', selected)
        } else {
          this.$store.dispatch('task/selectTasks', [task.gid])
        }
      },
      toggleSelect (gid) {
        const selected = [...this.selectedGidList]
        const index = selected.indexOf(gid)
        if (index > -1) {
          selected.splice(index, 1)
        } else {
          selected.push(gid)
        }
        this.$store.dispatch('task/selectTasks', selected)
      },
      toggleSelectAll () {
        if (this.isAllSelected) {
          this.$store.dispatch('task/selectTasks', [])
        } else {
          const allGids = this.taskList.map(t => t.gid)
          this.$store.dispatch('task/selectTasks', allGids)
        }
      },
      onDbClick (task) {
        if (task.status === TASK_STATUS.COMPLETE) {
          this.openTask(task)
        } else if ([TASK_STATUS.WAITING, TASK_STATUS.PAUSED].includes(task.status)) {
          this.$store.dispatch('task/toggleTask', task)
        }
      },
      async openTask (task) {
        const fullPath = getTaskFullPath(task)
        const result = await openItem(fullPath)
        if (result) {
          this.$msg.error(this.$t('task.file-not-exist'))
        }
      }
    }
  }
</script>

<style lang="scss">
.task-table-wrapper {
  width: 100%;
  height: 100%;
  overflow-x: auto;
  user-select: none;
  background: var(--bg-table-surface, #ffffff);

  table.task-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
    table-layout: fixed;

    th, td {
      padding: 6px 10px;
      text-align: left;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    }

    th {
      font-weight: 600;
      color: #606266;
      background: #f5f7fa;
      position: sticky;
      top: 0;
      z-index: 2;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #e4e7ed;
    }

    tr {
      height: 38px;
      transition: background-color 0.15s ease;

      &:hover {
        background-color: rgba(64, 158, 255, 0.05);
      }

      &.selected {
        background-color: rgba(64, 158, 255, 0.12) !important;
      }
    }

    .col-select { width: 36px; text-align: center; }
    .col-name { width: 28%; }
    .col-size { width: 14%; }
    .col-progress { width: 16%; }
    .col-status { width: 11%; }
    .col-speed { width: 12%; }
    .col-eta { width: 9%; }
    .col-connections { width: 8%; }
    .col-actions { width: 90px; text-align: right; }

    .name-cell {
      display: flex;
      align-items: center;
      gap: 6px;
      .file-icon { font-size: 14px; }
      .file-name { font-weight: 500; color: #303133; }
    }

    .size-cell {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      .completed { color: #303133; }
      .total { color: #909399; }
    }

    .progress-cell {
      display: flex;
      align-items: center;
      gap: 8px;
      .mini-progress-bar {
        flex: 1;
        height: 6px;
        background: #e4e7ed;
        border-radius: 3px;
        overflow: hidden;
        .progress-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.3s ease;
          &.active { background: #409eff; }
          &.complete { background: #67c23a; }
          &.paused { background: #e6a23c; }
          &.error { background: #f56c6c; }
        }
      }
      .progress-text {
        font-family: 'JetBrains Mono', monospace;
        font-size: 11px;
        width: 32px;
        text-align: right;
      }
    }

    .status-badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.3px;

      &.badge-active { background: #e6f1fc; color: #409eff; }
      &.badge-complete { background: #f0f9eb; color: #67c23a; }
      &.badge-paused { background: #fdf6ec; color: #e6a23c; }
      &.badge-error { background: #fef0f0; color: #f56c6c; }
      &.badge-seeding { background: #f4ecf7; color: #9c27b0; }
      &.badge-waiting, &.badge-default { background: #f4f4f5; color: #909399; }
    }

    .speed-cell {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      .down-speed { color: #409eff; font-weight: 500; }
      .up-speed { color: #67c23a; margin-left: 4px; }
    }

    .conn-badge {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      color: #606266;
      background: #f4f4f5;
      padding: 1px 4px;
      border-radius: 3px;
    }

    .text-muted { color: #c0c4cc; }
    .text-success { color: #67c23a; font-weight: 500; }
  }
}
</style>
