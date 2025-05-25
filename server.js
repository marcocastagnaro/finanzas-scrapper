const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = 3000;

// Cola de peticiones
const queue = [];
let isProcessing = false;

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

async function processQueue() {
    if (isProcessing) return; // Ya está procesando
    if (queue.length === 0) return; // Cola vacía

    isProcessing = true;
    const { ticker, res } = queue.shift();

    let browser;
    try {
        browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        const page = await browser.newPage();

        const url = `https://www.tradingview.com/symbols/${ticker}/`;
        console.log(`Navegando a ${url}...`);
        await page.goto(url, { waitUntil: 'networkidle2' });

        console.log(`Esperando el precio de ${ticker}...`);
        await delay(3000);  // Espera 3 segundos

        const selector = 'span.js-symbol-last > span';
        await page.waitForSelector(selector, { timeout: 10000 });

        const price = await page.$eval(selector, el => el.textContent.trim());

        console.log(`Precio de ${ticker}: ${price}`);
        res.json({ ticker, price });

    } catch (err) {
        console.error('Error al scrapear:', err.message);
        res.status(500).json({ error: 'Error al obtener precio desde TradingView' });
    } finally {
        if (browser) {
            await browser.close();
        }
        isProcessing = false;
        // Procesa siguiente petición en la cola
        processQueue();
    }
}

app.get('/', (req, res) => {
    res.send('¡Hola desde Express!');
});

app.get('/price', (req, res) => {
    const ticker = req.query.ticker;
    if (!ticker) {
        return res.status(400).json({ error: 'Ticker requerido' });
    }

    // Pusheamos la petición a la cola
    queue.push({ ticker, res });
    processQueue();
});

app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
