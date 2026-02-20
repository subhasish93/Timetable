import { useEffect, useState } from "react";
import { getSections, getSlots, createTimetable } from "../api/timetable";

export default function TimetableCreate() {
    const [sections, setSections] = useState([]);
    const [slots, setSlots] = useState([]);
    const [form, setForm] = useState({});

    useEffect(() => {
        getSections().then(res => setSections(res.data));
        getSlots().then(res => setSlots(res.data));
    }, []);

    const handleChange = (e) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const submit = async () => {
        await createTimetable(form);
        alert("Timetable Added");
    };

    return (
        <div className="p-6 bg-white shadow rounded w-96">
            <h2 className="text-xl font-bold mb-3">Create Timetable</h2>

            <select name="section_id" onChange={handleChange} className="border p-2 w-full mb-2">
                <option>Select Section</option>
                {sections.map(s => <option value={s.section_id}>{s.name}</option>)}
            </select>

            <select name="slot_id" onChange={handleChange} className="border p-2 w-full mb-2">
                <option>Select Slot</option>
                {slots.map(s => <option value={s.slot_id}>{s.day_of_week}</option>)}
            </select>

            <input name="subject_teacher_id" placeholder="SubjectTeacher ID" className="border p-2 w-full mb-2" onChange={handleChange} />
            <input name="room_no" placeholder="Room No" className="border p-2 w-full mb-2" onChange={handleChange} />

            <button onClick={submit} className="bg-blue-600 text-white px-4 py-2 rounded">
                
            </button>
        </div>
    );
}
