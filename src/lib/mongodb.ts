import { MongoClient } from 'mongodb';

const uri = "mongodb+srv://tinsaebiniyam905_db_user:Z4xwZncVrAT4UntA@cluster0.vp5fjsq.mongodb.net/?appName=Cluster0";
const options = {};

let client = new MongoClient(uri, options);
let clientPromise = client.connect();

export default clientPromise;
