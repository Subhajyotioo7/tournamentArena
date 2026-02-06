import { useState } from "react";
import { apiPost } from "../services/api";
import { useNavigate } from "react-router-dom";

export default function CreateItem() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    await apiPost("/items/create/", { name, price });
    navigate("/");
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow">
      <h1 className="text-2xl font-bold mb-6">Create Item</h1>

      <form onSubmit={submit} className="space-y-4">
        <input
          className="w-full border p-3 rounded"
          placeholder="Item Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          className="w-full border p-3 rounded"
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />

        <button className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700">
          Add Item
        </button>
      </form>
    </div>
  );
}
