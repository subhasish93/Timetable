import { useEffect, useState } from "react";
import { API } from "../api/api";

export default function TimetableView() {
    const [rows, setRows] = useState([]);

    useEffect(() => {
        API.get("/timetable/full")
            .then(res => {
                console.log("API Response:", res.data);
                setRows(res.data);
            })
            .catch(err => console.error("API ERROR", err));
    }, []);

    return (
        <div style={{ padding: "20px" }}>
            <h2 style={{ fontSize: "22px", fontWeight: "bold" }}>
                College Timetable
            </h2>

            <table border="1" cellPadding="10" width="100%">
                <thead>
                    <tr>
                        <th>Day</th>
                        <th>Time</th>
                        <th>Section</th>
                        <th>Subject</th>
                        <th>Teacher</th>
                        <th>Room</th>
                    </tr>
                </thead>

                <tbody>
                    {rows.map((r, i) => (
                        <tr key={i}>
                            <td>{r.day_of_week}</td>
                            <td>{r.start_time} - {r.end_time}</td>
                            <td>{r.section}</td>
                            <td>{r.subject}</td>
                            <td>{r.teacher}</td>
                            <td>{r.room_no}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
