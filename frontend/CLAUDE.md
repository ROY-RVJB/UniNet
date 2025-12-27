# Instrucciones de Memoria para Claude Code - UniNet Frontend

## Verificación de Carga
Al iniciar cualquier sesión, SIEMPRE:
1. Decir: "✓ CLAUDE.md cargado"
2. Ejecutar `read_graph` para cargar memoria
3. Reportar cuántas entidades existen en memoria

## Sistema de Memoria MCP
Este proyecto usa `@modelcontextprotocol/server-memory` para persistencia.
Archivo de memoria: `.claude/memory.jsonl`

## Protocolo de Sesión

### Al Iniciar Sesión
1. Ejecutar `read_graph` para cargar el estado actual del proyecto
2. Revisar entidades existentes antes de hacer cambios

### Durante el Desarrollo
Registrar en memoria cuando ocurra:

| Evento | Acción |
|--------|--------|
| Nuevo componente creado | `create_entities` tipo "component" |
| Archivo modificado significativamente | `add_observations` al archivo |
| Nueva dependencia instalada | `create_entities` tipo "dependency" |
| Bug resuelto | `add_observations` con solución |
| Decisión arquitectónica | `create_entities` tipo "decision" |
| TODO pendiente | `add_observations` tipo "pending" |

### Estructura de Entidades
```json
{
  "entities": [
    {"name": "ComponentName", "entityType": "component", "observations": ["ruta: src/components/X.tsx", "propósito: ..."]},
    {"name": "feature-auth", "entityType": "feature", "observations": ["estado: en progreso", "archivos: [...]"]},
    {"name": "decision-001", "entityType": "decision", "observations": ["usar Zustand para estado global", "razón: simplicidad"]}
  ]
}
```

### Relaciones Útiles
- `component` → "belongs_to" → `feature`
- `file` → "depends_on" → `dependency`
- `bug` → "resolved_in" → `component`

### Al Finalizar Sesión
Crear observación resumen:
```
add_observations: "session-YYYY-MM-DD" 
- Cambios principales realizados
- Estado actual del desarrollo
- Próximos pasos sugeridos
```

## Categorías de Memoria

### Prioridad Alta (siempre registrar)
- Cambios en estructura de carpetas
- Nuevos componentes/páginas
- Configuraciones modificadas (vite, tailwind, etc.)
- Errores resueltos con solución no obvia

### Prioridad Media (registrar si es relevante)
- Refactorizaciones
- Optimizaciones
- Cambios de estilo/UI

### No Registrar
- Cambios menores de texto
- Formateo de código
- Imports reorganizados