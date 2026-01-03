import { useState, useEffect, useRef, useCallback } from 'react';
import type { PC } from '@/types';

interface WebSocketMessage {
    type: 'initial_state' | 'metrics_update' | 'ping';
    pcs?: PC[];
    pc?: PC;
}

export function useWebSocketMetrics(carrera?: string) {
    const [pcs, setPcs] = useState<PC[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
    const pingIntervalRef = useRef<NodeJS.Timeout>();

    const connect = useCallback(() => {
        const apiUrl = import.meta.env.VITE_API_URL;
        if (!apiUrl) {
            setError('VITE_API_URL no configurado');
            return;
        }

        // Convertir HTTP URL a WebSocket URL
        const wsUrl = apiUrl.replace('http://', 'ws://').replace('https://', 'wss://');
        const url = carrera
            ? `${wsUrl}/api/monitoring/ws?carrera=${carrera}`
            : `${wsUrl}/api/monitoring/ws`;

        console.log('🔌 Conectando WebSocket:', url);

        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('✅ WebSocket conectado');
            setIsConnected(true);
            setError(null);

            // Enviar ping cada 20 segundos para mantener conexión
            pingIntervalRef.current = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send('ping');
                }
            }, 20000);
        };

        ws.onmessage = (event) => {
            try {
                const message: WebSocketMessage = JSON.parse(event.data);

                if (message.type === 'initial_state' && message.pcs) {
                    // Estado inicial completo
                    const transformedPCs = message.pcs.map(pc => ({
                        ...pc,
                        lastSeen: new Date(pc.lastSeen)
                    }));
                    setPcs(transformedPCs);
                } else if (message.type === 'metrics_update' && message.pc) {
                    // Actualización de un solo PC
                    const updatedPC = {
                        ...message.pc,
                        lastSeen: new Date(message.pc.lastSeen)
                    };

                    setPcs(prevPcs => {
                        const index = prevPcs.findIndex(p => p.id === updatedPC.id);
                        if (index >= 0) {
                            // Actualizar PC existente
                            const newPcs = [...prevPcs];
                            newPcs[index] = updatedPC;
                            return newPcs;
                        } else {
                            // Agregar nuevo PC
                            return [...prevPcs, updatedPC];
                        }
                    });
                }
            } catch (err) {
                console.error('❌ Error parseando mensaje WebSocket:', err);
            }
        };

        ws.onerror = (event) => {
            console.error('❌ Error WebSocket:', event);
            setError('Error de conexión WebSocket');
        };

        ws.onclose = () => {
            console.log('🔌 WebSocket desconectado');
            setIsConnected(false);

            // Limpiar ping interval
            if (pingIntervalRef.current) {
                clearInterval(pingIntervalRef.current);
            }

            // Reconectar después de 3 segundos
            reconnectTimeoutRef.current = setTimeout(() => {
                console.log('🔄 Reconectando WebSocket...');
                connect();
            }, 3000);
        };
    }, [carrera]);

    useEffect(() => {
        connect();

        // Cleanup al desmontar
        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (pingIntervalRef.current) {
                clearInterval(pingIntervalRef.current);
            }
        };
    }, [connect]);

    return { pcs, isConnected, error };
}
