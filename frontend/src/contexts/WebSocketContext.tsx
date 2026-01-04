import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react';
import type { PC } from '@/types';

interface WebSocketMessage {
    type: 'initial_state' | 'metrics_update' | 'ping';
    pcs?: PC[];
    pc?: PC;
}

interface WebSocketContextType {
    pcs: PC[];
    isConnected: boolean;
    error: string | null;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children, carrera }: { children: ReactNode; carrera?: string }) {
    const [pcs, setPcs] = useState<PC[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<number | undefined>(undefined);
    const pingIntervalRef = useRef<number | undefined>(undefined);
    const isConnectingRef = useRef(false);

    useEffect(() => {
        const connect = () => {
            // Prevenir múltiples conexiones simultáneas
            if (isConnectingRef.current || (wsRef.current && wsRef.current.readyState === WebSocket.OPEN)) {
                return;
            }

            const apiUrl = import.meta.env.VITE_API_URL;
            if (!apiUrl) {
                setError('VITE_API_URL no configurado');
                return;
            }

            const wsUrl = apiUrl.replace('http://', 'ws://').replace('https://', 'wss://');
            const url = carrera
                ? `${wsUrl}/api/monitoring/ws?carrera=${carrera}`
                : `${wsUrl}/api/monitoring/ws`;

            console.log('🔌 Conectando WebSocket Global:', url);
            isConnectingRef.current = true;

            const ws = new WebSocket(url);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log('✅ WebSocket Global conectado');
                isConnectingRef.current = false;
                setIsConnected(true);
                setError(null);

                pingIntervalRef.current = setInterval(() => {
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send('ping');
                    }
                }, 20000);
            };

            ws.onmessage = (event) => {
                try {
                    if (typeof event.data === 'string' && (event.data === 'ping' || event.data === 'pong')) {
                        return;
                    }

                    const message: WebSocketMessage = JSON.parse(event.data);

                    if (message.type === 'initial_state' && message.pcs) {
                        const transformedPCs = message.pcs.map(pc => ({
                            ...pc,
                            lastSeen: new Date(pc.lastSeen)
                        }));
                        setPcs(transformedPCs);
                    } else if (message.type === 'metrics_update' && message.pc) {
                        const updatedPC = {
                            ...message.pc,
                            lastSeen: new Date(message.pc.lastSeen)
                        };

                        setPcs(prevPcs => {
                            const index = prevPcs.findIndex(p => p.id === updatedPC.id);
                            if (index >= 0) {
                                const newPcs = [...prevPcs];
                                newPcs[index] = updatedPC;
                                return newPcs;
                            } else {
                                return [...prevPcs, updatedPC];
                            }
                        });
                    }
                } catch (err) {
                    console.error('❌ Error parseando mensaje WebSocket:', err);
                }
            };

            ws.onerror = () => {
                isConnectingRef.current = false;
                setError('Error de conexión WebSocket');
            };

            ws.onclose = () => {
                console.log('🔌 WebSocket Global desconectado');
                isConnectingRef.current = false;
                setIsConnected(false);

                if (pingIntervalRef.current) {
                    clearInterval(pingIntervalRef.current);
                }

                reconnectTimeoutRef.current = setTimeout(() => {
                    console.log('🔄 Reconectando WebSocket Global...');
                    connect();
                }, 3000);
            };
        };

        connect();

        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = undefined;
            }

            if (pingIntervalRef.current) {
                clearInterval(pingIntervalRef.current);
                pingIntervalRef.current = undefined;
            }

            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }

            isConnectingRef.current = false;
        };
    }, [carrera]);

    return (
        <WebSocketContext.Provider value={{ pcs, isConnected, error }}>
            {children}
        </WebSocketContext.Provider>
    );
}

export function useWebSocket() {
    const context = useContext(WebSocketContext);
    if (context === undefined) {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    }
    return context;
}
