const cron = require('node-cron');
const Product = require('../02-models/Product');
const fastApiClient = require('./fastApiClient');

let scheduledJob = null;

const initScheduler = () => {
  const cronSchedule = process.env.CRON_SCHEDULE || '0 */6 * * *'; // Default: every 6 hours
  
  console.log(`[Scheduler] Initializing cron job with schedule: "${cronSchedule}"`);
  
  scheduledJob = cron.schedule(cronSchedule, async () => {
    console.log('[Scheduler] Executing competitive pricing loop job...');
    try {
      const activeProducts = await Product.find({ status: 'active' });
      console.log(`[Scheduler] Found ${activeProducts.length} active products to evaluate.`);
      
      for (const prod of activeProducts) {
        console.log(`[Scheduler] Triggering pricing analysis for SKU: ${prod.sku}`);
        await fastApiClient.runAgent(prod._id.toString());
      }
      
      console.log('[Scheduler] Completed scheduled competitive pricing run.');
    } catch (err) {
      console.error(`[Scheduler] Error occurred in background job: ${err.message}`);
    }
  });
  
  scheduledJob.start();
};

module.exports = { initScheduler };
