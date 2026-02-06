import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiGet } from "../services/api";

export default function ItemDetails() {
  const { id } = useParams();
  const [item, setItem] = useState(null);

  useEffect(() => {
    apiGet(`/items/${id}/`).then(setItem);
  }, [id]);

  if (!item) return <p>Loading...</p>;

  return (
    <div className="max-w-lg mx-auto bg-white p-8 rounded-xl shadow">
      <h1 className="text-3xl font-bold mb-4">{item.name}</h1>
      <p className="text-gray-700 text-xl mb-4">₹{item.price}</p>

      <button
        onClick={() => window.history.back()}
        className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
      >
        Go Back
      </button>
    </div>
  );
}
