// src/lib/logger.ts

// Global variable to persist logs across hot reloads in development
declare global {
  var serverLogs: string[];
}

if (!global.serverLogs) {
  global.serverLogs = [];
}

export function addLog(message: string) {
  const timestamp = new Date().toLocaleTimeString();
  const logEntry = `[${timestamp}] ${message}`;

  // Add to global array
  global.serverLogs.push(logEntry);

  // Keep only last 50 lines
  if (global.serverLogs.length > 50) {
    global.serverLogs.shift();
  }

  // Still log to the real terminal
  console.log(message);
}

export function getLogs() {
  return global.serverLogs;
}

export function clearLogs() {
  global.serverLogs = [];
}
