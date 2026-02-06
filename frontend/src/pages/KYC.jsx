import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function KYC() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1=form, 2=otp
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    aadhaar: "",
    pan: "",
    dob: "",
    address: ""
  });

  const [otp, setOtp] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // STEP 1 → SUBMIT KYC & SEND OTP
  const handleSubmitKYC = (e) => {
    e.preventDefault();

    if (form.aadhaar.length !== 12) {
      alert("Enter valid 12-digit Aadhaar number");
      return;
    }

    setLoading(true);

    // 🔁 DEMO OTP SEND (Backend later)
    setTimeout(() => {
      setLoading(false);
      setStep(2);
      alert("OTP sent to Aadhaar linked mobile (Demo OTP: 123456)");
    }, 1500);
  };

  // STEP 2 → VERIFY OTP
  const handleVerifyOTP = (e) => {
    e.preventDefault();

    if (otp.length !== 6) {
      alert("Enter valid 6-digit OTP");
      return;
    }

    setLoading(true);

    // 🔁 DEMO OTP VERIFY
    setTimeout(() => {
      setLoading(false);

      if (otp === "123456") {
        alert("KYC submitted successfully. Status: PENDING");
        navigate("/profile");
      } else {
        alert("Invalid OTP");
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-lg">

        {step === 1 && (
          <>
            <h2 className="text-2xl font-bold mb-6">Complete KYC</h2>

            <form onSubmit={handleSubmitKYC} className="space-y-4">
              <input
                name="name"
                placeholder="Full Name (as per Aadhaar)"
                required
                onChange={handleChange}
                className="w-full p-3 border rounded"
              />

              <input
                name="aadhaar"
                placeholder="Aadhaar Number"
                maxLength="12"
                required
                onChange={handleChange}
                className="w-full p-3 border rounded"
              />

              <input
                name="pan"
                placeholder="PAN Number"
                required
                onChange={handleChange}
                className="w-full p-3 border rounded"
              />

              <input
                type="date"
                name="dob"
                required
                onChange={handleChange}
                className="w-full p-3 border rounded"
              />

              <textarea
                name="address"
                placeholder="Address"
                required
                onChange={handleChange}
                className="w-full p-3 border rounded"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 text-white py-3 rounded font-semibold"
              >
                {loading ? "Sending OTP..." : "Submit & Get OTP"}
              </button>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-2xl font-bold mb-4">Verify Aadhaar OTP</h2>
            <p className="text-gray-600 mb-6">
              OTP sent to mobile linked with Aadhaar
            </p>

            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit OTP"
                maxLength="6"
                className="w-full p-3 border rounded text-center text-xl tracking-widest"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white py-3 rounded font-semibold"
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-purple-600 font-semibold"
              >
                Change Aadhaar Number
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
