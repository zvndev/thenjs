import { describe, it, expect } from 'vitest';
import { vuraVitePlugin } from '../src/vite-plugin.js';

describe('vuraVitePlugin', () => {
  it('returns Plugin array with at least one plugin', () => {
    const plugins = vuraVitePlugin();
    expect(Array.isArray(plugins)).toBe(true);
    expect(plugins.length).toBeGreaterThanOrEqual(1);
  });

  it('returns plugin named "vura"', () => {
    const plugins = vuraVitePlugin();
    const names = plugins.map((p) => p.name);
    expect(names).toContain('vura');
  });

  it('plugin has required Vite hooks: configResolved, configureServer, resolveId, load', () => {
    const plugins = vuraVitePlugin();
    const plugin = plugins.find((p) => p.name === 'vura')!;
    expect(plugin).toBeDefined();
    expect(plugin).toHaveProperty('configResolved');
    expect(plugin).toHaveProperty('configureServer');
    expect(plugin).toHaveProperty('resolveId');
    expect(plugin).toHaveProperty('load');
  });

  describe('resolveId', () => {
    it('resolves "virtual:vura-routes" to "\\0virtual:vura-routes"', () => {
      const plugins = vuraVitePlugin();
      const plugin = plugins.find((p) => p.name === 'vura')!;
      const result = (plugin as any).resolveId('virtual:vura-routes');
      expect(result).toBe('\0virtual:vura-routes');
    });

    it('resolves "virtual:vura-manifest" to "\\0virtual:vura-manifest"', () => {
      const plugins = vuraVitePlugin();
      const plugin = plugins.find((p) => p.name === 'vura')!;
      const result = (plugin as any).resolveId('virtual:vura-manifest');
      expect(result).toBe('\0virtual:vura-manifest');
    });

    it('resolves "virtual:vura-rpc-client" to "\\0virtual:vura-rpc-client"', () => {
      const plugins = vuraVitePlugin();
      const plugin = plugins.find((p) => p.name === 'vura')!;
      const result = (plugin as any).resolveId('virtual:vura-rpc-client');
      expect(result).toBe('\0virtual:vura-rpc-client');
    });

    it('returns null for unknown IDs', () => {
      const plugins = vuraVitePlugin();
      const plugin = plugins.find((p) => p.name === 'vura')!;
      const result = (plugin as any).resolveId('some-unknown-module');
      expect(result).toBeNull();
    });
  });

  describe('load', () => {
    it('returns route module content for "\\0virtual:vura-routes"', () => {
      const plugins = vuraVitePlugin();
      const plugin = plugins.find((p) => p.name === 'vura')!;
      const result = (plugin as any).load('\0virtual:vura-routes');
      expect(typeof result).toBe('string');
      expect(result).toContain('routes');
      expect(result).toContain('apiRoutes');
      expect(result).toContain('export');
    });

    it('returns manifest module content for "\\0virtual:vura-manifest"', () => {
      const plugins = vuraVitePlugin();
      const plugin = plugins.find((p) => p.name === 'vura')!;
      const result = (plugin as any).load('\0virtual:vura-manifest');
      expect(typeof result).toBe('string');
      expect(result).toContain('manifest');
      expect(result).toContain('export');
    });

    it('returns RPC client module content for "\\0virtual:vura-rpc-client"', () => {
      const plugins = vuraVitePlugin();
      const plugin = plugins.find((p) => p.name === 'vura')!;
      const result = (plugin as any).load('\0virtual:vura-rpc-client');
      expect(typeof result).toBe('string');
      expect(result).toContain('createRPCClient');
      expect(result).toContain('export');
    });

    it('returns null for unknown IDs', () => {
      const plugins = vuraVitePlugin();
      const plugin = plugins.find((p) => p.name === 'vura')!;
      const result = (plugin as any).load('some-unknown-module');
      expect(result).toBeNull();
    });
  });
});
