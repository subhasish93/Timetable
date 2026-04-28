import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, ChevronRight } from 'lucide-react';
import { getFaculties, createFaculty, updateFaculty, deleteFaculty, getDepartments } from '../api/api';
import toast from 'react-hot-toast';

export default function Faculty() {
    const [faculties, setFaculties] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({
        name: '', employee_code: '', email: '', phone: '', specialization: '', max_weekly_hours: 20, department_id: ''
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [facultiesRes, deptsRes] = await Promise.all([
                getFaculties(),
                getDepartments()
            ]);
            setFaculties(facultiesRes.data);
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
                ...form,
                department_id: parseInt(form.department_id),
                max_weekly_hours: parseInt(form.max_weekly_hours)
            };
            if (editingId) {
                await updateFaculty(editingId, data);
                toast.success('Faculty updated');
            } else {
                await createFaculty(data);
                toast.success('Faculty created');
            }
            setShowModal(false);
            resetForm();
            loadData();
        } catch (err) {
            // Error handled by interceptor
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setForm({ name: '', employee_code: '', email: '', phone: '', specialization: '', max_weekly_hours: 20, department_id: '' });
        setEditingId(null);
    };

    const handleEdit = (faculty) => {
        setForm({
            name: faculty.name,
            employee_code: faculty.employee_code,
            email: faculty.email || '',
            phone: faculty.phone || '',
            specialization: faculty.specialization || '',
            max_weekly_hours: faculty.max_weekly_hours,
            department_id: faculty.department_id
        });
        setEditingId(faculty.id);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this faculty?')) return;
        try {
            await deleteFaculty(id);
            toast.success('Faculty deleted');
            loadData();
        } catch (err) {
            // Error handled by interceptor
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
                <h1 className="text-2xl font-bold text-gray-900">Faculties</h1>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                    <Plus className="w-5 h-5" /> Add Faculty
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {faculties.map((faculty) => (
                    <div key={faculty.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h3 className="font-semibold text-gray-900">{faculty.name}</h3>
                                <p className="text-sm text-gray-500">Code: {faculty.employee_code}</p>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full ${faculty.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {faculty.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600 mb-4">
                            {faculty.email && <p>Email: {faculty.email}</p>}
                            {faculty.specialization && <p>Specialization: {faculty.specialization}</p>}
                            <p>Max Hours/Week: {faculty.max_weekly_hours}h</p>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => handleEdit(faculty)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                                <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(faculty.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
                {faculties.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500">No faculties found</div>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-lg">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold">{editingId ? 'Edit' : 'Add'} Faculty</h2>
                            <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                    <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2 border rounded-lg" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Employee Code</label>
                                    <input type="text" value={form.employee_code} onChange={(e) => setForm({ ...form, employee_code: e.target.value })} className="w-full px-4 py-2 border rounded-lg" required />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                <select value={form.department_id} onChange={(e) => setForm({ ...form, department_id: e.target.value })} className="w-full px-4 py-2 border rounded-lg" required>
                                    <option value="">Select Department</option>
                                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                    <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                                    <input type="text" value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Weekly Hours</label>
                                    <input type="number" min="1" max="40" value={form.max_weekly_hours} onChange={(e) => setForm({ ...form, max_weekly_hours: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                                <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
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
