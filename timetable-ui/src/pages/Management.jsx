import { useState } from "react";

function Management() {
  const [organization, setOrganization] = useState("");
  const [department, setDepartment] = useState("");
  const [teacher, setTeacher] = useState("");
  const [subject, setSubject] = useState("");

  const handleSubmit = async () => {
    try {
      //  Create Organisation
      const orgRes = await fetch("http://127.0.0.1:8000/organisation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: organization }),
      });

      if (!orgRes.ok) throw new Error("Failed to create organisation");
      const orgData = await orgRes.json();

      //  Create Department
      const deptRes = await fetch("http://127.0.0.1:8000/department", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: department,
          organisation_id: orgData.organisation_id,
        }),
      });

      if (!deptRes.ok) throw new Error("Failed to create department");
      const deptData = await deptRes.json();

      //  Create Teacher
      const teacherRes = await fetch("http://127.0.0.1:8000/teacher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: teacher,
          department_id: deptData.department_id,
        }),
      });

      if (!teacherRes.ok) throw new Error("Failed to create teacher");
      const teacherData = await teacherRes.json();

      //  Create Subject
      const subjectRes = await fetch("http://127.0.0.1:8000/subject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: subject,
          semester: 1,      // Make sure course_id 1 exists in DB
          course_id: 1,
        }),
      });

      if (!subjectRes.ok) throw new Error("Failed to create subject");
      const subjectData = await subjectRes.json();

      //  Create Subject-Teacher Mapping
      const mappingRes = await fetch("http://127.0.0.1:8000/subject-teacher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject_id: subjectData.subject_id,
          teacher_id: teacherData.teacher_id,
        }),
      });

      if (!mappingRes.ok)
        throw new Error("Failed to create subject-teacher mapping");

      alert("Management Entry Added Successfully ");

      // Clear fields
      setOrganization("");
      setDepartment("");
      setTeacher("");
      setSubject("");

    } catch (error) {
      console.error(error);
      alert("Something went wrong  Check console.");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Management</h1>

      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Add New Entry</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          <div>
            <label className="block text-sm font-medium mb-1">
              Organization
            </label>
            <input
              type="text"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="Enter organization name"
              className="w-full border rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Department
            </label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="Enter department"
              className="w-full border rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Teacher
            </label>
            <input
              type="text"
              value={teacher}
              onChange={(e) => setTeacher(e.target.value)}
              placeholder="Enter teacher name"
              className="w-full border rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter subject name"
              className="w-full border rounded-md px-3 py-2"
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
        >
          Add Entry
        </button>
      </div>
    </div>
  );
}

export default Management;
