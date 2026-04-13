#!/usr/bin/env node

import { spawn } from 'node:child_process'
import net from 'node:net'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

const DEFAULT_HOST = process.env.DEV_HOST || '127.0.0.1'
const DEFAULT_PORT = Number(process.env.DEV_PORT || process.env.PORT || 3018)
const MAX_PORT_STEPS = Number(process.env.DEV_PORT_SCAN || 30)

function log(message) {
  console.log(`[dev-smart] ${message}`)
}

export async function isPortFree(host, port) {
  return new Promise(resolve => {
    const server = net.createServer()
    server.unref()

    server.on('error', () => resolve(false))
    server.listen({ host, port }, () => {
      server.close(() => resolve(true))
    })
  })
}

export async function findAvailablePort(host, startPort, maxSteps = MAX_PORT_STEPS) {
  for (let step = 0; step <= maxSteps; step += 1) {
    const candidate = startPort + step
    if (await isPortFree(host, candidate)) {
      return candidate
    }
  }

  throw new Error(
    `从 ${startPort} 开始向后扫描 ${maxSteps + 1} 个端口后，仍未找到可用端口`
  )
}

export function buildDevCommand(host, port) {
  return ['run', 'dev', '--', '--host', host, '--port', String(port), '--strictPort']
}

export async function main() {
  const host = DEFAULT_HOST
  const requestedPort = DEFAULT_PORT
  const port = await findAvailablePort(host, requestedPort)

  if (port !== requestedPort) {
    log(`端口 ${requestedPort} 已被占用，自动切换到 ${port}`)
  } else {
    log(`端口 ${port} 可用，直接启动`)
  }

  log(`访问地址: http://${host}:${port}/`)

  const child = spawn('npm', buildDevCommand(host, port), {
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: String(port),
      DEV_PORT: String(port),
      DEV_HOST: host,
    },
  })

  const forwardSignal = signal => {
    if (!child.killed) {
      child.kill(signal)
    }
  }

  process.on('SIGINT', () => forwardSignal('SIGINT'))
  process.on('SIGTERM', () => forwardSignal('SIGTERM'))

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal)
      return
    }
    process.exit(code ?? 0)
  })
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error(`[dev-smart] 启动失败: ${error?.message || String(error)}`)
    process.exit(1)
  })
}
