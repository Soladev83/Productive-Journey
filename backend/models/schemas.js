import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_FILE = path.join(__dirname, '../data/db.json');

// --- 1. MONGODB / MONGOOSE SCHEMAS & MODELS ---

const DayLogSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true }, // format: YYYY-MM-DD
  tasks: [
    {
      id: { type: String, required: true },
      text: { type: String, required: true },
      completed: { type: Boolean, default: false }
    }
  ],
  productivityPercent: { type: Number, default: 0 },
  journal: {
    text: { type: String, default: '' },
    learned: { type: String, default: '' }
  }
}, { timestamps: true });

const PlanSchema = new mongoose.Schema({
  date: { type: String, required: true }, // format: YYYY-MM-DD or YYYY-WW (weekly ID)
  title: { type: String, required: true },
  notes: { type: String, default: '' },
  category: { type: String, default: 'work' }, // work, personal, health, learning, other
  completed: { type: Boolean, default: false }
}, { timestamps: true });

// Prevent mongoose model compilation errors during dev reload
const MongoDayLog = mongoose.models.DayLog || mongoose.model('DayLog', DayLogSchema);
const MongoPlan = mongoose.models.Plan || mongoose.model('Plan', PlanSchema);


// --- 2. LOCAL JSON FALLBACK ENGINE ---

const ensureDbFile = () => {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ daylogs: [], plans: [] }, null, 2));
  }
};

const readDb = () => {
  ensureDbFile();
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return { daylogs: [], plans: [] };
  }
};

const writeDb = (data) => {
  ensureDbFile();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

class MockModel {
  constructor(collectionKey) {
    this.collectionKey = collectionKey; // "daylogs" or "plans"
  }

  async find(query = {}) {
    const db = readDb();
    const items = db[this.collectionKey] || [];
    
    return items.filter(item => {
      for (const key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    });
  }

  async findOne(query = {}) {
    const items = await this.find(query);
    return items[0] || null;
  }

  async create(data) {
    const db = readDb();
    if (!db[this.collectionKey]) db[this.collectionKey] = [];

    const newItem = {
      _id: Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data
    };

    db[this.collectionKey].push(newItem);
    writeDb(db);
    return newItem;
  }

  async findOneAndUpdate(query, update, options = {}) {
    const db = readDb();
    const items = db[this.collectionKey] || [];
    
    const index = items.findIndex(item => {
      for (const key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    });

    const updateFields = update.$set || update; // handle mongoose-style $set or simple objects

    if (index !== -1) {
      const updated = {
        ...items[index],
        ...updateFields,
        updatedAt: new Date().toISOString()
      };
      items[index] = updated;
      db[this.collectionKey] = items;
      writeDb(db);
      return updated;
    } else if (options.upsert) {
      // Upsert: Create a new item since none matched
      const newItem = {
        _id: Math.random().toString(36).substring(2, 9),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...query,
        ...updateFields
      };
      items.push(newItem);
      db[this.collectionKey] = items;
      writeDb(db);
      return newItem;
    }
    return null;
  }

  async findByIdAndUpdate(id, update, options = {}) {
    return this.findOneAndUpdate({ _id: id }, update, options);
  }

  async deleteOne(query) {
    const db = readDb();
    const items = db[this.collectionKey] || [];
    
    const index = items.findIndex(item => {
      for (const key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    });

    if (index !== -1) {
      items.splice(index, 1);
      db[this.collectionKey] = items;
      writeDb(db);
      return { deletedCount: 1 };
    }
    return { deletedCount: 0 };
  }
}

const MockDayLog = new MockModel('daylogs');
const MockPlan = new MockModel('plans');


// --- 3. UNIFIED UNIFIED-MODEL LAYER ---

class UnifiedModel {
  constructor(modelName, mongooseModel, mockModel) {
    this.modelName = modelName;
    this.mongooseModel = mongooseModel;
    this.mockModel = mockModel;
  }

  get activeModel() {
    return global.isMongoConnected ? this.mongooseModel : this.mockModel;
  }

  async find(query = {}) {
    return await this.activeModel.find(query);
  }

  async findOne(query = {}) {
    return await this.activeModel.findOne(query);
  }

  async findOneAndUpdate(query, update, options = { new: true, upsert: true }) {
    // Standard Mongoose query options default to new and upsert for ease
    return await this.activeModel.findOneAndUpdate(query, update, options);
  }

  async findByIdAndUpdate(id, update, options = { new: true }) {
    return await this.activeModel.findByIdAndUpdate(id, update, options);
  }

  async create(data) {
    return await this.activeModel.create(data);
  }

  async deleteOne(query) {
    return await this.activeModel.deleteOne(query);
  }
}

export const DayLog = new UnifiedModel('DayLog', MongoDayLog, MockDayLog);
export const Plan = new UnifiedModel('Plan', MongoPlan, MockPlan);
export { readDb }; // exported for debugging/statistics directly
