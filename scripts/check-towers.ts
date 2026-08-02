import dbConnect from '../lib/db';
import Property from '../models/Property';

async function testTowers() {
  await dbConnect();
  
  const towers = await Property.find({ type: 'tower' }).select('_id name builderId accountId role').lean();
  console.log("Found towers:");
  towers.forEach((t: any) => console.log(JSON.stringify(t)));
  
  process.exit(0);
}
testTowers();
