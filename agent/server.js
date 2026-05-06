#!/usr/bin/env node
'use strict'

const http        = require('http')
const fs          = require('fs')
const { execFile } = require('child_process')

const PORT        = parseInt(process.env.PORT ?? '9000', 10)
const SECRET      = process.env.PROXY_AGENT_SECRET
const CONFIG_PATH = '/opt/stratum-proxy/configs/stratum-proxy.yaml'

if (!SECRET) {
  console.error('[swisshash-agent] PROXY_AGENT_SECRET is not set — refusing to start')
  process.exit(1)
}

const PROXY_METRICS_URL = 'http://localhost:5010/api/metrics'

const server = http.createServer((req, res) => {
  const respond = (status, body) => {
    res.writeHead(status, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(body))
  }

  if (req.headers['authorization'] !== `Bearer ${SECRET}`) {
    console.warn(`[${new Date().toISOString()}] Unauthorized request from ${req.socket.remoteAddress}`)
    return respond(401, { error: 'Unauthorized' })
  }

  // GET /metrics — proxy Farm-Proxy metrics
  if (req.method === 'GET' && req.url === '/metrics') {
    http.get(PROXY_METRICS_URL, (proxyRes) => {
      let data = ''
      proxyRes.on('data', chunk => { data += chunk })
      proxyRes.on('end', () => {
        res.writeHead(200, { 'Content-Type': 'text/plain' })
        res.end(data)
      })
    }).on('error', (err) => {
      respond(502, { error: `Failed to fetch proxy metrics: ${err.message}` })
    })
    return
  }

  if (req.method !== 'POST' || req.url !== '/update-config') {
    return respond(404, { error: 'Not found' })
  }

  let body = ''
  req.on('data', chunk => { body += chunk })
  req.on('end', () => {
    try {
      const payload = JSON.parse(body)
      if (!payload.yaml || typeof payload.yaml !== 'string') {
        return respond(400, { error: 'Missing or invalid yaml field' })
      }

      fs.writeFileSync(CONFIG_PATH, payload.yaml, 'utf8')

      const ts = new Date().toISOString()
      console.log(`[${ts}] Config updated — ${payload.yaml.length} bytes written to ${CONFIG_PATH}`)
      console.log(`[${ts}] Restarting hashcore-stratum-proxy...`)

      execFile('docker', ['restart', 'hashcore-stratum-proxy'], (err, stdout, stderr) => {
        if (err) {
          console.error(`[${new Date().toISOString()}] Docker restart failed:`, stderr || err.message)
        } else {
          console.log(`[${new Date().toISOString()}] hashcore-stratum-proxy restarted successfully`)
        }
      })

      respond(200, { ok: true, written_at: ts, bytes: payload.yaml.length })
    } catch (err) {
      console.error(`[${new Date().toISOString()}] Error:`, err.message)
      respond(400, { error: err.message })
    }
  })
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[swisshash-agent] Listening on port ${PORT}`)
  console.log(`[swisshash-agent] Writing configs to: ${CONFIG_PATH}`)
})

process.on('SIGTERM', () => { server.close(() => process.exit(0)) })
process.on('SIGINT',  () => { server.close(() => process.exit(0)) })
