import 'reflect-metadata';

import { MESSAGE_METADATA } from '@nestjs/websockets/constants';
import { describe, expect, it } from 'vitest';

import { RealtimeGateway } from './realtime.gateway.js';

describe('RealtimeGateway', () => {
  it('registers event.join on the correct handler', () => {
    const handler = Object.getOwnPropertyDescriptor(
      RealtimeGateway.prototype,
      'joinEvent',
    )?.value;

    expect(typeof handler).toBe('function');
    expect(
      Reflect.getMetadata(MESSAGE_METADATA, handler),
    ).toBe('event.join');
  });

  it('does not register handleConnection as a message handler', () => {
    const handler = Object.getOwnPropertyDescriptor(
      RealtimeGateway.prototype,
      'handleConnection',
    )?.value;

    expect(typeof handler).toBe('function');
    expect(
      Reflect.getMetadata(MESSAGE_METADATA, handler),
    ).toBeUndefined();
  });
});
