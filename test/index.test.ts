import fastify from 'fastify';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

import type { FastifyInstance } from 'fastify';

import { fastifyHookable, isCreateDebuggerOptions } from '../src/index';

describe('@zahoor/fastify-hookable', () => {
  let serve: FastifyInstance;
  const beforeSpied = vi.fn();
  const afterSpied = vi.fn();
  const closeSpied = vi.fn();

  beforeAll(async () => {
    serve = fastify();

    serve.register(fastifyHookable, {
      before: beforeSpied,
      after: afterSpied,
      close: closeSpied,
      debuggerOptions: { tag: 'test', inspect: false, group: true, filter: 'hook:' }
    });

    // 注册临时路由，用于 request hookable 测试
    serve.get('/test-request', async request => {
      expect(request.hookable).toBeDefined();
      expect(typeof request.hookable.callHook).toBe('function');
      return { ok: true };
    });

    await serve.ready();
  });

  afterAll(async () => {
    await serve.close();
  });

  // --------------------------------------------
  // Fastify instance & request decoration
  // --------------------------------------------

  it('should decorate Fastify instance with hookable', () => {
    expect(serve.hookable).toBeDefined();
    expect(typeof serve.hookable.callHook).toBe('function');
  });

  it('should decorate Fastify request with hookable', async () => {
    const res = await serve.inject({ method: 'GET', url: '/test-request' });
    expect(res.statusCode).toBe(200);
  });

  // --------------------------------------------
  // Hooks
  // --------------------------------------------

  it('should call before and after hooks correctly', async () => {
    const hookName = 'test:hook';
    serve.hookable.hook(hookName, (msg: string) => `hooked-${msg}`);

    const result = await serve.hookable.callHook(hookName, 'message');

    expect(result).toEqual('hooked-message');
    expect(beforeSpied).toHaveBeenCalled();
    expect(afterSpied).toHaveBeenCalled();
  });

  // --------------------------------------------
  // close callback
  // --------------------------------------------

  it('should call close hook on server shutdown', async () => {
    // Create a new instance for testing close independently
    const fastifyClose = fastify();
    const spied = vi.fn();

    fastifyClose.register(fastifyHookable, { close: spied });
    await fastifyClose.ready();
    // expect(spied).not.toHaveBeenCalled();

    await fastifyClose.close(); // triggers onClose
    expect(spied).toHaveBeenCalled();
  });

  // --------------------------------------------
  // debuggerOptions branch (indirectly tested via registration)
  // --------------------------------------------

  it('should execute debuggerOptions branch without errors', async () => {
    const hookName = 'debugger:hook';
    serve.hookable.hook(hookName, () => 'ok');
    const result = await serve.hookable.callHook(hookName);
    expect(result).toEqual('ok');
  });

  // --------------------------------------------
  // isCreateDebuggerOptions
  // --------------------------------------------

  it('should return true for valid CreateDebuggerOptions', () => {
    expect(isCreateDebuggerOptions({ tag: 'test' })).toBe(true);
    expect(isCreateDebuggerOptions({ inspect: true })).toBe(true);
    expect(isCreateDebuggerOptions({ group: false })).toBe(true);
    expect(isCreateDebuggerOptions({ filter: 'hook:' })).toBe(true);
    expect(isCreateDebuggerOptions({ filter: () => true })).toBe(true);
  });

  it('should return false for invalid CreateDebuggerOptions', () => {
    expect(isCreateDebuggerOptions(null)).toBe(false);
    expect(isCreateDebuggerOptions({ tag: 123 })).toBe(false);
    expect(isCreateDebuggerOptions({ inspect: 'yes' })).toBe(false);
    expect(isCreateDebuggerOptions({ group: 'no' })).toBe(false);
    expect(isCreateDebuggerOptions({ filter: 123 })).toBe(false);
  });
});
