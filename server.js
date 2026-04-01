/**
 * Servidor Express - GanaPlay Smart Dashboard
 * Desarrollado por: Senior Fullstack Developer
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const csvParser = require('csv-parser');
const cors = require('cors');

// Importar el módulo de lógica matemática y procesamiento de datos
const { analyzeCampaignData } = require('./code');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Aumentar límite para datos grandes
// Servir la carpeta public (dashboard frontend HTML)
app.use(express.static(path.join(__dirname, 'public')));

// Ruta explícita para la raíz para evitar el error "Cannot GET /"
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Constantes de negocio
const GLOBAL_BUDGET = 50000; // Presupuesto de $50k hasta Junio 2026
const DEADLINE = "2026-06-30T23:59:59-05:00"; 

/**
 * Endpoint GET /api/report
 * Lee el CSV en tiempo real, parsea y computa el estado de campaña
 */
app.get('/api/report', (req, res) => {
    const results = [];
    const csvFilePath = path.join(__dirname, 'data.csv');

    if (!fs.existsSync(csvFilePath)) {
        return res.status(404).json({ error: "Archivo data.csv no encontrado, por favor cárgalo en servidor." });
    }

    // Leemos y estructuramos las filas del CSV convirtiendo valores de texto a números
    fs.createReadStream(csvFilePath)
        .pipe(csvParser())
        .on('data', (data) => {
            // Transformación de los campos CSV (strings por defecto) a los tipos de datos requeridos (números)
            results.push({
                Fecha: data.Fecha,
                Inversión: parseFloat(data.Inversión),
                Registros: parseInt(data.Registros, 10),
                FTDs: parseInt(data.FTDs, 10)
            });
        })
        .on('end', () => {
            try {
                // Pasamos nuestra data parseada al Core del motor que creamos en code.js
                const dashboardReport = analyzeCampaignData(results, GLOBAL_BUDGET, DEADLINE);
                
                // Entregamos el resultado limpio JSON al frontend (React, Angular, etc.)
                res.status(200).json(dashboardReport);
            } catch (error) {
                console.error("Error al procesar data matemática:", error);
                res.status(500).json({ error: "Falló el motor de análisis de campaña" });
            }
        });
});

// Ruta del archivo de datos sincronizados
const SYNC_DATA_PATH = path.join(__dirname, 'dashboard_data.json');

/**
 * Endpoint POST /api/save-data
 * Recibe y guarda el estado del dashboard en el servidor para sincronización entre dispositivos
 */
app.post('/api/save-data', (req, res) => {
    try {
        const data = req.body;
        if (!data) return res.status(400).json({ error: 'No se recibieron datos.' });

        const payload = {
            ...data,
            savedAt: new Date().toISOString()
        };

        fs.writeFileSync(SYNC_DATA_PATH, JSON.stringify(payload, null, 2), 'utf8');
        console.log(`💾 [SYNC] Datos guardados en servidor: ${globalData ? JSON.stringify(payload).length : 0} bytes`);
        res.status(200).json({ success: true, savedAt: payload.savedAt });
    } catch (error) {
        console.error('❌ Error guardando datos sync:', error);
        res.status(500).json({ error: 'No se pudieron guardar los datos.' });
    }
});

/**
 * Endpoint GET /api/load-data
 * Devuelve el estado guardado del dashboard para restaurar en cualquier dispositivo
 */
app.get('/api/load-data', (req, res) => {
    try {
        if (!fs.existsSync(SYNC_DATA_PATH)) {
            return res.status(404).json({ error: 'No hay datos guardados en el servidor aún.' });
        }
        const raw = fs.readFileSync(SYNC_DATA_PATH, 'utf8');
        const data = JSON.parse(raw);
        console.log(`📡 [SYNC] Datos enviados al cliente. Guardados: ${data.savedAt}`);
        res.status(200).json(data);
    } catch (error) {
        console.error('❌ Error cargando datos sync:', error);
        res.status(500).json({ error: 'No se pudieron cargar los datos del servidor.' });
    }
});

/**
 * Endpoint simple de test de vitalidad
 */
app.get('/health', (req, res) => {
    res.status(200).json({ status: "Operative", message: "API GanaPlay Dashboard 1.0 viva conectada al motor BI." });
});

// Levantar el servidor
app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`🚀 [BACKEND] GanaPlay Smart Dashboard corriendo en http://localhost:${PORT}`);
    console.log(`📡 Revisa el reporte de BI en -> http://localhost:${PORT}/api/report`);
    console.log(`=========================================`);
});
