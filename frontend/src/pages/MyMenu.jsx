import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import SearchBar from "../components/SearchBar";
import BackButton from "../components/BackButton";

const MyMenuPage = () => {
  const { restaurantId } = useParams();
  const [menuItems, setMenuItems] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateMenuForm, setShowCreateMenuForm] = useState(false);

  // Keep these state variables for the SearchBar component
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // Form state
  const [menuName, setMenuName] = useState("");
  const [menuDesc, setMenuDesc] = useState("");
  const [menuCategory, setMenuCategory] = useState("");
  const [menuPrice, setMenuPrice] = useState("");
  const [menuImage, setMenuImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const navigate = useNavigate();
  const MySwal = withReactContent(Swal);

  const handleClick = (category) => {
    setSelectedCategory(category);
  };

  // Handle navigation to menu details page
  const handleMenuItemClick = (menuId) => {
    navigate(`/my-menu/${menuId}/details`);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const clearFilters = () => {
    setFilterCategory("");
    setMinPrice("");
    setMaxPrice("");
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size must be less than 5MB");
        return;
      }

      if (!file.type.startsWith("image/")) {
        alert("Please upload an image file");
        return;
      }

      setMenuImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          throw new Error("No token found. Please log in.");
        }

        const response = await fetch(`http://localhost:5000/restaurant/menus`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch menu.");
        }

        const data = await response.json();
        setMenuItems(data.menus || []);
      } catch (error) {
        console.error("Error fetching menu:", error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMenu();
  }, [restaurantId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowFilters(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle search input
  const handleSearch = (e) => setSearchQuery(e.target.value);

  // Handle category filter
  const handleCategoryFilter = (e) => setFilterCategory(e.target.value);

  // Handle price range input
  const handleMinPriceChange = (e) => setMinPrice(e.target.value);
  const handleMaxPriceChange = (e) => setMaxPrice(e.target.value);

  // Filter logic
  const filteredMenu = menuItems.filter((item) => {
    const matchesSearch = item.menu_name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory
      ? item.menu_category === filterCategory
      : true;

    const price = parseInt(item.menu_price);
    let matchesPrice = true;
    if (minPrice && price < parseInt(minPrice)) matchesPrice = false;
    if (maxPrice && price > parseInt(maxPrice)) matchesPrice = false;

    return matchesSearch && matchesCategory && matchesPrice;
  });

  const activeFilterCount = [
    filterCategory ? 1 : 0,
    minPrice || maxPrice ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const handleCreateNewMenu = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found. Please log in.");

      const formData = new FormData();
      formData.append("menuName", menuName);
      formData.append("menuDesc", menuDesc);
      formData.append("menuCategory", selectedCategory);
      formData.append("menuPrice", menuPrice);
      formData.append("restaurantId", restaurantId);
      if (menuImage) {
        formData.append("menuImage", menuImage);
      }

      const response = await axios.post(
        "http://localhost:5000/restaurant/menu",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setMenuItems((prevItems) => [...prevItems, response.data.dataMenu]);
      setShowCreateMenuForm(false);
      setMenuName("");
      setMenuDesc("");
      setMenuPrice("");
      setMenuCategory("");
      setPreviewImage(null);
      setMenuImage(null);
      Swal.fire({
        title: "Sucess!",
        text: "Menu created successfully",
        icon: "success",
        confirmButtonText: "Ok",
        confirmButtonColor: "#efb100",
      });
    } catch (error) {
      if (error.response) {
        const { status, data } = error.response;

        if (status === 400) {
          if (data.errors) {
            const validationErrors = Object.values(data.errors)
              .map((msg) => `• ${msg}`)
              .join("\n");
            Swal.fire({
              title: "Validation Error",
              text: validationErrors,
              icon: "error",
              confirmButtonText: "Ok",
              confirmButtonColor: "#efb100",
            });
          } else if (data.message) {
            Swal.fire({
              title: "Error",
              text: data.message,
              icon: "error",
              confirmButtonText: "Ok",
              confirmButtonColor: "#efb100",
            });
          } else {
            Swal.fire({
              title: "Error",
              text: "Invalid request. Please check your input.",
              icon: "error",
              confirmButtonText: "Ok",
              confirmButtonColor: "#efb100",
            });
          }
        } else if (status === 401) {
          Swal.fire({
            title: "Unauthorized!",
            text: "Please log in again.",
            icon: "error",
            confirmButtonText: "Ok",
            confirmButtonColor: "#efb100",
          }).then((result) => {
            if (result.isConfirmed) {
              localStorage.removeItem("token");
              navigate("/login");
            }
          });
        } else {
          Swal.fire({
            title: "Error",
            text:
              data.message ||
              "An unexpected error occurred. Please try again later.",
            icon: "error",
            confirmButtonText: "Ok",
            confirmButtonColor: "#efb100",
          });
        }
      }
    }
  };

  if (isLoading) {
    return <div className="text-center p-5">Loading menu...</div>;
  }

  //icons
  const foodIcon = "/icons/foods-icon.png";
  const drinkIcon = "/icons/drinks-icon.png";
  const dessertIcon = "/icons/dessert-icon.png";
  const otherIcon = "/icons/other-icon.png";

  return (
    <div className="flex ml-0 md:ml-64 bg-white min-h-screen">
      <Sidebar />
      <BackButton to="/manage-restaurant" />
      <main className="flex-1 p-5 relative mt-20 ml-10">
        <h1 className="text-3xl font-bold mb-6 text-yellow-600">My Menu</h1>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Replace the old search and filter code with the SearchBar component */}
        <SearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filterCategory={filterCategory}
          setFilterCategory={setFilterCategory}
          minPrice={minPrice}
          setMinPrice={setMinPrice}
          maxPrice={maxPrice}
          setMaxPrice={setMaxPrice}
          placeholder="Search my menu items..."
        />

        {filteredMenu.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredMenu.map((item) => (
              <div
                key={item.menu_id}
                className="bg-yellow-100 rounded-xl shadow-md border border-yellow-300 
                         transition-all duration-300 hover:shadow-lg hover:bg-yellow-400 
                         hover:border-yellow-800 cursor-pointer"
                onClick={() => handleMenuItemClick(item.menu_id)}
              >
                <img
                  src={
                    item.menu_image
                      ? `http://localhost:5000/restaurant/uploads/menu/${item.menu_image}`
                      : "https://www.pngall.com/wp-content/uploads/7/Dessert-PNG-Photo.png"
                  }
                  alt={item.menu_name}
                  className="w-full h-50 object-cover rounded-lg mb-4 group-hover:scale-105 transition-transform"
                />
                <div className="p-4">
                  <h3 className="text-xl font-bold text-yellow-800 group-hover:text-white ">
                    {item.menu_name}
                  </h3>
                  <p className="text-sm text-gray-500 italic group-hover:text-white">
                    {item.menu_category}
                  </p>
                  <p className="text-gray-700 mt-2 group-hover:text-white">
                    Rp {item.menu_price}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center py-8">
            {searchQuery || filterCategory || minPrice || maxPrice
              ? "No menu items match your search criteria."
              : "No menu available."}
          </div>
        )}

        <button
          onClick={() => setShowCreateMenuForm(true)}
          className="fixed bottom-10 right-10 bg-yellow-500 text-white px-6 py-3 rounded-full shadow-lg hover:bg-yellow-600 transition-transform transform hover:scale-105"
        >
          + Add Menu
        </button>

        {showCreateMenuForm && (
          <div className="flex items-center justify-center backdrop-blur-xs fixed top-0 right-0 bottom-0 left-0 z-50">
            <div className="bg-gradient-to-br from-yellow-300 to-yellow-800 via-yellow-500 py-5 px-8 scale-90 rounded-md overflow-y-auto relative max-h-screen sm:min-w-lg sm:scale-[0.8] lg:min-w-xl lg:scale-95 xl:min-w-3xl">
              <div className="flex items-center justify-center relative">
                <h2 className="font-extrabold text-2xl my-5 -mt-2 text-center text-yellow-900 sm:text-4xl">
                  Create Menu Form
                  <div className="absolute -top-1.5 -right-4">
                    <button
                      onClick={() => setShowCreateMenuForm(false)}
                      className="text-2xl cursor-pointer"
                    >
                      ❌
                    </button>
                  </div>
                </h2>
              </div>
              <div className="border border-yellow-200 p-4 bg-white rounded-md">
                <form className="text-start" onSubmit={handleCreateNewMenu}>
                  <div className="mb-4">
                    <label className="font-semibold text-sm">
                      Upload Image<span className="text-pink-600">*</span>
                    </label>
                    <div className="border border-slate-400 rounded-md border-dashed mt-1 w-full min-h-50 flex flex-col items-center justify-center">
                      <p className="font-semibold text-slate-600 text-center my-2">
                        JPG, PNG, GIF, WEBP, Max 100mb.
                      </p>
                      <input
                        id="file-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      <label
                        htmlFor="file-upload"
                        className="bg-yellow-500 text-white p-2 cursor-pointer hover:bg-yellow-600 rounded-sm font-semibold"
                      >
                        Choose File
                      </label>
                      {previewImage && (
                        <div className="mt-2 flex justify-center w-full">
                          <img
                            src={previewImage}
                            alt="Preview"
                            className="max-w-full max-h-80 object-contain rounded-md"
                            style={{ minWidth: "100%" }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Input Name */}
                  <div className="my-4">
                    <label className="font-semibold text-sm">
                      Name<span className="text-pink-600">*</span>
                    </label>
                    <input
                      type="text"
                      className="input border mt-1 border-slate-400 rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-0"
                      placeholder="Your Menu's Name"
                      value={menuName}
                      onChange={(e) => setMenuName(e.target.value)}
                    />
                  </div>

                  {/* Input Description */}
                  <div className="my-4">
                    <label className="font-semibold text-sm">
                      Description<span className="text-pink-600">*</span>
                    </label>
                    <textarea
                      className="input mt-1 border border-slate-400 rounded-md p-2 w-full h-32 resize-none focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-0"
                      placeholder="Your Menu's Description"
                      value={menuDesc}
                      onChange={(e) => setMenuDesc(e.target.value)}
                    />
                  </div>

                  {/* Input price */}
                  <div className="my-4">
                    <label className="font-semibold text-sm">
                      Price<span className="text-pink-600">*</span>
                    </label>
                    <input
                      type="number"
                      className="input border mt-1 border-slate-400 rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-0"
                      placeholder="Your Menu's Price"
                      value={menuPrice}
                      onChange={(e) => setMenuPrice(e.target.value)}
                    />
                  </div>

                  {/* Menu Category */}
                  <div className="my-4">
                    <label className="font-semibold text-sm">
                      Menu Category<span className="text-pink-600">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-0 mt-1 md:grid-cols-4">
                      <div
                        className={`border border-yellow-400 rounded-tl-md p-4 text-center cursor-pointer flex flex-col items-center justify-center h-full group transition md:rounded-l ${
                          selectedCategory === "Food"
                            ? "bg-yellow-500"
                            : "hover:bg-yellow-400"
                        }`}
                        onClick={() => handleClick("Food")}
                      >
                        <img
                          src={foodIcon}
                          alt="Foods"
                          className="mb-2 h-10 w-10 object-contain"
                        />
                        Foods
                      </div>

                      {/* Kategori Drinks */}
                      <div
                        className={`border rounded-tr-md border-yellow-400 p-4 text-center cursor-pointer flex flex-col items-center justify-center h-full group transition md:rounded-none ${
                          selectedCategory === "Drink"
                            ? "bg-yellow-500"
                            : "hover:bg-yellow-400"
                        }`}
                        onClick={() => handleClick("Drink")}
                      >
                        <img
                          src={drinkIcon}
                          alt="Drinks"
                          className="mb-2 h-10 w-10 object-contain"
                        />
                        Drinks
                      </div>

                      {/* Kategori Dessert */}
                      <div
                        className={`border rounded-bl-md border-yellow-400 p-4 text-center cursor-pointer flex flex-col items-center justify-center h-full group transition md:rounded-none ${
                          selectedCategory === "Dessert"
                            ? "bg-yellow-500"
                            : "hover:bg-yellow-400"
                        }`}
                        onClick={() => handleClick("Dessert")}
                      >
                        <img
                          src={dessertIcon}
                          alt="Dessert"
                          className="mb-2 h-10 w-10 object-contain"
                        />
                        Dessert
                      </div>

                      {/* Kategori Other */}
                      <div
                        className={`border border-yellow-400 rounded-br-md p-4 text-center cursor-pointer flex flex-col items-center justify-center h-full group transition md:rounded-r ${
                          selectedCategory === "Others"
                            ? "bg-yellow-500"
                            : "hover:bg-yellow-400"
                        }`}
                        onClick={() => handleClick("Others")}
                      >
                        <img
                          src={otherIcon}
                          alt="Other"
                          className="mb-2 h-10 w-10 object-contain"
                        />
                        Other
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="mt-10 flex items-center justify-center w-full">
                    <button className="bg-gradient-to-br from-yellow-400 via-yellow-600 to-yellow-800 text-white p-2.5 rounded-xl text-xl font-bold cursor-pointer w-full">
                      Submit
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MyMenuPage;
