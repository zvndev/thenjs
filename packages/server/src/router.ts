// @thenjs/server — Radix tree router with URL pattern matching

import type { RouteMethod, InternalRoute, RouteMatch, RouteHandler, RouteHooks } from './types.js';

interface RadixNode {
  segment: string;
  children: Map<string, RadixNode>;
  /** Parameter child (e.g., :id) */
  paramChild: RadixNode | null;
  paramName: string | null;
  /** Wildcard/catch-all child (e.g., *path) */
  wildcardChild: RadixNode | null;
  wildcardName: string | null;
  /** Route handlers by method */
  routes: Map<RouteMethod, InternalRoute>;
}

function createNode(segment = ''): RadixNode {
  return {
    segment,
    children: new Map(),
    paramChild: null,
    paramName: null,
    wildcardChild: null,
    wildcardName: null,
    routes: new Map(),
  };
}

export class Router {
  private root = createNode();

  addRoute(
    method: RouteMethod,
    url: string,
    handler: RouteHandler,
    kind: 'serverless' | 'hot' | 'task' = 'serverless',
    schema?: InternalRoute['schema'],
    hooks?: Partial<RouteHooks>,
  ): void {
    const segments = this.splitPath(url);
    let node = this.root;

    for (const seg of segments) {
      if (seg.startsWith(':')) {
        // Parameter segment
        if (!node.paramChild) {
          node.paramChild = createNode(seg);
          node.paramName = seg.slice(1);
        }
        node = node.paramChild;
      } else if (seg.startsWith('*')) {
        // Wildcard/catch-all
        if (!node.wildcardChild) {
          node.wildcardChild = createNode(seg);
          node.wildcardName = seg.slice(1) || 'wild';
        }
        node = node.wildcardChild;
        break; // Wildcard consumes everything
      } else {
        // Static segment
        let child = node.children.get(seg);
        if (!child) {
          child = createNode(seg);
          node.children.set(seg, child);
        }
        node = child;
      }
    }

    const route: InternalRoute = {
      method,
      url,
      handler,
      kind,
      schema,
      hooks: {
        onRequest: hooks?.onRequest ?? [],
        preHandler: hooks?.preHandler ?? [],
        preSerialization: hooks?.preSerialization ?? [],
      },
    };

    node.routes.set(method, route);
  }

  match(method: RouteMethod, pathname: string): RouteMatch | null {
    const segments = this.splitPath(pathname);
    const params: Record<string, string> = {};

    const result = this.matchNode(this.root, segments, 0, params);
    if (!result) return null;

    const route = result.routes.get(method);
    if (!route) return null;

    return {
      handler: route.handler,
      params: { ...params },
      route,
    };
  }

  private matchNode(
    node: RadixNode,
    segments: string[],
    index: number,
    params: Record<string, string>,
  ): RadixNode | null {
    // All segments consumed — check this node has routes
    if (index >= segments.length) {
      return node.routes.size > 0 ? node : null;
    }

    const seg = segments[index]!;

    // 1. Try static match first (highest priority)
    const staticChild = node.children.get(seg);
    if (staticChild) {
      const result = this.matchNode(staticChild, segments, index + 1, params);
      if (result) return result;
    }

    // 2. Try parameter match
    if (node.paramChild && node.paramName) {
      params[node.paramName] = seg;
      const result = this.matchNode(node.paramChild, segments, index + 1, params);
      if (result) return result;
      delete params[node.paramName];
    }

    // 3. Try wildcard match (lowest priority, consumes rest)
    if (node.wildcardChild && node.wildcardName) {
      params[node.wildcardName] = segments.slice(index).join('/');
      return node.wildcardChild;
    }

    return null;
  }

  private splitPath(path: string): string[] {
    return path.split('/').filter(Boolean);
  }

  /** Get all registered routes (for manifest generation) */
  getAllRoutes(): InternalRoute[] {
    const routes: InternalRoute[] = [];
    this.collectRoutes(this.root, routes);
    return routes;
  }

  private collectRoutes(node: RadixNode, routes: InternalRoute[]): void {
    for (const route of node.routes.values()) {
      routes.push(route);
    }
    for (const child of node.children.values()) {
      this.collectRoutes(child, routes);
    }
    if (node.paramChild) {
      this.collectRoutes(node.paramChild, routes);
    }
    if (node.wildcardChild) {
      this.collectRoutes(node.wildcardChild, routes);
    }
  }
}
