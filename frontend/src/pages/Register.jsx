import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

//sweet alert
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const MySwal = withReactContent(Swal);

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrors({});

    try {
      await axios.post("http://localhost:5000/user/register", {
        name,
        email,
        password,
        confirmPassword,
      });
      Swal.fire({
        title: "Sucessfully Registered",
        text: "Registration successful! Please login.",
        icon: "success",
        confirmButtonText: "Ok",
        confirmButtonColor: "#efb100",
      }).then((result) => {
        if (result.isConfirmed) {
          navigate("/login");
        }
      });
    } catch (error) {
      console.log(error.response)
      const errors = error.response?.data.errors || "An error occurred";
      setErrors(errors);
      Object.keys(errors).forEach((key) => {
        MySwal.fire({
          title: "Error",
          text: errors[key],
          icon: "error",
          confirmButtonText: "Ok",
          confirmButtonColor: "#ef4444",
        });
      });
    }
  };

  return (
    <div className="fixed inset-0 w-full h-screen overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 w-full h-full bg-gray-900 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/foodbg.jpg')" }}
      >
        <div className="absolute inset-0 bg-gray-900/75"></div>
      </div>

      {/* Register Card */}
      <div className="relative z-10 flex items-center justify-center w-full h-full">
        <div className="w-full max-w-md p-8 bg-white shadow-lg rounded-lg">
          <img
            src="/logo_FastEats.png"
            alt="Logo"
            className="w-32 mx-auto mb-4"
          />
          <h2 className="text-2xl font-semibold text-center mb-6">Register</h2>
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full p-3 border rounded-lg focus:border-0 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>
            <div>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full p-3 border rounded-lg focus:border-0 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>
            <div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full p-3 border rounded-lg focus:border-0 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>
            <div>
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full p-3 border rounded-lg focus:border-0 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
              )}
            </div>
            <button
              type="submit"
              className="w-full p-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition hover:cursor-pointer"
            >
              Register
            </button>
            {errors.general && (
              <p className="text-red-500 text-sm mt-2 text-center">
                {errors.general}
              </p>
            )}
          </form>
          <p className="mt-4 text-center">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-yellow-500 underline hover:text-yellow-600"
            >
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
