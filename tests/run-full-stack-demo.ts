#!/usr/bin/env ts-node

/**
 * Full Stack Demo Runner
 * Demonstrates the complete WebAI-MCP architecture in action
 */

import { ChromeExtensionSimulator } from './mocks/chrome-extension-simulator';
import { McpServerSimulator } from './mocks/mcp-server-simulator';
import express from 'express';
import { createServer } from 'http';
import WebSocket from 'ws';

async function runFullStackDemo() {
  console.log('🚀 Starting WebAI-MCP Full Stack Demo\n');

  // 1. Start MCP Server (webai-mcp)
  console.log('📦 Starting MCP Server...');
  const mcpServer = new McpServerSimulator(3030);
  await mcpServer.start();
  console.log('✅ MCP Server running on port 3030\n');

  // 2. Start WebAI Server (middleman)
  console.log('🔧 Starting WebAI Server...');
  const webaiApp = express();
  webaiApp.use(express.json());

  const activeConnections = new Set();

  // WebAI Server routes
  webaiApp.get('/.identity', (req, res) => {
    res.json({
      name: 'WebAI Server',
      version: '1.5.0',
      status: 'running',
      connections: activeConnections.size,
      mcpConnected: true
    });
  });

  webaiApp.post('/capture-screenshot', async (req, res) => {
    if (activeConnections.size === 0) {
      return res.status(503).json({
        error: 'No active extension connections',
        success: false
      });
    }

    try {
      // Forward to MCP server
      const mcpResponse = await fetch('http://localhost:3030/tools/screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body)
      });

      const mcpData = await mcpResponse.json() as any;
      
      // Send request to extension via WebSocket
      const wsMessage = {
        type: 'capture-screenshot',
        requestId: Date.now().toString(),
        data: mcpData.data
      };

      // Send to all connected extensions
      activeConnections.forEach((ws: any) => {
        if (ws.readyState === 1) {
          ws.send(JSON.stringify(wsMessage));
        }
      });

      res.json(mcpData);
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to communicate with MCP server',
        success: false,
        details: error.message
      });
    }
  });

  webaiApp.get('/console-logs', async (req, res) => {
    try {
      const mcpResponse = await fetch('http://localhost:3030/tools/console-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters: req.query })
      });

      const mcpData = await mcpResponse.json() as any;
      res.json(mcpData.data || []);
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to retrieve console logs',
        details: error.message
      });
    }
  });

  // Setup HTTP and WebSocket servers
  const httpServer = createServer(webaiApp);
  const wsServer = new WebSocket.Server({ server: httpServer });

  wsServer.on('connection', (ws: any) => {
    console.log('🔌 Extension connected to WebAI Server');
    activeConnections.add(ws);

    ws.on('message', (message: any) => {
      try {
        const data = JSON.parse(message.toString());
        console.log(`📨 Received from extension: ${data.type}`);
      } catch (error) {
        console.error('❌ Invalid message from extension:', error);
      }
    });

    ws.on('close', () => {
      console.log('🔌 Extension disconnected from WebAI Server');
      activeConnections.delete(ws);
    });
  });

  await new Promise<void>((resolve) => {
    httpServer.listen(3025, () => {
      console.log('✅ WebAI Server running on port 3025\n');
      resolve();
    });
  });

  // 3. Start Chrome Extension Simulator
  console.log('🌐 Starting Chrome Extension Simulator...');
  const extension = new ChromeExtensionSimulator('ws://localhost:3025');
  await extension.connect();
  console.log('✅ Chrome Extension connected\n');

  // 4. Demonstrate the full flow
  console.log('🎯 Demonstrating Full Stack Flow:\n');

  // Test 1: Server Discovery
  console.log('1️⃣ Testing Server Discovery...');
  try {
    const webaiResponse = await fetch('http://localhost:3025/.identity');
    const webaiData = await webaiResponse.json() as any;
    console.log(`   ✅ WebAI Server: ${webaiData.name} v${webaiData.version}`);

    const mcpResponse = await fetch('http://localhost:3030/.identity');
    const mcpData = await mcpResponse.json() as any;
    console.log(`   ✅ MCP Server: ${mcpData.name} v${mcpData.version}\n`);
  } catch (error) {
    console.error('   ❌ Server discovery failed:', error);
  }

  // Test 2: Screenshot Flow
  console.log('2️⃣ Testing Screenshot Flow...');
  try {
    const screenshotResponse = await fetch('http://localhost:3025/capture-screenshot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullPage: true, format: 'png' })
    });

    const screenshotData = await screenshotResponse.json() as any;
    if (screenshotData.success) {
      console.log(`   ✅ Screenshot captured: ${screenshotData.data.file}`);
      console.log(`   📏 Size: ${screenshotData.data.size.width}x${screenshotData.data.size.height}\n`);
    } else {
      console.log('   ❌ Screenshot failed:', screenshotData.error);
    }
  } catch (error) {
    console.error('   ❌ Screenshot flow failed:', error);
  }

  // Test 3: Console Logs
  console.log('3️⃣ Testing Console Logs...');
  try {
    const logsResponse = await fetch('http://localhost:3025/console-logs');
    const logsData = await logsResponse.json() as any;
    console.log(`   ✅ Retrieved ${logsData.length} console logs`);
    if (logsData.length > 0) {
      console.log(`   📝 Latest: ${logsData[0].level} - ${logsData[0].message}\n`);
    }
  } catch (error) {
    console.error('   ❌ Console logs failed:', error);
  }

  // Test 4: Real-time streaming
  console.log('4️⃣ Starting Real-time Streaming...');
  extension.startConsoleLogStream();
  extension.startNetworkRequestStream();
  console.log('   ✅ Console log streaming started');
  console.log('   ✅ Network request streaming started\n');

  // Test 5: Performance test
  console.log('5️⃣ Testing Performance...');
  const startTime = Date.now();
  
  const promises = Array.from({ length: 5 }, () =>
    fetch('http://localhost:3025/capture-screenshot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullPage: false })
    })
  );

  try {
    const responses = await Promise.all(promises);
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    const successCount = responses.filter(r => r.ok).length;
    console.log(`   ✅ Completed ${successCount}/5 concurrent requests in ${duration}ms\n`);
  } catch (error) {
    console.error('   ❌ Performance test failed:', error);
  }

  // Let it run for a bit to show streaming
  console.log('⏱️ Running for 10 seconds to demonstrate streaming...');
  await new Promise(resolve => setTimeout(resolve, 10000));

  // Cleanup
  console.log('\n🧹 Cleaning up...');
  extension.disconnect();
  wsServer.close();
  httpServer.close();
  await mcpServer.stop();
  
  console.log('✅ Full Stack Demo completed successfully! 🎉');
}

// Run the demo
if (require.main === module) {
  runFullStackDemo().catch(error => {
    console.error('❌ Demo failed:', error);
    process.exit(1);
  });
}

export { runFullStackDemo };
