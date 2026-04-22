#!/usr/bin/env node

import { spawn } from 'node:child_process'
import fs from 'node:fs'
import net from 'node:net'
import path from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

const DEFAULT_HOST = process.env.DEV_HOST || '127.0.0.1'
const DEFAULT_PORT = Number(process.env.DEV_PORT || process.env.PORT || 3018)
const MAX_PORT_STEPS = Number(process.env.DEV_PORT_SCAN || 30)
const PROJECT_ROOT = process.cwd()
const PID_FILE = path.join(PROJECT_ROOT, '.wrangler', 'dev-smart.pid')

function log(message) {
  console.log(`[dev-smart] ${message}`)
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function readPidFile() {
  try {
    const raw = fs.readFileSync(PID_FILE, 'utf8').trim()
    const pid = Number(raw)
    return Number.isFinite(pid) && pid > 0 ? pid : null
  } catch {
    return null
  }
}

async function stopPid(pid) {
  try {
    process.kill(pid, 'SIGTERM')
  } catch {
    return
  }

  for (let i = 0; i < 20; i += 1) {
    try {
      process.kill(pid, 0)
      await sleep(150)
    } catch {
      return
    }
  }

  try {
    process.kill(pid, 'SIGKILL')
  } catch {
    return
  }
}

function ensurePidDir() {
  fs.mkdirSync(path.dirname(PID_FILE), { recursive: true })
}

function writePidFile(pid) {
  ensurePidDir()
  fs.writeFileSync(PID_FILE, String(pid))
}

function removePidFile() {
  try {
    fs.unlinkSync(PID_FILE)
  } catch {
    // noop
  }
}

function parseCliOptions(argv) {
  let host = DEFAULT_HOST
  let port = DEFAULT_PORT

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--host' && argv[i + 1]) {
      host = argv[i + 1]
      i += 1
      continue
    }
    if (arg.startsWith('--host=')) {
      host = arg.slice('--host='.length)
      continue
    }
    if (arg === '--port' && argv[i + 1]) {
      const next = Number(argv[i + 1])
      if (Number.isFinite(next)) port = next
      i += 1
      continue
    }
    if (arg.startsWith('--port=')) {
      const next = Number(arg.slice('--port='.length))
      if (Number.isFinite(next)) port = next
    }
  }

  return { host, port }
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
  return ['run', 'dev:serve', '--', '--host', host, '--port', String(port), '--strictPort']
}

export async function main() {
  const { host, port: requestedPort } = parseCliOptions(process.argv.slice(2))

  const previousPid = readPidFile()
  if (previousPid) {
    log(`检测到上次的 dev 进程 ${previousPid}，先帮你关掉`)
    await stopPid(previousPid)
    removePidFile()
  }

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

  writePidFile(child.pid)

  const forwardSignal = signal => {
    if (!child.killed) {
      child.kill(signal)
    }
  }

  process.on('SIGINT', () => forwardSignal('SIGINT'))
  process.on('SIGTERM', () => forwardSignal('SIGTERM'))

  child.on('exit', (code, signal) => {
    removePidFile()
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
