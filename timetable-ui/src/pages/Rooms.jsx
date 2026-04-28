import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { getRooms, createRoom, updateRoom, deleteRoom, getDepartments } from '../api/api';
import toast from 'react-hot-toast';

export default function Rooms() {
    const [rooms, setRooms] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({ name: '', building: '', capacity: 60, department_id: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [roomsRes, deptsRes] = await Promise.all([
                getRooms(),
                getDepartments()
            ]);
            setRooms(roomsRes.data);
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
            const data = { ...form, department_id: parseInt(form.department_id), capacity: parseInt(form.capacity) };
            if (editingId) {
                await updateRoom(editingId, data);
                toast.success('Room updated');
            } else {
                await createRoom(data);
                toast.success('Room created');
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
        setForm({ name: '', building: '', capacity: 60, department_id: '' });
        setEditingId(null);
    };

    const handleEdit = (room) => {
        setForm({
            name: room.name,
            building: room.building || '',
            capacity: room.capacity,
            department_id: room.department_id
        });
        setEditingId(room.id);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this room?')) return;
        try {
            await deleteRoom(id);
            toast.success('Room deleted');
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
                <h1 className="text-2xl font-bold text-gray-900">Rooms</h1>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                    <Plus className="w-5 h-5" /> Add Room
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {rooms.map((room) => (
                    <div key={room.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h3 className="font-semibold text-gray-900">{room.name}</h3>
                                {room.building && <p className="text-sm text-gray-500">{room.building}</p>}
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full ${room.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {room.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Capacity: {room.capacity}</span>
                            <div className="flex gap-1">
                                <button onClick={() => handleEdit(room)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                                    <Pencil className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(room.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                {rooms.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500">No rooms found</div>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold">{editingId ? 'Edit' : 'Add'} Room</h2>
                            <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Room Name</label>
                                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2 border rounded-lg" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Building</label>
                                <input type="text" value={form.building} onChange={(e) => setForm({ ...form, building: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                <select value={form.department_id} onChange={(e) => setForm({ ...form, department_id: e.target.value })} className="w-full px-4 py-2 border rounded-lg" required>
                                    <option value="">Select Department</option>
                                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                                <input type="number" min="1" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} className="w-full px-4 py-2 border rounded-lg" required />
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
