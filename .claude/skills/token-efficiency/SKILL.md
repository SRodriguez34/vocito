# /token-efficiency — Setup de herramientas de ahorro de tokens

## Proposito
Instalar y verificar las 3 herramientas de eficiencia de tokens activas en Vocito.
Correr esto UNA VEZ al inicio del proyecto, antes del primer modulo.

## Herramientas activas

### 1. Claude Token Efficient
Ya esta integrado en este CLAUDE.md — no requiere instalacion adicional.
El archivo se lee automaticamente al abrir el proyecto en Claude Code.

### 2. Caveman (65-75% menos tokens de salida)
```bash
# Instalacion con npx (recomendado)
npx skills add JuliusBrussee/caveman

# Alternativa: plugin marketplace
claude plugin marketplace add JuliusBrussee/caveman
claude plugin install caveman@caveman

# Verificar
# Escribir /caveman en Claude Code — debe responder en modo comprimido
```
Nota: Caveman afecta solo output tokens. El razonamiento interno no cambia.
Activar con /caveman, desactivar con "normal mode".

### 3. Context Mode (94-98% menos contexto de herramientas)
```bash
# Requiere Claude Code v1.0.33+ — verificar primero
claude --version

# Instalar
claude plugin marketplace add mksglu/context-mode
claude plugin install context-mode

# Verificar instalacion
# Dentro de Claude Code correr: /context-mode doctor
# Debe mostrar [x] en todos los checks
```
Nota: Context Mode no dicta como Claude escribe — solo filtra el output de herramientas
(resultados de bash, git status, npm install, etc.) antes de que entren al contexto.

### 4. Code Review Graph (instalar cuando repo > 100 archivos)
```bash
# Solo instalar cuando el proyecto tenga mas de 100 archivos
# En Modulo 1-3: NO instalar todavia

pip install code-review-graph
code-review-graph install --platform claude-code

# Despues de instalar, escanear el proyecto
code-review-graph build

# Verificar
code-review-graph stats
# Debe mostrar cantidad de archivos indexados y grafo generado
```

## Orden de instalacion recomendado
1. Este CLAUDE.md ya activo (automatico)
2. Caveman — antes de la primera sesion de codigo
3. Context Mode — antes de la primera sesion de codigo
4. Code Review Graph — cuando supere 100 archivos (Modulo 3+)

## Verificacion rapida
Al inicio de cada sesion Claude Code debe responder:
- Sin preamble ni "Entendido!"
- Respuestas cortas y directas
- Caveman mode en codigo: fragmentos sin explicaciones obvias
- Terminal output filtrado (Context Mode activo)

## Definition of Done
- [ ] /caveman responde en modo comprimido
- [ ] /context-mode doctor muestra todos [x]
- [ ] Claude responde sin preamble en la primera interaccion
- [ ] Sesion de 2 horas sin alcanzar limite de tokens
