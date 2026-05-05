import { useState } from "react";

function Organization() {
  const [organization, setOrganization] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const API = "http://127.0.0.1:8000";

  const handleSubmit = async () => {
    if (!organization.trim())
      return setErrorMsg("Organization name is required");

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch(`${API}/organisation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: organization.trim() }),
      });

      if (!res.ok) throw new Error("Failed to create organization");

      setSuccessMsg("🎉 Organization created successfully!");
      setOrganization("");

    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Create Organization</h1>

      {errorMsg && <p className="text-red-600">{errorMsg}</p>}
      {successMsg && <p className="text-green-600">{successMsg}</p>}

      <input
        type="text"
        value={organization}
        onChange={(e) => setOrganization(e.target.value)}
        placeholder="Organization Name"
        className="w-full border p-3 rounded mb-4"
      />

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {loading ? "Creating..." : "Create Organization"}
      </button>
    </div>
  );
}

export default Organization;