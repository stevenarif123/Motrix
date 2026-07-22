'use strict'

import { EventEmitter } from 'node:events'
import { Aria2 } from '@shared/aria2'

import logger from './Logger'
import {
  compactUndefined,
  formatOptionsForEngine
} from '@shared/utils'
import {
  ENGINE_RPC_HOST,
  ENGINE_RPC_PORT,
  EMPTY_STRING
} from '@shared/constants'

const defaults = {
  host: ENGINE_RPC_HOST,
  port: ENGINE_RPC_PORT,
  secret: EMPTY_STRING
}

export default class EngineClient extends EventEmitter {
  static instance = null
  static client = null

  constructor (options = {}) {
    super()
    this.options = {
      ...defaults,
      ...options
    }

    this.consecutiveFailures = 0
    this.rpcTimeout = options.rpcTimeout || 10000 // 10 seconds

    this.init()
  }

  init () {
    this.connect()
  }

  connect () {
    logger.info('[Motrix] main engine client connect', this.options)
    const { host, port, secret } = this.options
    this.client = new Aria2({
      host,
      port,
      secret
    })
  }

  async call (method, ...args) {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('RPC Timeout')), this.rpcTimeout)
    })

    try {
      const result = await Promise.race([
        this.client.call(method, ...args),
        timeoutPromise
      ])
      this.consecutiveFailures = 0 // reset on success
      return result
    } catch (err) {
      logger.warn('[Motrix] call client fail:', err.message)
      this.consecutiveFailures++
      
      if (this.consecutiveFailures >= 3) {
        logger.error('[Motrix] engine hung detected')
        this.emit('engine-hung')
        this.consecutiveFailures = 0 // reset to avoid multiple triggers
      }
      return undefined
    }
  }

  async changeGlobalOption (options) {
    logger.info('[Motrix] change engine global option:', options)
    const args = formatOptionsForEngine(options)

    return this.call('changeGlobalOption', args)
  }

  async shutdown (options = {}) {
    const { force = false } = options
    const { secret } = this.options

    const method = force ? 'forceShutdown' : 'shutdown'
    const args = compactUndefined([secret])
    return this.call(method, ...args)
  }
}
