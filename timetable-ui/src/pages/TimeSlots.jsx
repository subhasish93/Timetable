import React, { useEffect, useState } from "react";
import api from "../api/api";

export default function TimeSlots() {
    const [slots, setSlots] = useState([]);

    useEffect(() => {
        api.get("/time-slots")
            .then(res => setSlots(res.data))
            .catch(err => console.error(err));
    }, []);

    return (
        <div>
            <h1>Time Slots</h1>
            <ul>
                {slots.map(s => (
                    <li key={s.id}>{s.name}</li>
                ))}
            </ul>
        </div>
    );
}
