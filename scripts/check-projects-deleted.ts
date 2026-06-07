import dbConnect from '../lib/db';
import Property from '../models/Property';

async function checkProjects() {
  await dbConnect();
  const rootId = "6a244af26a591ac2a1c82414";
  const projects = await Property.find({ type: 'project', parentId: rootId }).select('name isDeleted status').lean();
  console.log("Projects in DB:", projects);
  
  // also check root property's embedded projects
  const rootProp = await Property.findById(rootId).lean() as any;
  console.log("Root embedded projects:", rootProp?.details?.projects?.map((p:any) => p.name));
  
  process.exit(0);
}
checkProjects();
