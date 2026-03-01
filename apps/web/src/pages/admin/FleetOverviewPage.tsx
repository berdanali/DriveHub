import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { io, Socket } from 'socket.io-client';
import L from 'leaflet';
import { Car, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

interface VehicleLocation {
    vehicleId: string;
    latitude: number;
    longitude: number;
    timestamp: Date;
}

interface Vehicle {
    id: string;
    make: string;
    model: string;
    licensePlate: string;
    latitude: number | null;
    longitude: number | null;
    status: string;
}

// Custom car icon for markers
const carIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3774/3774278.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
});

export default function FleetOverviewPage() {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [liveLocations, setLiveLocations] = useState<Map<string, VehicleLocation>>(new Map());

    // Fetch active vehicles with locations
    const { data: vehicles, refetch, isLoading } = useQuery<Vehicle[]>({
        queryKey: ['admin-fleet-locations'],
        queryFn: async () => {
            const response = await api.get('/vehicles/admin/active-locations');
            return response.data;
        },
    });

    // Setup WebSocket connection
    useEffect(() => {
        const newSocket = io('/gps', {
            transports: ['websocket'],
        });

        newSocket.on('connect', () => {
            console.log('Connected to GPS WebSocket');
            newSocket.emit('subscribeToAllVehicles');
        });

        newSocket.on('vehicleLocationUpdate', (location: VehicleLocation) => {
            setLiveLocations((prev) => new Map(prev).set(location.vehicleId, location));
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, []);

    // Merge static and live locations
    const displayVehicles = vehicles?.map((vehicle) => {
        const liveLocation = liveLocations.get(vehicle.id);
        return {
            ...vehicle,
            latitude: liveLocation?.latitude ?? vehicle.latitude,
            longitude: liveLocation?.longitude ?? vehicle.longitude,
            isLive: !!liveLocation,
        };
    }).filter((v) => v.latitude !== null && v.longitude !== null);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Filo Takibi</h1>
                    <p className="text-gray-500">Gerçek zamanlı araç konum haritası</p>
                </div>
                <button
                    onClick={() => refetch()}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                    <RefreshCw className="h-4 w-4" />
                    Yenile
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <Car className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Aktif Araçlar</p>
                            <p className="text-xl font-bold">{displayVehicles?.length || 0}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <div className="h-5 w-5 bg-blue-600 rounded-full animate-pulse" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Canlı Güncellemeler</p>
                            <p className="text-xl font-bold">{liveLocations.size}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <span className="text-purple-600 font-bold text-sm">WS</span>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">WebSocket Durumu</p>
                            <p className="text-xl font-bold">
                                {socket?.connected ? (
                                    <span className="text-green-600">Bağlı</span>
                                ) : (
                                    <span className="text-red-600">Bağlı Değil</span>
                                )}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Map */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="h-[600px]">
                    {isLoading ? (
                        <div className="h-full flex items-center justify-center">
                            <p className="text-gray-500">Harita yükleniyor...</p>
                        </div>
                    ) : (
                        <MapContainer
                            center={[39.9334, 32.8597]}
                            zoom={6}
                            style={{ height: '100%', width: '100%' }}
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            {displayVehicles?.map((vehicle) => (
                                <Marker
                                    key={vehicle.id}
                                    position={[vehicle.latitude!, vehicle.longitude!]}
                                    icon={carIcon}
                                >
                                    <Popup>
                                        <div className="text-sm">
                                            <p className="font-bold">{vehicle.make} {vehicle.model}</p>
                                            <p className="text-gray-500">{vehicle.licensePlate}</p>
                                            <p className={`text-xs mt-1 ${vehicle.isLive ? 'text-green-600' : 'text-gray-400'}`}>
                                                {vehicle.isLive ? '● Canlı' : '○ Son bilinen konum'}
                                            </p>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>
                    )}
                </div>
            </div>
        </div>
    );
}
