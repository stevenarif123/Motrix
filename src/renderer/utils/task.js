import { isEmpty } from 'lodash'

import {
  ADD_TASK_TYPE,
  NONE_SELECTED_FILES,
  SELECTED_ALL_FILES
} from '@shared/constants'
import { splitTaskLinks } from '@shared/utils'
import { buildOuts } from '@shared/utils/rename'

import {
  buildUrisFromCurl,
  buildHeadersFromCurl,
  buildDefaultOptionsFromCurl
} from '@shared/utils/curl'

export const initTaskForm = state => {
  const { addTaskUrl, addTaskOptions } = state.app
  const {
    allProxy,
    dir,
    engineMaxConnectionPerServer,
    followMetalink,
    followTorrent,
    maxConnectionPerServer,
    newTaskShowDownloading,
    split
  } = state.preference.config
  const result = {
    allProxy,
    cookie: '',
    dir,
    engineMaxConnectionPerServer,
    followMetalink,
    followTorrent,
    maxConnectionPerServer,
    newTaskShowDownloading,
    out: '',
    referer: '',
    selectFile: NONE_SELECTED_FILES,
    split,
    torrent: '',
    uris: addTaskUrl,
    userAgent: '',
    authorization: '',
    ...addTaskOptions
  }
  return result
}

export const buildHeader = (form) => {
  let { userAgent, referer, cookie, authorization, uris } = form
  const result = []

  if (!isEmpty(userAgent)) {
    result.push(`User-Agent: ${userAgent}`)
  }

  if (isEmpty(referer) && uris && typeof uris === 'string') {
    try {
      const firstUrl = uris.split('\n')[0].trim()
      if (firstUrl.startsWith('http')) {
        const urlObj = new URL(firstUrl)
        referer = `${urlObj.protocol}//${urlObj.host}/`
      }
    } catch (e) {}
  }

  if (!isEmpty(referer)) {
    result.push(`Referer: ${referer}`)
  }
  if (!isEmpty(cookie)) {
    result.push(`Cookie: ${cookie}`)
  }
  if (!isEmpty(authorization)) {
    result.push(`Authorization: ${authorization}`)
  }

  return result
}

import { detectCategoryFromFileName, getCategoryFolderName } from '@shared/utils/category'

export const buildOption = (type, form) => {
  let {
    allProxy,
    dir,
    out,
    selectFile,
    split,
    uris
  } = form
  const result = {}

  if (!isEmpty(allProxy)) {
    result.allProxy = allProxy
  }

  if (!isEmpty(dir)) {
    let targetDir = dir
    if (uris && typeof uris === 'string') {
      const category = detectCategoryFromFileName(uris)
      if (category !== 'other') {
        const subFolder = getCategoryFolderName(category)
        targetDir = `${dir}/${subFolder}`.replace(/\\/g, '/')
      }
    }
    result.dir = targetDir
  }

  if (!isEmpty(out)) {
    result.out = out
  }

  if (split > 0) {
    result.split = split
  }

  if (type === ADD_TASK_TYPE.TORRENT) {
    if (
      selectFile !== SELECTED_ALL_FILES &&
      selectFile !== NONE_SELECTED_FILES
    ) {
      result.selectFile = selectFile
    }
  }

  const header = buildHeader(form)
  if (!isEmpty(header)) {
    result.header = header
  }

  return result
}

export const buildUriPayload = (form) => {
  let { uris, out } = form
  if (isEmpty(uris)) {
    throw new Error('task.new-task-uris-required')
  }

  uris = splitTaskLinks(uris)
  const curlHeaders = buildHeadersFromCurl(uris)
  uris = buildUrisFromCurl(uris)
  const outs = buildOuts(uris, out)

  form = buildDefaultOptionsFromCurl(form, curlHeaders)

  const options = buildOption(ADD_TASK_TYPE.URI, form)
  const result = {
    uris,
    outs,
    options
  }
  return result
}

export const buildTorrentPayload = (form) => {
  const { torrent } = form
  if (isEmpty(torrent)) {
    throw new Error('task.new-task-torrent-required')
  }

  const options = buildOption(ADD_TASK_TYPE.TORRENT, form)
  const result = {
    torrent,
    options
  }
  return result
}
