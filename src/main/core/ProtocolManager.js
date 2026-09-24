import { EventEmitter } from 'node:events'
import { app } from 'electron'
import is from 'electron-is'
import { parse } from 'querystring'
import { basename } from 'node:path'

import logger from './Logger'
import protocolMap from '../configs/protocol'
import { ADD_TASK_TYPE } from '@shared/constants'

const NEW_TASK_ALLOWED_ARGS = ['uri', 'out', 'referer', 'userAgent', 'cookie']

export default class ProtocolManager extends EventEmitter {
  constructor (options = {}) {
    super()
    this.options = options

    // package.json:build.protocols[].schemes[]
    // options.protocols: { 'magnet': true, 'thunder': false }
    this.protocols = {
      mo: true,
      motrix: true,
      ...options.protocols
    }

    this.init()
  }

  init () {
    const { protocols } = this
    this.setup(protocols)
  }

  setup (protocols = {}) {
    if (is.dev() || is.mas()) {
      return
    }

    Object.keys(protocols).forEach((protocol) => {
      const enabled = protocols[protocol]
      if (enabled) {
        if (!app.isDefaultProtocolClient(protocol)) {
          app.setAsDefaultProtocolClient(protocol)
        }
      } else {
        app.removeAsDefaultProtocolClient(protocol)
      }
    })
  }

  handle (url) {
    logger.info(`[Motrix] protocol url: ${url}`)

    if (
      url.toLowerCase().startsWith('ftp:') ||
      url.toLowerCase().startsWith('http:') ||
      url.toLowerCase().startsWith('https:') ||
      url.toLowerCase().startsWith('magnet:') ||
      url.toLowerCase().startsWith('thunder:')
    ) {
      return this.handleResourceProtocol(url)
    }

    if (
      url.toLowerCase().startsWith('mo:') ||
      url.toLowerCase().startsWith('motrix:')
    ) {
      return this.handleMoProtocol(url)
    }
  }

  handleResourceProtocol (url) {
    if (!url) {
      return
    }

    global.application.sendCommandToAll('application:new-task', {
      type: ADD_TASK_TYPE.URI,
      uri: url
    })
  }

  handleMoProtocol (url) {
    const parsed = new URL(url)
    const { host, search } = parsed
    logger.info('[Motrix] protocol parsed:', parsed, host)

    const command = protocolMap[host]
    if (!command) {
      return
    }

    const query = search.startsWith('?') ? search.replace('?', '') : search
    const args = parse(query)
    global.application.sendCommandToAll(command, this.sanitizeArgs(host, args))
  }

  // mo:// links can be opened by any web page, so they must not pick the save
  // location, the proxy or skip the confirmation dialog.
  sanitizeArgs (host, args) {
    if (host !== 'new-task') {
      return args
    }

    const result = {}
    NEW_TASK_ALLOWED_ARGS.forEach((key) => {
      if (typeof args[key] === 'string') {
        result[key] = args[key]
      }
    })
    if (result.out) {
      result.out = basename(result.out.replace(/\\/g, '/'))
    }
    return result
  }
}
