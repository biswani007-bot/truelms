const { MongoClient } = require("mongodb");

async function cleanup() {
  const client = await MongoClient.connect("mongodb://localhost:27017");
  const db = client.db("lmsca");
  
  // Find bad courses
  const badCourses = await db.collection("courses").find({
    $or: [
      { category: { $exists: false } },
      { duration: { $exists: false } },
      { level: { $exists: false } }
    ]
  }).toArray();
  
  console.log("Found", badCourses.length, "bad courses.");
  
  const badCourseIds = badCourses.map(c => c._id);
  if (badCourseIds.length > 0) {
    const delRes = await db.collection("courses").deleteMany({ _id: { $in: badCourseIds } });
    console.log("Deleted bad courses:", delRes.deletedCount);
    
    // Also delete any associated modules, lessons, batches
    await db.collection("coursemodules").deleteMany({ course: { $in: badCourseIds } });
    await db.collection("courselessons").deleteMany({ "module.course": { $in: badCourseIds } }); // Just in case
    await db.collection("batches").deleteMany({ course: { $in: badCourseIds } });
  }

  process.exit(0);
}
cleanup().catch(console.error);
