import mongoose from "mongoose";

export class AcademicResolver {
  static resolveCourse(course: any) {
    if (!course) return null;
    if (typeof course === 'string' || course instanceof mongoose.Types.ObjectId) {
      return { id: course.toString(), name: "Unknown Course", code: "", status: "active" };
    }
    const doc = typeof course.toObject === 'function' ? course.toObject() : { ...course };
    return {
      ...doc,
      id: doc._id?.toString() || doc.id,
      name: doc.courseName || doc.name || doc.title || "Unknown Course",
      code: doc.courseCode || doc.code || "",
      status: doc.status || "active"
    };
  }

  static resolveCohort(cohort: any) {
    if (!cohort) return null;
    if (typeof cohort === 'string' || cohort instanceof mongoose.Types.ObjectId) {
      return { id: cohort.toString(), name: "Unknown Cohort", code: "" };
    }
    const doc = typeof cohort.toObject === 'function' ? cohort.toObject() : { ...cohort };
    return {
      ...doc,
      id: doc._id?.toString() || doc.id,
      name: doc.cohortName || doc.name || "Unknown Cohort",
      code: doc.cohortCode || doc.code || "",
      course: this.resolveCourse(doc.course),
      primaryInstructor: this.resolveTeacher(doc.primaryInstructor)
    };
  }

  static resolveTeacher(teacher: any) {
    if (!teacher) return null;
    if (typeof teacher === 'string' || teacher instanceof mongoose.Types.ObjectId) {
      return { id: teacher.toString(), name: "Unknown Teacher", email: "", code: "" };
    }
    const doc = typeof teacher.toObject === 'function' ? teacher.toObject() : { ...teacher };
    const name = doc.firstName && doc.lastName 
      ? `${doc.firstName} ${doc.lastName}` 
      : (doc.name || "Unknown Teacher");
    const email = doc.user?.email || doc.email || "";
    
    return {
      ...doc,
      id: doc._id?.toString() || doc.id,
      name,
      email,
      code: doc.teacherCode || doc.code || doc.employeeId || ""
    };
  }

  static resolveStudent(student: any) {
    if (!student) return null;
    if (typeof student === 'string' || student instanceof mongoose.Types.ObjectId) {
      return { id: student.toString(), name: "Unknown Student", email: "", code: "" };
    }
    const doc = typeof student.toObject === 'function' ? student.toObject() : { ...student };
    const name = doc.firstName && doc.lastName 
      ? `${doc.firstName} ${doc.lastName}` 
      : (doc.name || "Unknown Student");
    const email = doc.user?.email || doc.email || "";
    
    return {
      ...doc,
      id: doc._id?.toString() || doc.id,
      name,
      email,
      code: doc.studentCode || doc.code || ""
    };
  }

  static resolveBatch(batch: any) {
    if (!batch) return null;
    if (typeof batch === 'string' || batch instanceof mongoose.Types.ObjectId) {
       return { id: batch.toString(), name: "Unknown Batch", code: "", status: "active", course: null, cohort: null, teachers: [] };
    }
    
    const doc = typeof batch.toObject === 'function' ? batch.toObject() : { ...batch };
    
    const teachers = [];
    if (doc.primaryTeacher) {
      const resolved = this.resolveTeacher(doc.primaryTeacher);
      if (resolved) teachers.push(resolved);
    }
    if (doc.assistantTeacher) {
      const resolved = this.resolveTeacher(doc.assistantTeacher);
      if (resolved) teachers.push(resolved);
    }
    if (doc.mentor) {
      const resolved = this.resolveTeacher(doc.mentor);
      if (resolved) teachers.push(resolved);
    }
    
    return {
      ...doc,
      id: doc._id?.toString() || doc.id,
      name: doc.batchName || doc.name || "Unknown Batch",
      code: doc.batchCode || doc.code || "",
      status: doc.status || "active",
      course: this.resolveCourse(doc.course),
      cohort: this.resolveCohort(doc.cohort),
      primaryTeacher: this.resolveTeacher(doc.primaryTeacher),
      teachers
    };
  }
  static resolveAssignment(assignment: any) {
    if (!assignment) return null;
    if (typeof assignment === 'string' || assignment instanceof mongoose.Types.ObjectId) {
      return { id: assignment.toString(), title: "Unknown Assignment" };
    }
    const doc = typeof assignment.toObject === 'function' ? assignment.toObject() : { ...assignment };
    return {
      ...doc,
      id: doc._id?.toString() || doc.id,
      title: doc.title || "Unknown Assignment",
      course: this.resolveCourse(doc.course),
      batch: this.resolveBatch(doc.batch),
      cohort: this.resolveCohort(doc.cohort)
    };
  }

  static resolveAssessment(assessment: any) {
    if (!assessment) return null;
    if (typeof assessment === 'string' || assessment instanceof mongoose.Types.ObjectId) {
      return { id: assessment.toString(), title: "Unknown Assessment" };
    }
    const doc = typeof assessment.toObject === 'function' ? assessment.toObject() : { ...assessment };
    return {
      ...doc,
      id: doc._id?.toString() || doc.id,
      title: doc.title || "Unknown Assessment",
      course: this.resolveCourse(doc.course),
      batch: this.resolveBatch(doc.batch),
      cohort: this.resolveCohort(doc.cohort)
    };
  }

  static resolveSubmission(submission: any) {
    if (!submission) return null;
    if (typeof submission === 'string' || submission instanceof mongoose.Types.ObjectId) {
      return { id: submission.toString() };
    }
    const doc = typeof submission.toObject === 'function' ? submission.toObject() : { ...submission };
    return {
      ...doc,
      id: doc._id?.toString() || doc.id,
      student: this.resolveStudent(doc.student),
      assignment: this.resolveAssignment(doc.assignment),
      fileUrls: doc.fileUrls || doc.files || [],
      repoUrl: doc.repoUrl || (doc.links && doc.links.length > 0 ? doc.links[0] : ""),
      studentNotes: doc.studentNotes || doc.comments || ""
    };
  }

  static resolveLiveClass(liveClass: any) {
    if (!liveClass) return null;
    if (typeof liveClass === 'string' || liveClass instanceof mongoose.Types.ObjectId) {
      return { id: liveClass.toString(), title: "Unknown Live Class" };
    }
    const doc = typeof liveClass.toObject === 'function' ? liveClass.toObject() : { ...liveClass };
    
    let safeStartDate = null;
    let safeEndDate = null;
    try {
      if (doc.startDate) safeStartDate = new Date(doc.startDate).toISOString();
      else if (doc.scheduledAt) safeStartDate = new Date(doc.scheduledAt).toISOString();
      else if (doc.batchStart) safeStartDate = new Date(doc.batchStart).toISOString();

      if (doc.endDate) safeEndDate = new Date(doc.endDate).toISOString();
      else if (safeStartDate && doc.duration) {
        const end = new Date(safeStartDate);
        end.setMinutes(end.getMinutes() + doc.duration);
        safeEndDate = end.toISOString();
      }
    } catch(e) {}
    
    return {
      ...doc,
      id: doc._id?.toString() || doc.id,
      title: doc.classTitle || doc.topic || doc.title || "Unknown Live Class",
      code: doc.classCode || "",
      startDateTime: safeStartDate,
      endDateTime: safeEndDate,
      startDate: safeStartDate, // Keep for backward compatibility if needed
      course: this.resolveCourse(doc.course),
      batch: this.resolveBatch(doc.batch),
      cohort: this.resolveCohort(doc.cohort),
      teacher: this.resolveTeacher(doc.teacher || doc.instructor)
    };
  }
}
