# 📖 GUÍA DE USO ADMIN - DASHBOARD

## ⚡ ACCESO RÁPIDO A DATOS MANUALES

### Opción 1: Botón "Datos Manuales" (RECOMENDADO)
```
1. En el dashboard, busca los FILTROS (abajo del topbar)
2. Encontrarás un botón VERDE destacado: "➕ Datos Manuales"
3. Haz clic en él
4. Se abrirá un modal para ingresar datos
```

### Opción 2: Sección de Carga de Archivos
```
1. La sección "Carga de Datos" está siempre visible al inicio
2. Puedes:
   - Arrastrar un archivo Excel/PDF/CSV
   - O hacer clic para seleccionar archivo
3. Los datos se cargarán automáticamente
```

---

## 📝 INGRESO MANUAL DE DATOS (PASO A PASO)

### PASO 1: Abre el Modal
```
Botón: "➕ Datos Manuales" (verde, destacado)
```

### PASO 2: Selecciona País
```
Opciones:
  🇸🇻 El Salvador (por defecto)
  🇬🇹 Guatemala
```

### PASO 3: Selecciona Fecha
```
Campo: "Fecha *"
Formato: YYYY-MM-DD
Ejemplo: 2026-05-04
Requerido: SÍ
```

### PASO 4: Ingresa Registros (Usuarios)
```
Campo: "Registros (Usuarios) *"
Rango: 0 a 9999
Ejemplo: 50
Requerido: SÍ (mínimo 1 si no hay depósitos)
```

### PASO 5: Ingresa Depósitos (FTDs)
```
Campo: "Primeros Depósitos (FTD) *"
Rango: 0 a 9999
Límite: NO puede ser mayor que Registros
Ejemplo: 10
Requerido: SÍ (mínimo 1 si no hay registros)

⚠️ VALIDACIÓN AUTOMÁTICA:
   ❌ Si depósitos > registros → ERROR
   ❌ Si ambos = 0 → ERROR
   ✅ Si todo está bien → VERDE
```

### PASO 6: Agrega el Registro
```
Botón: "➕ Agregar Registro"
Resultado: El registro aparecerá en la lista de abajo
```

### PASO 7: (OPCIONAL) Agrega Más Registros
```
Puedes repetir PASOS 2-6 para agregar más días/países
Los registros se acumulan en la lista
```

### PASO 8: Guarda TODO
```
Botón: "✓ Guardar Todo" (abajo del modal)
Resultado:
  ✅ Se cierra el modal
  ✅ Los datos aparecen en la tabla principal
  ✅ Se actualizan los KPIs
```

---

## ✅ VALIDACIONES AUTOMÁTICAS

| Validación | Error | Solución |
|---|---|---|
| Fecha vacía | "Selecciona una fecha válida" | Completa el campo de fecha |
| Registros fuera de rango | "Rango: 0 a 9999" | Ingresa un número entre 0-9999 |
| Depósitos > Registros | "Los depósitos no pueden ser mayores a los registros" | Reduce depósitos o aumenta registros |
| Ambos ceros | "Ingresa al menos un registro o depósito" | Agrega al menos un valor |

---

## 🔄 FLUJO COMPLETO EJEMPLO

```
ESCENARIO: Agregar datos para 2 días, El Salvador

ACCIÓN 1: Abre "Datos Manuales"
  → Se abre el modal

ACCIÓN 2: País = El Salvador (ya seleccionado)
  → Continúa

ACCIÓN 3: Fecha = 2026-05-01
  → Escribe la fecha

ACCIÓN 4: Registros = 45
  → Escribe 45

ACCIÓN 5: Depósitos = 12
  → Escribe 12

ACCIÓN 6: Click "Agregar Registro"
  → Aparece en la lista: "01 may 2026 | 🇸🇻 El Salvador | 45 registros | 12 depósitos"

ACCIÓN 7: Fecha = 2026-05-02
  → Escribe la nueva fecha

ACCIÓN 8: Registros = 38
  → Escribe 38

ACCIÓN 9: Depósitos = 9
  → Escribe 9

ACCIÓN 10: Click "Agregar Registro"
  → Ahora hay 2 registros en la lista

ACCIÓN 11: Click "Guardar Todo"
  → Modal se cierra
  → Datos aparecen en la tabla
  → KPIs se actualizan

RESULTADO:
  ✅ Tabla muestra:
     Fecha       | País          | Registros | Depósitos
     01/05/2026  | 🇸🇻 El Salvador | 45       | 12
     02/05/2026  | 🇸🇻 El Salvador | 38       | 9
  ✅ KPIs actualizados: Total Registros = 83, Total Depósitos = 21
```

---

## 📊 CARGA DE ARCHIVOS (ALTERNATIVA)

### Soporta:
- ✅ Excel (.xlsx, .xls)
- ✅ PDF (.pdf) - con detección de "USUARIOS REGISTRADOS" y "CANTIDAD DE PRIMEROS DEPOSITOS"
- ✅ CSV (.csv)

### Proceso:
```
1. Haz clic o arrastra un archivo a "Carga de Datos"
2. Se procesará automáticamente
3. Los datos aparecerán en la tabla
4. Se mostrará mensaje de éxito con cantidad de registros
```

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Problema: No veo el botón "Datos Manuales"
**Solución:**
```
1. Recarga la página (Ctrl+R o Ctrl+F5)
2. Desplázate hacia abajo en los filtros
3. El botón verde "➕ Datos Manuales" debe estar visible
```

### Problema: El modal no abre
**Solución:**
```
1. Verifica que hiciste clic correctamente
2. Abre la consola del navegador (F12)
3. Busca errores (aparecerán en rojo)
4. Reporta el error exacto
```

### Problema: Dice "Los depósitos no pueden ser mayores a los registros"
**Solución:**
```
1. Asegúrate de que: Depósitos ≤ Registros
2. Ejemplo correcto: 45 registros, 12 depósitos ✅
3. Ejemplo incorrecto: 45 registros, 50 depósitos ❌
```

### Problema: Los datos no aparecen en la tabla
**Solución:**
```
1. Verifica que hiciste clic en "Guardar Todo"
2. Verifica que el modal se cerró
3. Desplázate en la tabla para ver los nuevos datos
4. Revisa los filtros (FECHA INICIAL / FECHA FINAL)
```

---

## 💾 DATOS SE GUARDAN AUTOMÁTICAMENTE

- ✅ Todos los datos se guardan en el navegador (localStorage)
- ✅ Persisten aunque cierres el navegador
- ✅ Se sincronizan cuando cargas archivos + datos manuales
- ✅ No se pierden datos al agregar más

---

## ⚠️ IMPORTANTE

```
NUNCA pierden datos:
✅ Cargar archivo → Datos manuales → Archivo nuevo
   Todos se suman correctamente

✅ Datos manuales de múltiples días
   Se suman por fecha y país

✅ Archivos + datos manuales del MISMO día
   Se suman (no se sobrescriben)
```

---

**Fecha:** 2026-05-04
**Estado:** ✅ LISTO PARA USAR
**Soporte:** Sigue esta guía paso a paso
