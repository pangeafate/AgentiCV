import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env.local') });

const app = express();
const PORT = 3002;

// Enable CORS for frontend
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

app.use(express.json());

// Proxy endpoint for n8n - CV Parser
app.post('/api/n8n/cv-parser', async (req, res) => {
  console.log('📨 CV Parser request received');
  console.log('Payload:', JSON.stringify(req.body, null, 2));
  
  res.setTimeout(60000);
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55000);
    
    const cvParserUrl = process.env.VITE_N8N_CV_PARSER_URL || process.env.VITE_N8N_WEBHOOK_URL || 'https://n8n.lakestrom.com/webhook-test/cv-parser';
    console.log('🔗 Forwarding to CV Parser:', cvParserUrl);
    
    const response = await fetch(cvParserUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    
    const result = await response.json();
    console.log('✅ CV Parser response received');
    res.json(result);
  } catch (error) {
    console.error('❌ CV Parser error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Proxy endpoint for n8n - JD Parser
app.post('/api/n8n/jd-parser', async (req, res) => {
  console.log('📨 JD Parser request received');
  console.log('Payload:', JSON.stringify(req.body, null, 2));
  
  res.setTimeout(60000);
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55000);
    
    const jdParserUrl = process.env.VITE_N8N_JD_PARSER_URL || 'https://n8n.lakestrom.com/webhook-test/jd-parser';
    console.log('🔗 Forwarding to JD Parser:', jdParserUrl);
    
    const response = await fetch(jdParserUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    
    const result = await response.json();
    console.log('✅ JD Parser response received');
    res.json(result);
  } catch (error) {
    console.error('❌ JD Parser error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Proxy endpoint for n8n - Gap Analyzer
app.post('/api/n8n/gap-analyzer', async (req, res) => {
  console.log('📨 Gap Analyzer request received');
  console.log('Payload:', JSON.stringify(req.body, null, 2));
  
  res.setTimeout(60000);
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55000);
    
    const gapAnalyzerUrl = process.env.VITE_N8N_GAP_ANALYZER_URL || 'https://n8n.lakestrom.com/webhook-test/gap-analyzer';
    console.log('🔗 Forwarding to Gap Analyzer:', gapAnalyzerUrl);
    
    const response = await fetch(gapAnalyzerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    
    const result = await response.json();
    console.log('✅ Gap Analyzer response received');
    res.json(result);
  } catch (error) {
    console.error('❌ Gap Analyzer error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Complete analysis endpoint - sends both CV and JD together
app.post('/api/n8n/analyze-complete', async (req, res) => {
  console.log('📨 Complete Analysis request received');
  console.log('Payload:', JSON.stringify(req.body, null, 2));
  
  res.setTimeout(60000);
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55000);
    
    // Use the main webhook URL for complete analysis
    const completeAnalysisUrl = process.env.VITE_N8N_COMPLETE_ANALYSIS_URL || 'https://n8n.lakestrom.com/webhook/get_cvjd';
    console.log('🔗 Forwarding to Complete Analysis:', completeAnalysisUrl);
    
    const response = await fetch(completeAnalysisUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    
    const result = await response.json();
    console.log('✅ Complete Analysis response received');
    res.json(result);
  } catch (error) {
    console.error('❌ Complete Analysis error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Legacy endpoint for backward compatibility
app.post('/api/n8n', async (req, res) => {
  console.log('📨 Legacy n8n request - redirecting to CV parser');
  req.url = '/api/n8n/cv-parser';
  app.handle(req, res);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Proxy server running' });
});

app.listen(PORT, () => {
  console.log('🚀 Proxy Server Running');
  console.log('=' .repeat(60));
  console.log(`📡 Proxy URL: http://localhost:${PORT}`);
  console.log(`🔗 n8n endpoint: ${process.env.VITE_N8N_WEBHOOK_URL || 'https://n8n.lakestrom.com/webhook-test/533919be-b5e1-4ab6-9899-9cce246fcab1'}`);
  console.log('\n📋 How to use:');
  console.log('1. Keep this server running');
  console.log('2. Frontend calls: http://localhost:3002/api/n8n');
  console.log('3. Proxy forwards to n8n webhook (bypassing CORS)');
  console.log('\n✅ CORS issues resolved!');
});