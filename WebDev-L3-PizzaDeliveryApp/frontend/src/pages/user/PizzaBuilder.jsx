import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const STEPS = ['base', 'sauce', 'cheese', 'vegetables', 'summary'];

const PizzaBuilder = () => {
  const [stepIndex, setStepIndex] = useState(0);
  const [catalog, setCatalog] = useState(null);
  const [selection, setSelection] = useState({
    base: null,
    sauce: null,
    cheese: null,
    vegetables: []
  });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const res = await api.get('/pizza/catalog');
        setCatalog(res.data);
      } catch (err) {
        setError('Failed to load pizza options');
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  const currentStep = STEPS[stepIndex];

  const selectSingle = (category, item) => {
    setSelection((prev) => ({ ...prev, [category]: item }));
  };

  const toggleVegetable = (item) => {
    setSelection((prev) => {
      const exists = prev.vegetables.find((v) => v._id === item._id);
      return {
        ...prev,
        vegetables: exists
          ? prev.vegetables.filter((v) => v._id !== item._id)
          : [...prev.vegetables, item]
      };
    });
  };

  const canProceed = () => {
    if (currentStep === 'base') return !!selection.base;
    if (currentStep === 'sauce') return !!selection.sauce;
    if (currentStep === 'cheese') return !!selection.cheese;
    return true; // vegetables optional
  };

  const goNext = () => setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  const goBack = () => setStepIndex((i) => Math.max(i - 1, 0));

  const calculateTotal = () => {
    const PRICE = { base: 150, sauce: 20, cheese: 50, vegetable: 15 };
    return PRICE.base + PRICE.sauce + PRICE.cheese + selection.vegetables.length * PRICE.vegetable;
  };

  const handleCheckout = async () => {
    setProcessing(true);
    setError('');
    try {
      // 1. Create the order in our DB (pending payment)
      const orderRes = await api.post('/orders', {
        base: selection.base._id,
        sauce: selection.sauce._id,
        cheese: selection.cheese._id,
        vegetables: selection.vegetables.map((v) => v._id),
        quantity: 1
      });
      const orderId = orderRes.data.order._id;

      // 2. Create a Razorpay order
      const rpRes = await api.post(`/orders/${orderId}/create-razorpay-order`);
      const { razorpayOrderId, amount, currency, keyId } = rpRes.data;

      // 3. Open Razorpay checkout popup
      const options = {
        key: keyId,
        amount,
        currency,
        name: 'Pizza Delivery',
        description: 'Custom Pizza Order',
        order_id: razorpayOrderId,
        prefill: {
          name: user?.name,
          email: user?.email
        },
        theme: { color: '#b91c1c' },
        handler: async (response) => {
          // 4. Verify payment on our backend
          try {
            await api.post(`/orders/${orderId}/confirm-payment`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            navigate('/dashboard');
          } catch (err) {
            setError('Payment verification failed. Please contact support.');
          }
        },
        modal: {
          ondismiss: () => setProcessing(false)
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading pizza options...</div>;
  }

  if (error && !catalog) {
    return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>;
  }

  const renderOptionGrid = (items, category, isMulti = false) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {items.map((item) => {
        const isSelected = isMulti
          ? selection.vegetables.find((v) => v._id === item._id)
          : selection[category]?._id === item._id;

        return (
          <button
            key={item._id}
            onClick={() => (isMulti ? toggleVegetable(item) : selectSingle(category, item))}
            className={`border rounded-lg p-4 text-left transition ${
              isSelected
                ? 'border-red-700 bg-red-50 ring-2 ring-red-700'
                : 'border-gray-300 hover:border-red-400'
            }`}
          >
            <p className="font-medium">{item.name}</p>
            <p className="text-xs text-gray-500 mt-1">Stock: {item.stock}</p>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Step indicator */}
        <div className="flex justify-between mb-8">
          {STEPS.map((step, i) => (
            <div
              key={step}
              className={`flex-1 text-center text-sm font-medium capitalize pb-2 border-b-4 ${
                i === stepIndex ? 'border-red-700 text-red-700' : 'border-gray-300 text-gray-400'
              }`}
            >
              {step}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          {currentStep === 'base' && (
            <>
              <h2 className="text-xl font-bold mb-4">Choose your base</h2>
              {renderOptionGrid(catalog.bases, 'base')}
            </>
          )}

          {currentStep === 'sauce' && (
            <>
              <h2 className="text-xl font-bold mb-4">Choose your sauce</h2>
              {renderOptionGrid(catalog.sauces, 'sauce')}
            </>
          )}

          {currentStep === 'cheese' && (
            <>
              <h2 className="text-xl font-bold mb-4">Choose your cheese</h2>
              {renderOptionGrid(catalog.cheeses, 'cheese')}
            </>
          )}

          {currentStep === 'vegetables' && (
            <>
              <h2 className="text-xl font-bold mb-4">Choose your vegetables (optional)</h2>
              {renderOptionGrid(catalog.vegetables, 'vegetables', true)}
            </>
          )}

          {currentStep === 'summary' && (
            <>
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>
              <div className="space-y-2 text-gray-700 mb-6">
                <p><span className="font-medium">Base:</span> {selection.base?.name}</p>
                <p><span className="font-medium">Sauce:</span> {selection.sauce?.name}</p>
                <p><span className="font-medium">Cheese:</span> {selection.cheese?.name}</p>
                <p>
                  <span className="font-medium">Vegetables:</span>{' '}
                  {selection.vegetables.length > 0
                    ? selection.vegetables.map((v) => v.name).join(', ')
                    : 'None'}
                </p>
              </div>
              <div className="border-t pt-4 flex justify-between items-center">
                <span className="text-lg font-bold">Total</span>
                <span className="text-2xl font-bold text-red-700">₹{calculateTotal()}</span>
              </div>
            </>
          )}

          {error && <p className="text-red-600 text-sm mt-4">{error}</p>}

          {/* Navigation buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={goBack}
              disabled={stepIndex === 0}
              className="px-4 py-2 rounded border border-gray-300 disabled:opacity-40"
            >
              Back
            </button>

            {currentStep === 'summary' ? (
              <button
                onClick={handleCheckout}
                disabled={processing}
                className="px-6 py-2 rounded bg-red-700 text-white font-medium hover:bg-red-800 disabled:opacity-50"
              >
                {processing ? 'Processing...' : 'Proceed to Payment'}
              </button>
            ) : (
              <button
                onClick={goNext}
                disabled={!canProceed()}
                className="px-6 py-2 rounded bg-red-700 text-white font-medium hover:bg-red-800 disabled:opacity-40"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PizzaBuilder;