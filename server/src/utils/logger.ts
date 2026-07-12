export function info(msg: string, ...args: unknown[]) {
  console.log(`[INFO] ${msg}`, ...args);
}

export function error(msg: string, ...args: unknown[]) {
  console.error(`[ERROR] ${msg}`, ...args);
}

export function warn(msg: string, ...args: unknown[]) {
  console.warn(`[WARN] ${msg}`, ...args);
}
