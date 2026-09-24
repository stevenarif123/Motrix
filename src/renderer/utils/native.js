import { Message } from 'element-ui'

import {
  getFileNameFromFile,
  isMagnetTask
} from '@shared/utils'
import { APP_THEME, TASK_STATUS } from '@shared/constants'
import { shell } from '@/utils/electron'

const joinPath = (dir, name) => `${dir.replace(/[\\/]+$/, '')}/${name}`

export const showItemInFolder = async (fullPath, { errorMsg }) => {
  if (!fullPath) {
    return
  }

  const exists = await shell.showItemInFolder(fullPath)
  if (!exists && errorMsg) {
    Message.error(errorMsg)
  }
}

export const openItem = async (fullPath) => {
  if (!fullPath) {
    return
  }

  return shell.openPath(fullPath)
}

export const getTaskFullPath = (task) => {
  const { dir, files, bittorrent } = task

  // Magnet link task
  if (isMagnetTask(task)) {
    return dir
  }

  if (bittorrent && bittorrent.info && bittorrent.info.name) {
    return joinPath(dir, bittorrent.info.name)
  }

  const [file] = files
  if (file && file.path) {
    return file.path
  }

  if (files && files.length === 1) {
    const fileName = getFileNameFromFile(file)
    if (fileName) {
      return joinPath(dir, fileName)
    }
  }

  return dir
}

export const moveTaskFilesToTrash = async (task) => {
  /**
   * For magnet link tasks, there is bittorrent, but there is no bittorrent.info.
   * The path is not a complete path before it becomes a BT task.
   * In order to avoid accidentally deleting the directory
   * where the task is located, it directly returns true when deleting.
   */
  if (isMagnetTask(task)) {
    return true
  }

  const { dir, status } = task
  const path = getTaskFullPath(task)

  try {
    return await shell.trashTaskFiles({
      dir,
      path,
      // There is no control file for a completed task.
      withControlFile: status !== TASK_STATUS.COMPLETE
    })
  } catch (err) {
    throw new Error('task.file-path-error')
  }
}

export const getSystemTheme = () => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? APP_THEME.DARK
    : APP_THEME.LIGHT
}

export const delayDeleteTaskFiles = (task, delay) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      moveTaskFilesToTrash(task)
        .then(resolve)
        .catch((err) => reject(err.message))
    }, delay)
  })
}
