from fastapi import WebSocket
from typing import List, Dict
import json

class ConnectionManager:
    """Gestiona todas las conexiones WebSocket activas"""
    
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.connection_filters: Dict[WebSocket, dict] = {}  # Filtros por conexión
    
    async def connect(self, websocket: WebSocket, carrera: str = None):
        """Acepta una nueva conexión WebSocket"""
        await websocket.accept()
        self.active_connections.append(websocket)
        self.connection_filters[websocket] = {"carrera": carrera}
        print(f"✅ Nueva conexión WebSocket (Total: {len(self.active_connections)})")
    
    def disconnect(self, websocket: WebSocket):
        """Elimina una conexión cerrada"""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            if websocket in self.connection_filters:
                del self.connection_filters[websocket]
            print(f"❌ Conexión WebSocket cerrada (Total: {len(self.active_connections)})")
    
    async def broadcast(self, message: dict, carrera: str = None):
        """Envía un mensaje a todas las conexiones activas (con filtro opcional)"""
        disconnected = []
        
        for connection in self.active_connections:
            # Aplicar filtro de carrera si existe
            conn_carrera = self.connection_filters.get(connection, {}).get("carrera")
            if carrera and conn_carrera and conn_carrera != carrera:
                continue  # Skip si no coincide el filtro
            
            try:
                await connection.send_json(message)
            except Exception as e:
                print(f"⚠️  Error enviando a WebSocket: {e}")
                disconnected.append(connection)
        
        # Limpiar conexiones muertas
        for conn in disconnected:
            self.disconnect(conn)
    
    async def send_personal(self, websocket: WebSocket, message: dict):
        """Envía un mensaje a una conexión específica"""
        try:
            await websocket.send_json(message)
        except Exception as e:
            print(f"⚠️  Error enviando mensaje personal: {e}")
            self.disconnect(websocket)

# Instancia global del manager
manager = ConnectionManager()
