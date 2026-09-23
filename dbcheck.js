const mongoose = require('mongoose');
const uriAdmin = 'mongodb+srv://admin-astronix-realty:adminAstronixKrealty2026@admindata.yslnl.mongodb.net/admindataset?retryWrites=true&w=majority&appName=admindata';
const uriVisitor = 'mongodb+srv://visitor-astronix-realty:visitorAstronixKrealty2026@customerdata.gs4hwqo.mongodb.net/alldataset?retryWrites=true&w=majority&appName=customerdata';
const uriBuilder = 'mongodb+srv://builder-astronix:builderAstronixKrealty2026@builderdata.9fkh8r8.mongodb.net/builderdataset?retryWrites=true&w=majority&appName=builderdata';

async function run() {
  await mongoose.connect(uriBuilder);
  const dbBuilder = mongoose.connection.db;
  const gbBuilder = await dbBuilder.collection('properties').find({ 'groupBuying': { $exists: true } }).toArray();
  console.log('Builder DB Gb:', JSON.stringify(gbBuilder.map(p => ({id: p._id, gb: p.groupBuying}))));
  
  await mongoose.disconnect();
  
  await mongoose.connect(uriVisitor);
  const dbVisitor = mongoose.connection.db;
  const gbVisitor = await dbVisitor.collection('properties').find({ 'groupBuying': { $exists: true } }).toArray();
  console.log('Visitor DB Gb:', JSON.stringify(gbVisitor.map(p => ({id: p._id, gb: p.groupBuying}))));
  
  process.exit(0);
}
run();
