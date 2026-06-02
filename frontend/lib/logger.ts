type Level = 'info' | 'warn' | 'error'

interface LogEntry {
  level: Level
  message: string
  context?: Record<string, unknown>
  timestamp: string
}

function log(level: Level, message: string, context?: Record<string, unknown>) {
  const entry: LogEntry = { level, message, context, timestamp: new Date().toISOString() }
  if (process.env.NODE_ENV === 'development') {
    console[level](`[${entry.timestamp}] ${message}`, context ?? '')
  } else {
    // Production: structured JSON to stdout (Vercel captures it)
    process.stdout.write(JSON.stringify(entry) + '\n')
  }
}

export const logger = {
  info: (msg: string, ctx?: Record<string, unknown>) => log('info', msg, ctx),
  warn: (msg: string, ctx?: Record<string, unknown>) => log('warn', msg, ctx),
  error: (msg: string, ctx?: Record<string, unknown>) => log('error', msg, ctx),
}
