const axios = require('axios');

const slackService = {
  async sendPriceAlert(productName, sku, oldPrice, newPrice, reason, confidence, ruleApplied) {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    const changePercent = (((newPrice - oldPrice) / oldPrice) * 100).toFixed(2);
    const direction = newPrice > oldPrice ? '📈 Increased' : '📉 Decreased';

    const attachmentColor = newPrice > oldPrice ? '#2eb886' : '#a30200';

    const payload = {
      text: `🔔 *Dynamic Pricing Alert:* Product price updated dynamically by agent.`,
      attachments: [
        {
          color: attachmentColor,
          fields: [
            { title: 'Product Name', value: productName, short: true },
            { title: 'SKU', value: sku, short: true },
            { title: 'Old Price', value: `$${oldPrice.toFixed(2)}`, short: true },
            { title: 'New Price', value: `$${newPrice.toFixed(2)} (${direction} ${changePercent}%)`, short: true },
            { title: 'Safety Rule Applied', value: ruleApplied, short: true },
            { title: 'Agent Confidence', value: `${(confidence * 100).toFixed(0)}%`, short: true },
            { title: 'AI Reasoning', value: reason, short: false }
          ],
          ts: Math.floor(Date.now() / 1000)
        }
      ]
    };

    if (!webhookUrl) {
      console.log('[Slack Mock] Pricing update alert message generated:\n', JSON.stringify(payload, null, 2));
      return;
    }

    try {
      await axios.post(webhookUrl, payload);
      console.log('[Slack] Alert successfully sent.');
    } catch (error) {
      console.error(`[Slack] Failed to send alert: ${error.message}`);
    }
  }
};

module.exports = slackService;
