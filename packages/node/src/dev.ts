import { createServer, mergeConfig, type ViteDevServer } from "vite";
import { parseDevArgs } from "./cli/devArgs.ts";
import { createSlidesViteConfig } from "./slides/build/config/createSlidesViteConfig.ts";
import { preflightSlidesSource } from "./slides/build/config/preflightSlidesSource.ts";
import {
  createSuccessResult,
  resolveSlidesCommandContext,
  type CommandResult,
  type SlidesCommandOptions,
} from "./context.ts";

export interface DevSlidesOptions extends SlidesCommandOptions {
  viteArgs?: string[];
  printUrls?: boolean;
}

export async function startSlidesDevServer(options: DevSlidesOptions = {}): Promise<ViteDevServer> {
  const parsedArgs = parseDevArgs(options.viteArgs ?? []);
  const explicitSlidesFile = options.slidesFile ?? parsedArgs.slidesFile;
  const context = resolveSlidesCommandContext({
    ...options,
    slidesFile: explicitSlidesFile,
  });
  preflightSlidesSource({
    appRoot: context.appRoot,
    slidesSourceFile: context.slidesSourceFile,
    explicit: Boolean(explicitSlidesFile),
    allowScaffold: !parsedArgs.noScaffold,
  });
  const server = await createServer(
    mergeConfig(createSlidesViteConfig(context), {
      configFile: false,
      clearScreen: false,
      mode: parsedArgs.mode,
      base: parsedArgs.base,
      server: {
        host: parsedArgs.host,
        port: parsedArgs.port,
        open: parsedArgs.open,
        strictPort: parsedArgs.strictPort,
      },
    }),
  );

  await server.listen();

  if (options.printUrls !== false) {
    server.printUrls();
  }

  return server;
}

function waitForServerShutdown(server: ViteDevServer): Promise<CommandResult> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const signalHandlers = new Map<NodeJS.Signals, () => void>();

    const cleanup = async (signal: NodeJS.Signals) => {
      if (settled) return;
      settled = true;

      for (const [eventName, handler] of signalHandlers) {
        process.off(eventName, handler);
      }

      try {
        await server.close();
        resolve({
          code: 0,
          signal,
        });
      } catch (error) {
        reject(error);
      }
    };

    for (const signal of ["SIGINT", "SIGTERM"] as const) {
      const handler = () => {
        void cleanup(signal);
      };
      signalHandlers.set(signal, handler);
      process.on(signal, handler);
    }
  });
}

export async function runSlidesDev(options: DevSlidesOptions = {}): Promise<CommandResult> {
  const server = await startSlidesDevServer(options);
  return waitForServerShutdown(server);
}

export async function stopSlidesDevServer(server: ViteDevServer) {
  await server.close();
}

export { createSuccessResult };
