const axios = require('axios');

const FASTAPI_URL = process.env.FASTAPI_SERVICE_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: FASTAPI_URL,
  timeout: 60000 // 60 seconds because Playwright scraper & LangGraph can take time
});

const fastApiClient = {
  async runAgent(productId = null) {
    try {
      const response = await client.post('/run-agent', { product_id: productId });
      return response.data;
    } catch (error) {
      console.error(`[FastAPI Service] Error running agent: ${error.message}`);
      throw error;
    }
  },

  async analyzeProduct(productId) {
    try {
      const response = await client.post('/analyze-product', { product_id: productId });
      return response.data;
    } catch (error) {
      console.error(`[FastAPI Service] Error analyzing product: ${error.message}`);
      throw error;
    }
  },

  async recommendPrice(productId, data) {
    try {
      const response = await client.post('/recommend-price', { product_id: productId, ...data });
      return response.data;
    } catch (error) {
      console.error(`[FastAPI Service] Error recommending price: ${error.message}`);
      throw error;
    }
  },

  async triggerScrape(productId) {
    try {
      const response = await client.post('/scrape', { product_id: productId });
      return response.data;
    } catch (error) {
      console.error(`[FastAPI Service] Error triggering scrape: ${error.message}`);
      throw error;
    }
  },

  async getAgentStatus() {
    try {
      const response = await client.get('/agent-status');
      return response.data;
    } catch (error) {
      console.error(`[FastAPI Service] Error getting status: ${error.message}`);
      return { status: 'offline', error: error.message };
    }
  },

  async getLogs(limit = 50) {
    try {
      const response = await client.get(`/logs?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error(`[FastAPI Service] Error retrieving logs: ${error.message}`);
      return [];
    }
  },

  async getMemory(productId = null) {
    try {
      const url = productId ? `/memory?product_id=${productId}` : '/memory';
      const response = await client.get(url);
      return response.data;
    } catch (error) {
      console.error(`[FastAPI Service] Error retrieving vector memory: ${error.message}`);
      return [];
    }
  },

  async discoverCompetitors(productId) {
    try {
      const response = await client.post('/discover-competitors', { product_id: productId });
      return response.data;
    } catch (error) {
      console.error(`[FastAPI Service] Error discovering competitor links: ${error.message}`);
      throw error;
    }
  }
};

module.exports = fastApiClient;
