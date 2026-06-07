import dbConnect from '../lib/db';
import Property from '../models/Property';

async function testProjects() {
  await dbConnect();
  
  const projects = await Property.find({ type: 'project' }).select('_id name builderId accountId role').lean();
  console.log("Found projects:");
  projects.forEach((p: any) => console.log(JSON.stringify(p)));
  
  process.exit(0);
}
testProjects();
