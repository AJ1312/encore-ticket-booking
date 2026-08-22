import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ namespace: '/realtime', cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true } })
export class RealtimeGateway {
  @WebSocketServer() server!: Server;

  @SubscribeMessage('join-show')
  joinShow(client: Socket, showId: string) {
    if (!/^[0-9a-f-]{36}$/i.test(showId)) return { ok: false };
    void client.join(`show:${showId}`);
    return { ok: true };
  }

  emitSeatUpdate(showId: string) {
    this.server.to(`show:${showId}`).emit('seat-updated', { showId });
  }
}
