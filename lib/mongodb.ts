import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env.local');
}

const uri = process.env.MONGODB_URI;
const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

// In serverless environments like Vercel, we need to cache the connection
// across function invocations to avoid exhausting connection limits
const globalWithMongo = global as typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
};

if (!globalWithMongo._mongoClientPromise) {
  client = new MongoClient(uri, options);
  globalWithMongo._mongoClientPromise = client.connect();
}
// eslint-disable-next-line prefer-const
clientPromise = globalWithMongo._mongoClientPromise;

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;