#!/usr/bin/env python3
"""
Script para configurar Suricata de forma segura sin romper el YAML.
Detecta la interfaz de red y la configura en suricata.yaml.
"""
import re
import subprocess
import sys

def get_network_interface():
    """Detecta la interfaz de red principal (excluye lo, docker, veth)."""
    try:
        result = subprocess.run(
            ['ip', '-o', 'link', 'show'],
            capture_output=True,
            text=True,
            check=True
        )
        
        for line in result.stdout.splitlines():
            if any(x in line for x in ['lo:', 'docker', 'veth', 'virbr']):
                continue
            
            # Extraer nombre de interfaz (formato: "2: ens33: ...")
            match = re.search(r'\d+:\s+([^:]+):', line)
            if match:
                return match.group(1).strip()
        
        return "eth0"  # Fallback
    except Exception as e:
        print(f"⚠️  Error detectando interfaz: {e}", file=sys.stderr)
        return "eth0"

def configure_suricata(interface):
    """Configura Suricata con la interfaz correcta."""
    config_file = "/etc/suricata/suricata.yaml"
    
    try:
        with open(config_file, 'r') as f:
            content = f.read()
        
        # Reemplazar SOLO la primera ocurrencia de "interface: eth0" en la sección af-packet
        # Esto evita tocar otras secciones del archivo
        pattern = r'(af-packet:\s*-\s*interface:\s*)\S+'
        replacement = f'\\1{interface}'
        
        new_content = re.sub(pattern, replacement, content, count=1)
        
        if new_content != content:
            with open(config_file, 'w') as f:
                f.write(new_content)
            print(f"✅ Interfaz configurada: {interface}")
            return True
        else:
            print(f"⚠️  No se encontró la configuración de interfaz para modificar")
            return False
            
    except Exception as e:
        print(f"❌ Error configurando Suricata: {e}", file=sys.stderr)
        return False

def main():
    # Detectar interfaz
    interface = get_network_interface()
    print(f"🔍 Interfaz detectada: {interface}")
    
    # Configurar Suricata
    if configure_suricata(interface):
        # Reiniciar servicio
        try:
            subprocess.run(['systemctl', 'restart', 'suricata'], check=True)
            print("✅ Suricata reiniciado correctamente")
            return 0
        except subprocess.CalledProcessError:
            print("⚠️  No se pudo reiniciar Suricata automáticamente")
            print("   Ejecuta: sudo systemctl restart suricata")
            return 1
    else:
        return 1

if __name__ == "__main__":
    sys.exit(main())
