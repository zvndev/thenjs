// @vura/server — Configuration

export interface VuraConfig {
  what?: {
    compiler?: {
      mode?: 'vdom' | 'fine-grained';
    };
  };
  server?: {
    defaultPageMode?: 'client' | 'server' | 'static' | 'hybrid';
    port?: number;
    host?: string;
  };
  build?: {
    adapter?: 'auto' | 'node' | 'vercel' | string;
    outDir?: string;
  };
  rpc?: {
    schema?: 'zod' | 'typebox' | 'valibot' | 'arktype';
    openapi?: {
      title?: string;
      version?: string;
      description?: string;
    };
  };
  tasks?: {
    queue?: 'memory' | 'redis' | 'sqs';
  };
}

export function defineConfig(config: VuraConfig): VuraConfig {
  return config;
}

const DEFAULT_CONFIG: VuraConfig = {
  server: {
    defaultPageMode: 'hybrid',
    port: 3000,
    host: 'localhost',
  },
  build: {
    adapter: 'auto',
    outDir: 'dist',
  },
  what: {
    compiler: {
      mode: 'fine-grained',
    },
  },
};

export async function loadConfig(root: string = process.cwd()): Promise<VuraConfig> {
  // Try loading vura.config.ts, vura.config.js, vura.config.mjs
  const configFiles = ['vura.config.ts', 'vura.config.js', 'vura.config.mjs'];

  for (const file of configFiles) {
    const configPath = `${root}/${file}`;
    try {
      // Dynamic import — for .ts files, Vite/tsx will handle the transform
      const mod = await import(configPath);
      const userConfig = mod.default || mod;
      return mergeConfig(DEFAULT_CONFIG, userConfig);
    } catch {
      // File doesn't exist, try next
    }
  }

  return { ...DEFAULT_CONFIG };
}

function mergeConfig(base: VuraConfig, override: VuraConfig): VuraConfig {
  const result: VuraConfig = { ...base };

  if (override.what) {
    result.what = {
      ...base.what,
      ...override.what,
      compiler: { ...base.what?.compiler, ...override.what?.compiler },
    };
  }
  if (override.server) {
    result.server = { ...base.server, ...override.server };
  }
  if (override.build) {
    result.build = { ...base.build, ...override.build };
  }
  if (override.rpc) {
    result.rpc = {
      ...base.rpc,
      ...override.rpc,
      openapi: { ...base.rpc?.openapi, ...override.rpc?.openapi },
    };
  }
  if (override.tasks) {
    result.tasks = { ...base.tasks, ...override.tasks };
  }

  return result;
}
