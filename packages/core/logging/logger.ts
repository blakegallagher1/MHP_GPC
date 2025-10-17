import pino from "pino";

export type LogLevel = "fatal" | "error" | "warn" | "info" | "debug" | "trace";

export interface LoggerOptions {
  name: string;
  level?: LogLevel;
  enabled?: boolean;
}

export interface Logger {
  child(bindings: Record<string, unknown>): Logger;
  fatal(obj: unknown, msg?: string): void;
  error(obj: unknown, msg?: string): void;
  warn(obj: unknown, msg?: string): void;
  info(obj: unknown, msg?: string): void;
  debug(obj: unknown, msg?: string): void;
  trace(obj: unknown, msg?: string): void;
}

export const createLogger = ({ name, level = "info", enabled = true }: LoggerOptions): Logger => {
  const instance = pino({
    name,
    level,
    enabled,
  });

  return instance as unknown as Logger;
};
