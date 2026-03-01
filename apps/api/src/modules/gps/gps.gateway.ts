import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { GpsService, GPSLocation } from './gps.service';

interface UpdateLocationPayload {
    vehicleId: string;
    latitude: number;
    longitude: number;
    speed?: number;
    heading?: number;
    accuracy?: number;
}

@WebSocketGateway({
    namespace: 'gps',
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
})
export class GpsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(GpsGateway.name);
    private readonly connectedClients = new Map<string, Set<string>>();

    constructor(private readonly gpsService: GpsService) { }

    handleConnection(client: Socket): void {
        this.logger.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket): void {
        this.logger.log(`Client disconnected: ${client.id}`);
        // Remove from all tracked vehicles
        this.connectedClients.forEach((clients, vehicleId) => {
            clients.delete(client.id);
            if (clients.size === 0) {
                this.connectedClients.delete(vehicleId);
            }
        });
    }

    /**
     * Client subscribes to vehicle location updates
     */
    @SubscribeMessage('subscribeToVehicle')
    handleSubscribe(
        @ConnectedSocket() client: Socket,
        @MessageBody() vehicleId: string,
    ): void {
        if (!this.connectedClients.has(vehicleId)) {
            this.connectedClients.set(vehicleId, new Set());
        }
        this.connectedClients.get(vehicleId)!.add(client.id);
        client.join(`vehicle:${vehicleId}`);
        this.logger.log(`Client ${client.id} subscribed to vehicle ${vehicleId}`);
    }

    /**
     * Client unsubscribes from vehicle location updates
     */
    @SubscribeMessage('unsubscribeFromVehicle')
    handleUnsubscribe(
        @ConnectedSocket() client: Socket,
        @MessageBody() vehicleId: string,
    ): void {
        const clients = this.connectedClients.get(vehicleId);
        if (clients) {
            clients.delete(client.id);
            if (clients.size === 0) {
                this.connectedClients.delete(vehicleId);
            }
        }
        client.leave(`vehicle:${vehicleId}`);
        this.logger.log(`Client ${client.id} unsubscribed from vehicle ${vehicleId}`);
    }

    /**
     * Receive and broadcast GPS location updates
     * This is called by the vehicle's GPS device/app
     */
    @SubscribeMessage('updateLocation')
    async handleLocationUpdate(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: UpdateLocationPayload,
    ): Promise<void> {
        const location: GPSLocation = {
            ...payload,
            timestamp: new Date(),
        };

        // Store the location
        await this.gpsService.recordLocation(location);

        // Broadcast to all subscribers of this vehicle
        this.server.to(`vehicle:${payload.vehicleId}`).emit('locationUpdate', location);

        // Also broadcast to admin room
        this.server.to('admin').emit('vehicleLocationUpdate', location);
    }

    /**
     * Admin subscribes to all vehicle updates
     */
    @SubscribeMessage('subscribeToAllVehicles')
    handleAdminSubscribe(@ConnectedSocket() client: Socket): void {
        client.join('admin');
        this.logger.log(`Admin client ${client.id} subscribed to all vehicles`);
    }

    /**
     * Get current locations of all active vehicles
     */
    @SubscribeMessage('getAllLocations')
    async handleGetAllLocations(
        @ConnectedSocket() client: Socket,
    ): Promise<GPSLocation[]> {
        return this.gpsService.getAllActiveLocations();
    }

    /**
     * Broadcast location update to all relevant clients
     * This can be called from the service
     */
    broadcastLocationUpdate(location: GPSLocation): void {
        this.server.to(`vehicle:${location.vehicleId}`).emit('locationUpdate', location);
        this.server.to('admin').emit('vehicleLocationUpdate', location);
    }
}
