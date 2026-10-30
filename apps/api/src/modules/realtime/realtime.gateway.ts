import {
  JwtService,
} from '@nestjs/jwt';

import {
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';

import type {
  Namespace,
  Socket,
} from 'socket.io';

import {
  UserRole,
} from '../../../generated/prisma/client.js';

import {
  PrismaService,
} from '../../database/prisma.service.js';

type JwtPayload = {
  sub: string;
  email: string;
  role: UserRole;
};

type RealtimeUser = {
  id: string;
  role: UserRole;
};

type JoinEventPayload = {
  eventId: string;
};

type CheckInCreatedPayload = {
  eventId: string;
  gateId: string;
  checkInId: string;
  createdAt: Date;
};

@WebSocketGateway({
  namespace: '/realtime',

  cors: {
    origin:
      process.env.WEB_ORIGIN ??
      'http://localhost:3000',

    credentials: true,
  },
})
export class RealtimeGateway
  implements OnGatewayInit
{
  @WebSocketServer()
  private server!: Namespace;

  constructor(
    private readonly jwtService:
      JwtService,

    private readonly prisma:
      PrismaService,
  ) {}

  afterInit(
    server: Namespace,
  ) {
    server.use(
      async (
        socket,
        next,
      ) => {
        const token =
          this.extractToken(
            socket,
          );

        if (!token) {
          next(
            new Error(
              'Authentication required',
            ),
          );

          return;
        }

        try {
          const payload =
            await this.jwtService
              .verifyAsync<JwtPayload>(
                token,
              );

          const user =
            await this.prisma
              .user
              .findUnique({
                where: {
                  id: payload.sub,
                },

                select: {
                  id: true,
                  role: true,
                },
              });

          if (!user) {
            next(
              new Error(
                'User no longer exists',
              ),
            );

            return;
          }

          socket.data.user =
            user;

          next();
        } catch {
          next(
            new Error(
              'Invalid or expired token',
            ),
          );
        }
      },
    );
  }

  @SubscribeMessage(
    'event.join',
  )
  async joinEvent(
    @ConnectedSocket()
    client: Socket,

    @MessageBody()
    data: JoinEventPayload,
  ) {
    const user =
      client.data.user as
        | RealtimeUser
        | undefined;

    if (!user) {
      throw new WsException(
        'Authentication required',
      );
    }

    if (
      user.role !==
        UserRole.ORGANIZER &&
      user.role !==
        UserRole.SUPER_ADMIN
    ) {
      throw new WsException(
        'You are not allowed to monitor events',
      );
    }

    const eventId =
      data?.eventId?.trim();

    if (!eventId) {
      throw new WsException(
        'Event ID is required',
      );
    }

    const event =
      await this.prisma
        .event
        .findUnique({
          where: {
            id: eventId,
          },

          select: {
            id: true,
            organizerId: true,
          },
        });

    if (!event) {
      throw new WsException(
        'Event not found',
      );
    }

    if (
      user.role !==
        UserRole.SUPER_ADMIN &&
      event.organizerId !==
        user.id
    ) {
      throw new WsException(
        'Event not found',
      );
    }

    await client.join(
      this.eventRoom(
        event.id,
      ),
    );

    client.emit(
      'event.joined',
      {
        eventId:
          event.id,
      },
    );
  }

  emitCheckInCreated(
    payload:
      CheckInCreatedPayload,
  ) {
    this.server
      .to(
        this.eventRoom(
          payload.eventId,
        ),
      )
      .emit(
        'checkin.created',
        {
          eventId:
            payload.eventId,

          gateId:
            payload.gateId,

          checkInId:
            payload.checkInId,

          createdAt:
            payload.createdAt
              .toISOString(),
        },
      );
  }

  private eventRoom(
    eventId: string,
  ) {
    return `event:${eventId}`;
  }

  private extractToken(
    socket: Socket,
  ): string | undefined {
    const authToken =
      socket.handshake.auth
        ?.token;

    if (
      typeof authToken ===
        'string' &&
      authToken.trim()
    ) {
      return authToken.trim();
    }

    const authorization =
      socket.handshake
        .headers
        .authorization;

    if (!authorization) {
      return undefined;
    }

    const [
      type,
      token,
    ] =
      authorization.split(
        ' ',
      );

    return type ===
      'Bearer'
      ? token
      : undefined;
  }
}
