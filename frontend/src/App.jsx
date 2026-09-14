import { Outlet } from "react-router-dom";
import Navbar from "./components/Navbar";

export default function App() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-100">
      <Navbar />

      {/* Page Content */}
      <div className="min-h-[calc(100vh-4rem)] overflow-visible pt-4">
        <Outlet />
      </div>
    </div>
  );
}
