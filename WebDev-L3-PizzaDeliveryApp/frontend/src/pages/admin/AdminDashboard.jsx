import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import adminApi from '../../api/adminAxios';
import { useAdminAuth } from '../../context/AdminAuthContext';

const STATUS_OPTIONS = ['Order Received', 'In Kitchen', 'Sent to Delivery'];

const AdminDashboard = () => {
  const { admin, adminLogout } = useAdminAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('inventory');

  const [inventory, setInventory] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');

  const fetchInventory = async () => {
    const res = await adminApi.get('/admin/inventory');
    setInventory(res.data);
  };

  const fetchOrders = async () => {
    const res = await adminApi.get('/admin/orders');
    setOrders(res.data);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchInventory(), fetchOrders()]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleLogout = () => {
    adminLogout();
    navigate('/admin/login');
  };

  const startEdit = (item) => {
    setEditingId(item._id);
    setEditValue(item.stock);
  };

  const saveStock = async (id) => {
    try {
      await adminApi.put(`/admin/inventory/${id}`, { stock: Number(editValue) });
      setEditingId(null);
      fetchInventory();
    } catch (err) {
      alert('Failed to update stock');
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      await adminApi.put(`/admin/orders/${orderId}/status`, { orderStatus: newStatus });
      fetchOrders();
    } catch (err) {
      alert('Failed to update order status');
    }
  };

  const groupedInventory = inventory.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-gray-900 text-white px-6 py-4 flex justify-between items-center">
        <span className="font-bold text-lg">🍕 Admin Panel</span>
        <div className="flex items-center gap-4">
          <span className="text-sm">Hi, {admin?.name}</span>
          <button
            onClick={handleLogout}
            className="bg-white text-gray-900 px-3 py-1 rounded hover:bg-gray-100 transition text-sm"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto p-6">
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setTab('inventory')}
            className={`px-4 py-2 rounded font-medium ${
              tab === 'inventory' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700'
            }`}
          >
            Inventory
          </button>
          <button
            onClick={() => setTab('orders')}
            className={`px-4 py-2 rounded font-medium ${
              tab === 'orders' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700'
            }`}
          >
            Orders
          </button>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : tab === 'inventory' ? (
          <div className="space-y-6">
            {Object.entries(groupedInventory).map(([category, items]) => (
              <div key={category} className="bg-white rounded-lg shadow-md p-5">
                <h3 className="font-bold text-lg capitalize mb-3">{category}s</h3>
                <div className="space-y-2">
                  {items.map((item) => (
                    <div
                      key={item._id}
                      className="flex justify-between items-center border-b last:border-0 py-2"
                    >
                      <span>{item.name}</span>
                      <div className="flex items-center gap-3">
                        {item.stock <= item.lowStockThreshold && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                            Low Stock
                          </span>
                        )}
                        {editingId === item._id ? (
                          <>
                            <input
                              type="number"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-20 border rounded px-2 py-1"
                            />
                            <button
                              onClick={() => saveStock(item._id)}
                              className="text-green-700 font-medium text-sm"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="text-gray-500 text-sm"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="font-medium w-12 text-right">{item.stock}</span>
                            <button
                              onClick={() => startEdit(item)}
                              className="text-red-700 text-sm font-medium"
                            >
                              Edit
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
                No orders yet.
              </div>
            ) : (
              orders.map((order) => (
                <div key={order._id} className="bg-white rounded-lg shadow-md p-5">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">{order.user?.name}</p>
                      <p className="text-xs text-gray-500">{order.user?.email}</p>
                    </div>
                    <span className="text-lg font-bold text-red-700">₹{order.totalAmount}</span>
                  </div>

                  <p className="text-sm text-gray-600 mb-2">
                    {order.pizzaConfig.base?.name} + {order.pizzaConfig.sauce?.name} +{' '}
                    {order.pizzaConfig.cheese?.name}
                    {order.pizzaConfig.vegetables?.length > 0 &&
                      ` + ${order.pizzaConfig.vegetables.map((v) => v.name).join(', ')}`}
                  </p>

                  <div className="flex items-center justify-between mt-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        order.paymentStatus === 'paid'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {order.paymentStatus === 'paid' ? 'Paid' : 'Pending Payment'}
                    </span>

                    {order.paymentStatus === 'paid' && (
                      <select
                        value={order.orderStatus}
                        onChange={(e) => updateStatus(order._id, e.target.value)}
                        className="border rounded px-2 py-1 text-sm"
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;