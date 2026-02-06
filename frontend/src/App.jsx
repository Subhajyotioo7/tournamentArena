import { Outlet } from "react-router-dom";
import Navbar from "./components/Navbar";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      {/* Page Content */}
      <div className="pt-4">
        <Outlet />
      </div>
    </div>
  );
}
