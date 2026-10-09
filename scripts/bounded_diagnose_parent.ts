import "dotenv/config";
import dns from "node:dns";
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {
  // ignore
}
import mongoose from "mongoose";

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("ERROR: MONGODB_URI is not defined in environment.");
    process.exit(1);
  }

  // Parse URI safely without printing credentials
  try {
    const parsed = new URL(uri.replace(/^mongodb\+srv:\/\//, "http://"));
    console.log(`[Connectivity] Host: ${parsed.host}, Database: ${parsed.pathname.replace(/^\//, "")}`);
  } catch {
    console.log("[Connectivity] URI format parsed.");
  }

  const startTime = Date.now();
  try {
    console.log("[Connectivity] Connecting with 5000ms timeout...");
    await mongoose.connect(uri, {
      family: 4,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    console.log(`[Connectivity] Connected successfully in ${Date.now() - startTime}ms`);

    const db = mongoose.connection.useDb("lmsca");

    // 1. Check Parent record for parent@truelern.com
    console.log("\n--- PARENT RECORDS ---");
    const parents = await db
      .collection("parents")
      .find(
        { email: "parent@truelern.com" },
        { projection: { _id: 1, parentId: 1, firstName: 1, lastName: 1, email: 1, user: 1, status: 1 } }
      )
      .maxTimeMS(5000)
      .toArray();
    console.log("Parents found:", parents.length);
    for (const p of parents) {
      console.log(JSON.stringify(p, null, 2));
    }

    // 2. Check User record for parent@truelern.com and for parent's user reference
    console.log("\n--- USER RECORDS ---");
    const parentUserIds = parents.map((p) => p.user).filter(Boolean);
    const users = await db
      .collection("users")
      .find(
        { $or: [{ email: "parent@truelern.com" }, { _id: { $in: parentUserIds } }] },
        { projection: { _id: 1, firstName: 1, lastName: 1, name: 1, email: 1, role: 1, isActive: 1 } }
      )
      .maxTimeMS(5000)
      .toArray();
    console.log("Users found:", users.length);
    for (const u of users) {
      console.log(JSON.stringify(u, null, 2));
    }

    // 3. Check CRM Leads matching parent@truelern.com or parent._id
    console.log("\n--- CRM LEAD RECORDS ---");
    const parentDbIds = parents.map((p) => p._id);
    const leads = await db
      .collection("leads")
      .find(
        { $or: [{ email: "parent@truelern.com" }, { parent: { $in: parentDbIds } }] },
        {
          projection: {
            _id: 1,
            leadId: 1,
            fullName: 1,
            email: 1,
            phone: 1,
            parent: 1,
            student: 1,
            status: 1,
            leadSource: 1,
            interestedCourse: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        }
      )
      .maxTimeMS(5000)
      .toArray();
    console.log("Leads found:", leads.length);
    for (const l of leads) {
      console.log(JSON.stringify(l, null, 2));
    }

    // 4. Check Students linked to this parent
    console.log("\n--- LINKED STUDENTS ---");
    const links = await db
      .collection("parentstudentlinks")
      .find(
        { parent: { $in: parentDbIds } },
        { projection: { _id: 1, parent: 1, student: 1, relationshipType: 1, canAccessPortal: 1 } }
      )
      .maxTimeMS(5000)
      .toArray();
    const studentIds = links.map((l) => l.student);
    const students = await db
      .collection("students")
      .find(
        { _id: { $in: studentIds } },
        { projection: { _id: 1, studentId: 1, firstName: 1, lastName: 1, email: 1, parent: 1 } }
      )
      .maxTimeMS(5000)
      .toArray();
    console.log("Students found:", students.length);
    for (const s of students) {
      console.log(JSON.stringify(s, null, 2));
    }

    // 5. Check if any record in DB has "Bro Mercer"
    console.log("\n--- SEARCH FOR 'Bro Mercer' ACROSS COLLECTIONS ---");
    const broParents = await db
      .collection("parents")
      .find(
        { $or: [{ firstName: /Bro/i }, { lastName: /Mercer/i }] },
        { projection: { _id: 1, parentId: 1, firstName: 1, lastName: 1, email: 1, user: 1 } }
      )
      .maxTimeMS(5000)
      .toArray();
    console.log("Parents with 'Bro'/'Mercer':", broParents);

    const broUsers = await db
      .collection("users")
      .find(
        { $or: [{ firstName: /Bro/i }, { lastName: /Mercer/i }, { name: /Bro/i }] },
        { projection: { _id: 1, firstName: 1, lastName: 1, name: 1, email: 1, role: 1 } }
      )
      .maxTimeMS(5000)
      .toArray();
    console.log("Users with 'Bro'/'Mercer':", broUsers);

    const broStudents = await db
      .collection("students")
      .find(
        { $or: [{ firstName: /Bro/i }, { lastName: /Mercer/i }] },
        { projection: { _id: 1, studentId: 1, firstName: 1, lastName: 1 } }
      )
      .maxTimeMS(5000)
      .toArray();
    console.log("Students with 'Bro'/'Mercer':", broStudents);

    console.log("\n[Diagnostic] Completed in " + (Date.now() - startTime) + "ms");
  } catch (err: any) {
    console.error("[Connectivity Error]", err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("[Diagnostic] Disconnected cleanly.");
  }
}

run();
