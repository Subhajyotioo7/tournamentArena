import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiGet } from "../services/api";
import { Button } from "../components/ui/button";

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

      <Button
        onClick={() => window.history.back()}
        variant="secondary"
      >
        Go Back
      </Button>
    </div>
  );
}
