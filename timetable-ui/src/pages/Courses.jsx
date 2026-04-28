import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { getCourses, createCourse, updateCourse, deleteCourse, getDepartments } from '../api/api';
import toast from 'react-hot-toast';

export default function Courses() {
    const [courses, setCourses] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({ 
        name: '', 
        code: '', 
        duration_years: 4, 
        department_id: '',
        term_type: 'SEMESTER'
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [coursesRes, deptsRes] = await Promise.all([
                getCourses(),
                getDepartments()
            ]);
            setCourses(coursesRes.data);
            setDepartments(deptsRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const data = { 
                name: form.name,
                code: form.code || undefined,
                department_id: parseInt(form.department_id), 
                duration_years: parseInt(form.duration_years),
                term_type: form.term_type   // ✅ FIXED
            };

            if (editingId) {
                await updateCourse(editingId, data);
                toast.success('Course updated');
            } else {
                await createCourse(data);
                toast.success('Course created');
            }

            setShowModal(false);
            resetForm();
            loadData();
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setForm({ 
            name: '', 
            code: '', 
            duration_years: 4, 
            department_id: '',
            term_type: 'SEMESTER'   // ✅ FIXED
        });
        setEditingId(null);
    };

    const handleEdit = (course) => {
        setForm({
            name: course.name,
            code: course.code,
            duration_years: course.duration_years,
            term_type: course.term_type || 'SEMESTER',
            department_id: course.department_id
        });
        setEditingId(course.id);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this course?')) return;
        try {
            await deleteCourse(id);
            toast.success('Course deleted');
            loadData();
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                    <Plus className="w-5 h-5" /> Add Course
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses.map((course) => (
                    <div key={course.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h3 className="font-semibold text-gray-900">{course.name}</h3>
                                <p className="text-sm text-gray-500">Code: {course.code}</p>
                            </div>
                        </div>

                        <div className="space-y-1 text-sm text-gray-600 mb-4">
                            <p>Duration: {course.duration_years} years</p>
                            <p>
                                {course.term_type === 'SEMESTER'
                                    ? `Semesters: ${course.duration_years * 2}`
                                    : `Years: ${course.duration_years}`}
                            </p>
                        </div>

                        <div className="flex justify-end gap-2">
                            <button onClick={() => handleEdit(course)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                                <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(course.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold">{editingId ? 'Edit' : 'Add'} Course</h2>
                            <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input type="text" placeholder="Name"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg" required />

                            <input type="text" placeholder="Code"
                                value={form.code}
                                onChange={(e) => setForm({ ...form, code: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg" />

                            <select
                                value={form.department_id}
                                onChange={(e) => setForm({ ...form, department_id: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg"
                                required
                            >
                                <option value="">Select Department</option>
                                {departments.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>

                            {/* ✅ NEW TERM TYPE DROPDOWN */}
                            <select
                                value={form.term_type}
                                onChange={(e) => setForm({ ...form, term_type: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg"
                            >
                                <option value="SEMESTER">Semester</option>
                                <option value="YEAR">Year</option>
                            </select>

                            <select
                                value={form.duration_years}
                                onChange={(e) => setForm({ ...form, duration_years: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg"
                                required
                            >
                                {[1,2,3,4,5,6].map(y => (
                                    <option key={y} value={y}>
                                        {y} Years (
                                        {form.term_type === 'SEMESTER'
                                            ? `${y * 2} Semesters`
                                            : `${y} Years`}
                                        )
                                    </option>
                                ))}
                            </select>

                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg">
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                                    {saving ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}