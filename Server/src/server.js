const dotenv = require('dotenv');
dotenv.config();

const app = require('./app.js');

const connectDB = require('./config/db.js');
const Category = require('./models/category.js');

const PORT = process.env.PORT || 5000;
const DEFAULT_CATEGORIES = ['City', 'Sports', 'Tech', 'Business', 'Health', 'Culture'];

const seedCategories = async () => {
  if (await Category.exists({})) return;

  await Category.insertMany(DEFAULT_CATEGORIES.map((name) => ({
    name,
    slug: name.toLowerCase(),
  })));
  console.log('Default categories created');
};

const startServer = async () => {
  try {
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not defined in the environment variables");
      process.exit(1);
    }
    await connectDB();
    await seedCategories();
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to connect to database:", err);
    process.exit(1);
  }
};

startServer();