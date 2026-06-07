import dbConnect from '../lib/db';
import Property from '../models/Property';

async function testProperties() {
  await dbConnect();
  const properties = await Property.find({ name: /Ayodhya/i }).lean();
  console.log(JSON.stringify(properties, null, 2));
  process.exit(0);
}
testProperties();
