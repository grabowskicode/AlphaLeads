// src/lib/logger.ts

declare global {
  var serverLogs: string[];
  var logSequence: number; // Tracks the total number of logs in this session
}

// Initialize global variables if they don't exist
if (!global.serverLogs) global.serverLogs = [];
if (!global.logSequence) global.logSequence = 0;

export function addLog(message: string) {
  global.logSequence++;
  const now = new Date();
  
  // 1. Better Timestamp: Includes date for a "log file" feel
  const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const timeStr = now.toLocaleTimeString('en-GB', { hour12: false }); // 24-hour format
  
  // 2. System Info: Current RAM usage (helps identify if the server is struggling)
  // process.memoryUsage().rss provides the Resident Set Size in bytes
  const memUsage = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);

  // 3. Structured Terminal Format
  // Example: [2026-03-20 14:30:05] [SEQ:42] [MEM:85.4MB] [INIT] Starting scan...
  const logEntry = `[${dateStr} ${timeStr}] [SEQ:${global.logSequence}] [RAM:${memUsage}MB] ${message}`;

  global.serverLogs.push(logEntry);

  // Keep a larger buffer for a better terminal history (100 lines)
  if (global.serverLogs.length > 100) {
    global.serverLogs.shift();
  }

  // Also output to the VS Code / Vercel terminal
  console.log(logEntry);
}

export function getLogs() {
  return global.serverLogs;
}

export function clearLogs() {
  global.serverLogs = [];
  global.logSequence = 0; // Reset counter on clear
}
