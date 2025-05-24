// server.js
const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = 3000;

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}
// Ruta básica de prueba
app.get('/', (req, res) => {
    res.send('¡Hola desde Express!');
});

// Ruta para obtener el precio real desde TradingView
app.get('/price', async (req, res) => {
    const ticker = req.query.ticker;
    if (!ticker) {
        return res.status(400).json({ error: 'Ticker requerido' });
    }

    let browser;
    try {
        browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();

        const url = `https://www.tradingview.com/symbols/${ticker}/`;
        console.log(`Navegando a ${url}...`);
        await page.goto(url, { waitUntil: 'networkidle2' });

        console.log(`Esperando el precio de ${ticker}...`);
        await delay(3000);  // Espera 3 segundos

        // Actualizamos el selector según lo que mencionaste
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
    }
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
