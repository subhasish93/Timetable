import { useState } from "react";

function Management() {
  const [organization, setOrganization] = useState("");
  const [department, setDepartment] = useState("");
  const [departmentSections, setDepartmentSections] = useState("");
  const [courseName, setCourseName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [teacher, setTeacher] = useState("");
  const [teacherSection, setTeacherSection] = useState("");
  const [subject, setSubject] = useState("");
  const [semester, setSemester] = useState("1");
  const [subjectSection, setSubjectSection] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const API = "http://127.0.0.1:8000";

  const resetForm = () => {
    setOrganization("");
    setDepartment("");
    setDepartmentSections("");
    setCourseName("");
    setCourseCode("");
    setTeacher("");
    setTeacherSection("");
    setSubject("");
    setSubjectSection("");
    setSemester("1");
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleSubmit = async () => {
    if (!organization.trim()) return setErrorMsg("Organization name is required");
    if (!department.trim()) return setErrorMsg("Department name is required");
    if (!departmentSections.trim()) return setErrorMsg("Department sections are required (e.g., A,B,C)");
    if (!courseName.trim()) return setErrorMsg("Course name is required");
    if (!courseCode.trim()) return setErrorMsg("Course code is required");
    if (!teacher.trim()) return setErrorMsg("Teacher name is required");
    if (!teacherSection.trim()) return setErrorMsg("Teacher section is required");
    if (!subject.trim()) return setErrorMsg("Subject name is required");
    if (!subjectSection.trim()) return setErrorMsg("Subject section is required");

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const token = localStorage.getItem("token");
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    try {
      const orgRes = await fetch(`${API}/organisation`, {
        method: "POST",
        headers,
        body: JSON.stringify({ name: organization.trim() }),
      });
      if (!orgRes.ok) throw await getError(orgRes);
      const org = await orgRes.json();

      const deptRes = await fetch(`${API}/department`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: department.trim(),
          sections: departmentSections.trim(),
        }),
      });
      if (!deptRes.ok) throw await getError(deptRes);
      const dept = await deptRes.json();

      const courseRes = await fetch(`${API}/course`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: courseName.trim(),
          code: courseCode.trim().toUpperCase(),
          duration_years: 4,
          department_id: dept.department_id,
        }),
      });
      if (!courseRes.ok) throw await getError(courseRes);
      const course = await courseRes.json();

      const teacherRes = await fetch(`${API}/teacher`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: teacher.trim(),
          department_id: dept.department_id,
          section: teacherSection.trim(),
        }),
      });
      if (!teacherRes.ok) throw await getError(teacherRes);
      const teacherData = await teacherRes.json();

      const subjectRes = await fetch(`${API}/subject`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: subject.trim(),
          semester: Number(semester),
          course_id: course.course_id,
          section: subjectSection.trim(),
        }),
      });
      if (!subjectRes.ok) throw await getError(subjectRes);
      const subjectData = await subjectRes.json();

      const mapRes = await fetch(`${API}/subject-teacher`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          subject_id: subjectData.subject_id,
          teacher_id: teacherData.teacher_id,
        }),
      });
      if (!mapRes.ok) throw await getError(mapRes);

      setSuccessMsg("Setup completed successfully! You can now use the admin panel to manage your timetable.");
      setTimeout(() => resetForm(), 8000);

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
      <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-8 text-center">
        Initial Setup Wizard
      </h1>
      <p className="text-center text-gray-500 mb-8">Create your organization, department, course, teacher, and subject in one go.</p>

      {errorMsg && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 text-red-700 rounded-r">
          <strong>Error:</strong> {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 text-green-700 rounded-r">
          <strong>Success!</strong> {successMsg}
        </div>
      )}

      <div className="bg-white shadow-xl rounded-2xl p-6 md:p-8 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Organization <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="e.g. XYZ University"
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Department <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. Computer Science"
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Department Sections <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={departmentSections}
              onChange={(e) => setDepartmentSections(e.target.value)}
              placeholder="e.g. A,B,C"
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">Comma-separated section names</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Course Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder="e.g. B.Tech Computer Science"
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Course Code <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
              placeholder="e.g. CSE-BTECH"
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none uppercase transition"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Semester
            </label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white transition"
              disabled={loading}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={s}>Semester {s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Teacher Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={teacher}
              onChange={(e) => setTeacher(e.target.value)}
              placeholder="e.g. Dr. Rajesh Kumar"
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Teacher Section <span className="text-red-600">*</span>
            </label>
            <select
              value={teacherSection}
              onChange={(e) => setTeacherSection(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white transition"
              disabled={loading}
            >
              <option value="">Select Section</option>
              {departmentSections.split(",").map(s => s.trim()).filter(s => s).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Subject Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Data Structures"
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Subject Section <span className="text-red-600">*</span>
            </label>
            <select
              value={subjectSection}
              onChange={(e) => setSubjectSection(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white transition"
              disabled={loading}
            >
              <option value="">Select Section</option>
              {departmentSections.split(",").map(s => s.trim()).filter(s => s).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-end">
          <button
            onClick={resetForm}
            disabled={loading}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition"
          >
            Reset
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`px-6 py-3 rounded-lg font-medium text-white transition ${loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"}`}
          >
            {loading ? "Creating..." : "Complete Setup"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Management;
