import { useState } from "react";

function Management() {
  const [organization, setOrganization] = useState("");
  const [department, setDepartment] = useState("");
  const [departmentShortName, setDepartmentShortName] = useState("");

  const [courseName, setCourseName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [teacher, setTeacher] = useState("");
  const [subject, setSubject] = useState("");
  const [subjectShortName, setSubjectShortName] = useState(""); // ✅ NEW
  const [semester, setSemester] = useState("1");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const API = "http://127.0.0.1:8000";

  const resetForm = () => {
    setOrganization("");
    setDepartment("");
    setDepartmentShortName("");
    setCourseName("");
    setCourseCode("");
    setTeacher("");
    setSubject("");
    setSubjectShortName(""); // ✅ RESET
    setSemester("1");
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleSubmit = async () => {
    if (!organization.trim()) return setErrorMsg("Organization name is required");
    if (!department.trim()) return setErrorMsg("Department name is required");
    if (!departmentShortName.trim()) return setErrorMsg("Department short name is required");
    if (!courseName.trim()) return setErrorMsg("Course name is required");
    if (!courseCode.trim()) return setErrorMsg("Course code is required");
    if (!teacher.trim()) return setErrorMsg("Teacher name is required");
    if (!subject.trim()) return setErrorMsg("Subject name is required");
    if (!subjectShortName.trim()) return setErrorMsg("Subject short name is required"); // ✅ NEW

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      // Organisation
      const orgRes = await fetch(`${API}/organisation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: organization.trim() }),
      });
      if (!orgRes.ok) throw await getError(orgRes);
      const org = await orgRes.json();
      const orgId = org.organisation_id || org.id;

      // Department
      const deptRes = await fetch(`${API}/department`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: department.trim(),
          short_name: departmentShortName.trim(),
          organisation_id: orgId,
        }),
      });
      if (!deptRes.ok) throw await getError(deptRes);
      const dept = await deptRes.json();
      const deptId = dept.department_id || dept.id;

      // Course
      const courseRes = await fetch(`${API}/course`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: courseName.trim(),
          code: courseCode.trim().toUpperCase(),
          duration_years: 4,
          department_id: deptId,
        }),
      });
      if (!courseRes.ok) throw await getError(courseRes);
      const courseData = await courseRes.json();

      // Sections
      for (const secName of ["A", "B"]) {
        const sectionRes = await fetch(`${API}/section`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: secName,
            semester: Number(semester),
            course_id: courseData.course_id || courseData.id,
          }),
        });
        if (!sectionRes.ok) throw await getError(sectionRes);
      }

      // Teacher
      const teacherRes = await fetch(`${API}/teacher`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: teacher.trim(),
          department_id: deptId,
        }),
      });
      if (!teacherRes.ok) throw await getError(teacherRes);
      const teacherData = await teacherRes.json();

      // ✅ Subject (UPDATED)
      const subjectRes = await fetch(`${API}/subject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: subject.trim(),
          subject_short_name: subjectShortName.trim(), // ✅ NEW
          semester: Number(semester),
          course_id: courseData.course_id || courseData.id,
        }),
      });
      if (!subjectRes.ok) throw await getError(subjectRes);
      const subjectData = await subjectRes.json();

      // Mapping
      const mapRes = await fetch(`${API}/subject-teacher`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject_id: subjectData.subject_id || subjectData.id,
          teacher_id: teacherData.teacher_id || teacherData.id,
        }),
      });
      if (!mapRes.ok) throw await getError(mapRes);

      setSuccessMsg("🎉 Everything created successfully!");
      setTimeout(() => resetForm(), 6000);

    } catch (err) {
      console.error("Chain failed:", err);
      setErrorMsg(err.message || "Failed – check console & Network tab");
    } finally {
      setLoading(false);
    }
  };

  async function getError(res) {
    try {
      const data = await res.json();
      return new Error(data.detail || `Failed (${res.status})`);
    } catch {
      return new Error(`Failed (${res.status})`);
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-8">
      <h1 className="text-3xl font-bold text-center mb-8">
        College Management Setup
      </h1>

      {errorMsg && <div className="text-red-600 mb-4">{errorMsg}</div>}
      {successMsg && <div className="text-green-600 mb-4">{successMsg}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <input placeholder="Organization" value={organization} onChange={(e) => setOrganization(e.target.value)} />

        <input placeholder="Department" value={department} onChange={(e) => setDepartment(e.target.value)} />

        <input
          placeholder="Department Short Name (e.g. CSE)"
          value={departmentShortName}
          onChange={(e) => setDepartmentShortName(e.target.value.toUpperCase())}
        />

        <input placeholder="Course Name" value={courseName} onChange={(e) => setCourseName(e.target.value)} />

        <input placeholder="Course Code" value={courseCode} onChange={(e) => setCourseCode(e.target.value.toUpperCase())} />

        <input placeholder="Teacher" value={teacher} onChange={(e) => setTeacher(e.target.value)} />

        <input placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />

        {/* ✅ NEW FIELD */}
        <input
          placeholder="Subject Short Name (e.g. DBMS)"
          value={subjectShortName}
          onChange={(e) => setSubjectShortName(e.target.value.toUpperCase())}
        />

      </div>

      <button onClick={handleSubmit} disabled={loading}>
        {loading ? "Creating..." : "Create Everything"}
      </button>
    </div>
  );
}

export default Management;