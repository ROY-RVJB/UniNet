#!/usr/bin/env python3
"""
Script de prueba para verificar el sistema de persistencia
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from database import db
from datetime import datetime

def test_database():
    print("🧪 Iniciando pruebas del sistema de persistencia...")
    
    # 1. Inicializar BD
    print("\n1️⃣ Inicializando base de datos...")
    db.init_database()
    
    # 2. Guardar un cliente de prueba
    print("\n2️⃣ Guardando cliente de prueba...")
    test_client = {
        'id': 'pc-test-01',
        'ip': '192.168.1.100',
        'user': 'alumno_test',
        'carrera': '5010',
        'last_seen': datetime.now(),
        'first_seen': datetime.now()
    }
    db.save_client('test-pc-hostname', test_client)
    print("   ✅ Cliente guardado")
    
    # 3. Cargar todos los clientes
    print("\n3️⃣ Cargando clientes desde BD...")
    clients = db.load_all_clients()
    print(f"   ✅ {len(clients)} cliente(s) encontrado(s)")
    for hostname, data in clients.items():
        print(f"      - {hostname}: {data['id']} ({data['ip']})")
    
    # 4. Guardar regla de red
    print("\n4️⃣ Guardando regla de red...")
    db.save_network_rule('5010', 'bloquear')
    print("   ✅ Regla guardada")
    
    # 5. Cargar reglas de red
    print("\n5️⃣ Cargando reglas de red...")
    rules = db.load_network_rules()
    print(f"   ✅ {len(rules)} regla(s) encontrada(s)")
    for gid, action in rules.items():
        print(f"      - Carrera {gid}: {action}")
    
    # 6. Guardar log de prueba
    print("\n6️⃣ Guardando log de prueba...")
    test_log = {
        'id': 'test-log-01',
        'timestamp': datetime.now().strftime("%H:%M:%S"),
        'level': 'INFO',
        'category': 'SYSTEM',
        'message': '🧪 Este es un log de prueba',
        'carrera': '5010',
        'hostname': 'test-pc-hostname'
    }
    db.save_log(test_log)
    print("   ✅ Log guardado")
    
    # 7. Cargar logs
    print("\n7️⃣ Cargando logs desde BD...")
    logs = db.load_logs(limit=10)
    print(f"   ✅ {len(logs)} log(s) encontrado(s)")
    for log in logs[:3]:
        print(f"      - [{log['level']}] {log['message']}")
    
    # 8. Obtener cliente específico
    print("\n8️⃣ Obteniendo cliente específico...")
    client = db.get_client('test-pc-hostname')
    if client:
        print(f"   ✅ Cliente encontrado: {client['id']}")
    else:
        print("   ❌ Cliente no encontrado")
    
    print("\n✅ ¡Todas las pruebas completadas exitosamente!")
    print("\n📊 Resumen:")
    print(f"   - Clientes registrados: {len(clients)}")
    print(f"   - Reglas de red: {len(rules)}")
    print(f"   - Logs almacenados: {len(logs)}")
    print(f"\n💾 Base de datos ubicada en: {db.DB_PATH}")

if __name__ == "__main__":
    test_database()
