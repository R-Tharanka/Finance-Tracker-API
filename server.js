// starting the server and services

const app = require('./app');
const mongoose = require('mongoose');

// Load environment variables
require('dotenv').config();

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.error('❌ MongoDB Connection Error:', err));

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// node-cron Scheduler (Runs Daily at Midnight)
const cron = require('node-cron');
const { checkRecurringTransactions } = require('./controllers/notificationController');

cron.schedule('0 0 * * *', () => { // '* * * * *' for every minutes 
  console.log("🔄 Checking for due or missed recurring transactions...");
  checkRecurringTransactions();
});