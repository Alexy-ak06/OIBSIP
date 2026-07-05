import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const STATUS_STEPS = ['Order Received', 'In Kitchen', 'Sent to Delivery'];

const Dashboard = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get('/orders/my-orders');
        setOrders(res.data);
      } catch (err) {
        console.error('Failed to fetch orders', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  useEffect(() => {
    if (orders.length === 0) return;

    const socket = io('https://oibsip-production.up.railway.app')

    // Join a room for every order so we get live updates for each
    orders.forEach((order) => {
      socket.emit('joinOrderRoom', order._id);
    });

    socket.on('orderStatusUpdate', (data) => {
      setOrders((prev) =>
        prev.map((o) =>
          o._id === data.orderId
            ? { ...o, orderStatus: data.orderStatus, paymentStatus: data.paymentStatus }
            : o
        )
      );
    });

    return () => socket.disconnect();
  }, [orders.length]);

  const getStatusIndex = (status) => STATUS_STEPS.indexOf(status);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-red-700 mb-4">
          Welcome, {user?.name} 🍕
        </h1>

        <Link
          to="/build-pizza"
          className="inline-block bg-red-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-800 transition mb-8"
        >
          Build Your Pizza
        </Link>

        <h2 className="text-xl font-bold mb-4">Your Orders</h2>

        {loading ? (
          <p className="text-gray-500">Loading orders...</p>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
            No orders yet. Build your first pizza above!
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order._id} className="bg-white rounded-lg shadow-md p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-medium">
                      {order.pizzaConfig.base?.name} + {order.pizzaConfig.sauce?.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {order.pizzaConfig.cheese?.name} •{' '}
                      {order.pizzaConfig.vegetables?.map((v) => v.name).join(', ') || 'No veggies'}
                    </p>
                  </div>
                  <span className="text-lg font-bold text-red-700">₹{order.totalAmount}</span>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      order.paymentStatus === 'paid'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {order.paymentStatus === 'paid' ? 'Paid' : 'Payment Pending'}
                  </span>
                </div>

                {order.paymentStatus === 'paid' && (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      {STATUS_STEPS.map((step, i) => (
                        <span
                          key={step}
                          className={i <= getStatusIndex(order.orderStatus) ? 'text-red-700 font-medium' : ''}
                        >
                          {step}
                        </span>
                      ))}
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-700 transition-all duration-500"
                        style={{
                          width: `${((getStatusIndex(order.orderStatus) + 1) / STATUS_STEPS.length) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;