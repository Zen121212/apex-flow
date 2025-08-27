import { DataSource } from 'typeorm';

export const mongoDataSource = new DataSource({
  type: 'mongodb',
  url: process.env.MONGO_URI || 'mongodb://localhost:27017/apexflow',
  entities: [],
  synchronize: process.env.NODE_ENV === 'development',
});

export default mongoDataSource;
