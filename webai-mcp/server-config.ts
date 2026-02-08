import fs from "fs";
import path from "path";

const DEFAULT_SERVER_HOST = "127.0.0.1";
const DEFAULT_SERVER_PORT = 3025;

interface ServerHostOptions {
  env?: NodeJS.ProcessEnv;
  fallbackHost?: string;
}

interface ServerPortOptions {
  env?: NodeJS.ProcessEnv;
  portFileDir?: string;
  fallbackPort?: number;
}

function parsePositiveInt(value: string | undefined): number | null {
  if (!value) {
    return null;
  }
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

export function getDefaultServerHost(options: ServerHostOptions = {}): string {
  const env = options.env ?? process.env;
  const fallbackHost = options.fallbackHost ?? DEFAULT_SERVER_HOST;

  if (env.WEBAI_HOST) {
    return env.WEBAI_HOST;
  }
  if (env.BROWSER_TOOLS_HOST) {
    return env.BROWSER_TOOLS_HOST;
  }

  return fallbackHost;
}

export function getDefaultServerPort(options: ServerPortOptions = {}): number {
  const env = options.env ?? process.env;
  const fallbackPort = options.fallbackPort ?? DEFAULT_SERVER_PORT;

  const envPort = parsePositiveInt(env.WEBAI_PORT ?? env.BROWSER_TOOLS_PORT);
  if (envPort !== null) {
    return envPort;
  }

  const portFileDir = options.portFileDir ?? __dirname;
  const portFilePath = path.join(portFileDir, ".port");
  try {
    if (fs.existsSync(portFilePath)) {
      const filePort = parsePositiveInt(fs.readFileSync(portFilePath, "utf8").trim());
      if (filePort !== null) {
        return filePort;
      }
    }
  } catch {
    // Ignore file read errors and use fallback port.
  }

  return fallbackPort;
}
