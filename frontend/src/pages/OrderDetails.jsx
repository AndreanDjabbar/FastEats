import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import Swal from "sweetalert2";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import BackButton from "../components/BackButton";
import StatusBadge from "../components/StatusBadge"; // Import the StatusBadge component

const OrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const token = localStorage.getItem("token");

  const handleCancel = async (orderId) => {
    Swal.fire({
      title: "Cancel Order?",
      text: "Are you sure you want to cancel this order?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, cancel it!",
      cancelButtonText: "No, keep my order",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await axios.patch(
            `http://localhost:5000/order/cancel-order/${orderId}`,
            {},
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          Swal.fire(
            "Cancelled!",
            response.data.message || "Your order has been cancelled.",
            "success"
          ).then(() => {
            navigate("/orders");
          });
        } catch (err) {
          console.error("Error cancelling order:", err);
          setError(err.message || "Failed to cancel order");

          // Show error message with SweetAlert
          Swal.fire(
            "Error!",
            "Failed to cancel the order. Please try again.",
            "error"
          );
        }
      }
    });
  };

  useEffect(() => {
    const snapScript = "https://app.sandbox.midtrans.com/snap/snap.js";
    const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY;
    const script = document.createElement("script");
    script.src = snapScript;
    script.setAttribute("data-client-key", clientKey);
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePayConfirmation = async (orderId, itemQuantity, itemPrice) => {
    console.log("Confirming payment for order ID:", orderId);
    try {
      setPaymentLoading(true);
      console.log("Confirming payment for order ID:", orderId);
      console.log("Item Quantity:", itemQuantity);
      console.log("Item Price:", itemPrice);
      console.log("Token:", token);
      const response = await axios.post(
        "http://localhost:5000/order/pay-order-confirmation",
        {
          order_id: orderId,
          itemQuantity: itemQuantity,
          itemPrice: itemPrice,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        const snapToken = response.data.data.token;
        console.log("Snap Token:", snapToken);
        window.snap.pay(snapToken, {
          skipOrderSummary: true,
          showOrderId: true,

          onSuccess: function (result) {
            console.log("success", result);
            alert("Pembayaran berhasil!");

            window.location.href = "/payment-success?order_id=" + orderId;
          },
          onPending: async function (result) {
            try {
              const response = await axios.post(
                "http://localhost:5000/order/save-snap-token",
                {
                  order_id: orderId,
                  snap_token: snapToken,
                }
              );
              alert(
                "Pembayaran sedang diproses. Silakan cek status pembayaran di halaman transaksi."
              );
              setPaymentLoading(false);
            } catch (err) {
              console.error("Error saving snap token:", err);
            }
          },
          onError: function (result) {
            console.log("error", result);
            alert("Terjadi kesalahan dalam proses pembayaran.");
            setPaymentLoading(false);
          },
          onClose: async function () {
            try {
              const statusResponse = await axios.get(
                `http://localhost:5000/order/check-midtrans-status?order_id=${orderId}`
              );

              if (statusResponse.data.transaction_status === "pending") {
                alert(
                  "Anda sudah memilih metode pembayaran, silakan lanjutkan pembayaran di halaman transaksi."
                );
              } else {
                alert("Pembayaran dibatalkan. Silakan coba lagi.");
              }
            } catch (error) {
              console.error("Error checking transaction status:", error);
            }
          },
        });
      }
    } catch (err) {
      console.error("Error confirming payment:", err);
      setError(err.message || "Failed to confirm payment");
      setPaymentLoading(false);
    }
  };

  const fetchOrderDetails = async () => {
    if (!orderId) {
      setError("Order ID is missing");
      setLoading(false);
      return;
    }

    try {
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await axios.get(
        `http://localhost:5000/order/orders/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Order data received:", response.data);
      if (response.data.success && response.data.order) {
        setOrder(response.data.order);
      } else {
        throw new Error("No order data received");
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
      setError(error.message || "Failed to fetch order details");
    } finally {
      setLoading(false);
    }
  };

  const handleOrderAgain = async () => {
    // Navigate to the menu page or specific menu item
    if (order && order.menu) {
      navigate(`/menu/${order.menu.menu_id}`);
    } else {
      navigate("/menu");
    }
  };

  useEffect(() => {
    console.log("Fetching details for order ID:", orderId);
    const fetchOrderDetails = async () => {
      if (!orderId) {
        setError("Order ID is missing");
        setLoading(false);
        return;
      }
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No authentication token found");
        }

        const response = await axios.get(
          `http://localhost:5000/order/orders/${orderId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        console.log("Order data received:", response.data);
        if (response.data.success && response.data.order) {
          setOrder(response.data.order);
        } else {
          throw new Error("No order data received");
        }
      } catch (error) {
        console.error("Error fetching order details:", error);
        setError(error.message || "Failed to fetch order details");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  // Function to get Lottie animation URL based on status
  const getLottieAnimation = (status) => {
    switch (status) {
      case "Preparing":
        return "https://lottie.host/e113de9a-3d49-4136-bc9c-0703a1041edd/eT7Kkp0txx.lottie";
      case "Delivering":
        return "https://lottie.host/1227bbdc-43c4-4906-bf08-6d27acf0d697/DOrQKgF1UY.lottie";
      case "Completed":
        return "https://lottie.host/dd23579f-26b5-4b04-8fe3-edc841827620/Qh3EsqxT3g.lottie";
      case "Waiting":
        return "https://lottie.host/e32b2761-4d9d-4f63-95ab-899051f6b8da/jeAjS2g6jh.lottie";
      case "Cancelled":
        return "https://lottie.host/1a20f4b7-ffd5-47c2-9ff0-f8abfbd91352/QaXJ8BkEZQ.lottie";
      case "Pending":
        return "https://lottie.host/e32b2761-4d9d-4f63-95ab-899051f6b8da/jeAjS2g6jh.lottie";
    }
  };

  // Function to get status message (only for Preparing and Delivering)
  const getStatusMessage = (status) => {
    switch (status) {
      case "Preparing":
        return "Our chefs are preparing your delicious meal!";
      case "Delivering":
        return "Your order is on the way to your location!";
      case "Completed":
        return "Your order has been delivered successfully!";
      case "Waiting":
        return "Please select a payment method to proceed.";
      case "Pending":
        return "Please complete your payment to proceed.";
      case "Cancelled":
        return "Your order has been cancelled.";
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col md:flex-row p-4 md:p-10 w-full md:pl-64 min-h-screen">
        <Sidebar />
        <div className="flex justify-center items-center w-full">
          <div className="text-xl">Loading order details...</div>
        </div>
      </div>
    );
  }

  const handlePayment = async () => {
    const orderId = order.order_id;

    if (!orderId) return;

    try {
      const response = await fetch(
        `http://localhost:5000/order/snap/${orderId}`
      );
      const data = await response.json();

      if (data?.snap_token) {
        window.snap.pay(data.snap_token);
      } else {
        alert("Failed to get transaction token.");
      }
    } catch (error) {
      console.error("Error fetching transaction token:", error);
      alert("Error processing payment.");
    }
  };

  // Render buttons based on order status
  const renderActionButtons = () => {
    if (!order) return null;

    switch (order.status) {
      case "Waiting":
        return (
          <div className="flex justify-between gap-4">
            <button
              className="w-1/2 py-2 px-4 bg-gray-300 text-gray-800 font-semibold rounded-lg hover:bg-gray-400 transition"
              onClick={() => handleCancel(order.order_id)}
              disabled={paymentLoading}
            >
              Cancel
            </button>
            <button
              className="w-1/2 py-2 px-4 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 transition cursor-pointer"
              onClick={() =>
                handlePayConfirmation(
                  order.order_id,
                  order.item_quantity,
                  order.menu.menu_price
                )
              }
            >
              Pay
            </button>
          </div>
        );
      case "Completed":
      case "Pending":
        return (
          <div className="flex justify-center">
            <button
              className="w-full py-2 px-4 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 transition"
              onClick={handlePayment}
            >
              Pay Order
            </button>
          </div>
        );
      case "Cancelled":
        return (
          <div className="flex justify-center">
            <button
              className="w-full py-2 px-4 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 transition cursor-pointer"
              onClick={handleOrderAgain}
            >
              Order Again
            </button>
          </div>
        );
      case "Preparing":
      case "Delivering":
        return null; // No buttons for these statuses
      default:
        return (
          <button
            className={`w-1/2 py-2 px-4 ${
              paymentLoading
                ? "bg-yellow-400 cursor-wait"
                : "bg-yellow-500 hover:bg-yellow-600"
            } text-white font-semibold rounded-lg transition`}
            onClick={() =>
              handlePayConfirmation(
                order.order_id,
                order.item_quantity,
                order.menu.menu_price
              )
            }
            disabled={paymentLoading}
          >
            {paymentLoading ? "Memproses..." : "Pay"}
          </button>
        );
    }
  };

  // Render status with Lottie animation when applicable
  const renderStatusWithAnimation = () => {
    if (!order) return null;

    const lottieUrl = getLottieAnimation(order.status);
    const statusMessage = getStatusMessage(order.status);

    // Set speed to 0.5 (half speed) for Cancelled status, 1 for others
    const animationSpeed = order.status === "Cancelled" ? 0.5 : 1;

    if (lottieUrl) {
      return (
        <div className="mb-6">
          <div className="relative w-64 h-64 mx-auto">
            <DotLottieReact
              src={lottieUrl}
              loop
              autoplay
              speed={animationSpeed} // Add speed property to control animation speed
            />
          </div>
          {statusMessage && (
            <p className="text-amber-700 text-center">{statusMessage}</p>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col md:flex-row p-4 md:p-10 w-full md:pl-64 min-h-screen bg-amber-50">
      <Sidebar />
      <div className="flex-grow max-w-4xl mx-auto w-full">
        <div className="mb-6">
          <BackButton to="/orders" />
        </div>

        {order && (
          <div className="bg-white rounded-lg shadow-lg p-6 border border-amber-100">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-amber-900">
                Order #{order.order_id}
              </h1>
              {/* Replace the old status badge with the new StatusBadge component */}
              <StatusBadge
                status={order.status}
                className="px-4 py-2 rounded-full text-sm font-medium"
              />
            </div>

            {/* Lottie animation for specific statuses */}
            {renderStatusWithAnimation()}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 bg-amber-50 p-4 rounded-lg">
              <div className="border-l-4 border-amber-400 pl-4">
                <div className="text-sm text-amber-700 font-medium">
                  Order Date
                </div>
                <div className="text-lg">{formatDate(order.created_at)}</div>
              </div>
              <div className="border-l-4 border-amber-400 pl-4">
                <div className="text-sm text-amber-700 font-medium">
                  Last Updated
                </div>
                <div className="text-lg">{formatDate(order.updated_at)}</div>
              </div>
            </div>

            <div className="border-t border-amber-200 pt-6">
              <h2 className="text-xl font-semibold mb-6 text-amber-900">
                Order Details
              </h2>
              {/* Menu Image - Moved here, right before the Order Details section */}
              {order.menu.menu_image && (
                <div className="mb-6 p-4 bg-amber-50 rounded-lg">
                  <img
                    src={`http://localhost:5000/restaurant/uploads/menu/${order.menu.menu_image}`}
                    alt={order.menu.menu_name}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
              )}
              <div className="space-y-4 bg-gradient-to-r from-amber-50 to-white p-6 rounded-lg">
                <div className="flex justify-between items-center py-2 border-b border-amber-100">
                  <span className="text-amber-700 font-medium">Menu Name</span>
                  <span className="text-amber-900">{order.menu.menu_name}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-amber-100">
                  <span className="text-amber-700 font-medium">
                    Menu Category
                  </span>
                  <span className="text-amber-900">
                    {order.menu.menu_category}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-amber-100">
                  <span className="text-amber-700 font-medium">
                    Price per Item
                  </span>
                  <span className="text-amber-900">
                    Rp{" "}
                    {parseFloat(order.menu.menu_price).toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-amber-100">
                  <span className="text-amber-700 font-medium">Quantity</span>
                  <span className="text-amber-900">{order.item_quantity}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-amber-100">
                  <span className="text-amber-700 font-medium">
                    Total Price
                  </span>
                  <span className="text-amber-900">
                    Rp{" "}
                    {(
                      parseFloat(order.menu.menu_price) * order.item_quantity
                    ).toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-amber-700 font-medium">Status</span>
                  {/* Using StatusBadge for the status in the details section */}
                  <StatusBadge
                    status={order.status}
                    className="px-3 py-1 rounded text-xs font-medium"
                  />
                </div>
              </div>
            </div>

            {order.menu.menu_description && (
              <div className="mt-8 p-4 bg-amber-50 rounded-lg">
                <div className="text-sm text-amber-700 font-medium mb-2">
                  Menu Description
                </div>
                <p className="text-amber-900">{order.menu.menu_description}</p>
              </div>
            )}

            <div className="mt-8 p-4 bg-amber-50 rounded-lg">
              <div className="flex items-center text-amber-700">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="w-5 h-5 mr-2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="font-medium">
                  Order processed at {formatDate(order.created_at)}
                </span>
              </div>
            </div>

            <div className="mt-8">{renderActionButtons()}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetails;
