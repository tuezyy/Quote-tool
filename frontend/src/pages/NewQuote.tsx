import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../services/api';
import { Collection, Style, Customer, Product } from '../types';
import ProductCatalog from '../components/ProductCatalog';

interface QuoteItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  total: number;
}

export default function NewQuote() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Customer Selection
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: ''
  });

  // Step 2: Collection & Style
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<Style | null>(null);

  // Step 3: Products
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);

  // Step 4: Review & Save
  const [taxRate, setTaxRate] = useState(0.0875); // Default 8.75%
  const [notes, setNotes] = useState('');
  const [installationFee, setInstallationFee] = useState(0);
  const [miscExpenses, setMiscExpenses] = useState(0);
  const [clientPreview, setClientPreview] = useState(false);

  useEffect(() => {
    fetchCustomers();
    fetchCollections();
    fetchSettings();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get('/customers');
      setCustomers(response.data.customers || []);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    }
  };

  const fetchCollections = async () => {
    try {
      const response = await axios.get('/collections');
      setCollections(response.data);
    } catch (err) {
      console.error('Failed to fetch collections:', err);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await axios.get('/settings');
      const taxRateSetting = response.data.find((s: any) => s.key === 'tax_rate');
      if (taxRateSetting) {
        setTaxRate(parseFloat(taxRateSetting.value));
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post('/customers', newCustomer);
      setSelectedCustomer(response.data);
      setCustomers([...customers, response.data]);
      setShowNewCustomerForm(false);
      setNewCustomer({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zipCode: ''
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create customer');
    }
  };

  const handleAddProduct = (product: Product, quantity: number) => {
    const existingIndex = quoteItems.findIndex(item => item.product.id === product.id);

    if (existingIndex >= 0) {
      const updatedItems = [...quoteItems];
      updatedItems[existingIndex].quantity += quantity;
      updatedItems[existingIndex].total = updatedItems[existingIndex].quantity * Number(product.price);
      setQuoteItems(updatedItems);
    } else {
      setQuoteItems([
        ...quoteItems,
        {
          product,
          quantity,
          unitPrice: Number(product.price),
          total: quantity * Number(product.price)
        }
      ]);
    }
  };

  const handleUpdateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;

    const updatedItems = [...quoteItems];
    updatedItems[index].quantity = newQuantity;
    updatedItems[index].total = newQuantity * updatedItems[index].unitPrice;
    setQuoteItems(updatedItems);
  };

  const handleRemoveItem = (index: number) => {
    setQuoteItems(quoteItems.filter((_, i) => i !== index));
  };

  const calculateSubtotal = () => {
    return quoteItems.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * taxRate;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const calculateTotalMsrp = () => {
    return quoteItems.reduce((sum, item) => sum + (Number(item.product.msrp) * item.quantity), 0);
  };

  const calculateTotalSavings = () => {
    return calculateTotalMsrp() - calculateSubtotal();
  };

  const handleSaveQuote = async (status: 'DRAFT' | 'SENT' = 'DRAFT') => {
    if (!selectedCustomer || !selectedCollection || !selectedStyle || quoteItems.length === 0) {
      setError('Please complete all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const quoteData = {
        customerId: selectedCustomer.id,
        collectionId: selectedCollection.id,
        styleId: selectedStyle.id,
        items: quoteItems.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total
        })),
        subtotal: calculateSubtotal(),
        taxRate,
        taxAmount: calculateTax(),
        total: calculateTotal(),
        installationFee,
        miscExpenses,
        msrpTotal: calculateTotalMsrp(),
        status,
        notes
      };

      const response = await axios.post('/quotes', quoteData);
      navigate(`/quotes/${response.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create quote');
    } finally {
      setLoading(false);
    }
  };

  const canProceedToStep = (targetStep: number) => {
    if (targetStep === 2) return selectedCustomer !== null;
    if (targetStep === 3) return selectedCustomer && selectedCollection && selectedStyle;
    if (targetStep === 4) return selectedCustomer && selectedCollection && selectedStyle && quoteItems.length > 0;
    return true;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create New Quote</h1>
        <p className="text-gray-600 mt-2">Follow the steps below to create a new quote</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[
            { num: 1, label: 'Customer' },
            { num: 2, label: 'Collection & Style' },
            { num: 3, label: 'Products' },
            { num: 4, label: 'Review & Save' }
          ].map((stepInfo, index) => (
            <div key={stepInfo.num} className="flex items-center flex-1">
              <button
                onClick={() => canProceedToStep(stepInfo.num) && setStep(stepInfo.num)}
                disabled={!canProceedToStep(stepInfo.num)}
                className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
                  step === stepInfo.num
                    ? 'bg-blue-600 text-white'
                    : step > stepInfo.num
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-300 text-gray-600'
                } ${canProceedToStep(stepInfo.num) ? 'cursor-pointer' : 'cursor-not-allowed'}`}
              >
                {step > stepInfo.num ? '✓' : stepInfo.num}
              </button>
              <div className="ml-3">
                <div className={`text-sm font-medium ${step === stepInfo.num ? 'text-blue-600' : 'text-gray-600'}`}>
                  Step {stepInfo.num}
                </div>
                <div className="text-xs text-gray-500">{stepInfo.label}</div>
              </div>
              {index < 3 && (
                <div className={`flex-1 h-1 mx-4 ${step > stepInfo.num ? 'bg-green-600' : 'bg-gray-300'}`}></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Step 1: Customer Selection */}
      {step === 1 && (
        <div className="card">
          <h2 className="text-2xl font-bold mb-6">Select Customer</h2>

          {!showNewCustomerForm ? (
            <>
              <div className="mb-4">
                <label className="label">Existing Customer</label>
                <select
                  value={selectedCustomer?.id || ''}
                  onChange={(e) => {
                    const customer = customers.find(c => c.id === e.target.value);
                    setSelectedCustomer(customer || null);
                  }}
                  className="input"
                >
                  <option value="">Select a customer...</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.firstName} {customer.lastName} - {customer.email}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => setShowNewCustomerForm(true)}
                className="btn-secondary"
              >
                + Create New Customer
              </button>

              {selectedCustomer && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
                  <h3 className="font-semibold mb-2">Selected Customer:</h3>
                  <p>{selectedCustomer.firstName} {selectedCustomer.lastName}</p>
                  <p className="text-sm text-gray-600">{selectedCustomer.email}</p>
                  <p className="text-sm text-gray-600">{selectedCustomer.phone}</p>
                  {selectedCustomer.address && (
                    <p className="text-sm text-gray-600 mt-2">
                      {selectedCustomer.address}, {selectedCustomer.city}, {selectedCustomer.state} {selectedCustomer.zipCode}
                    </p>
                  )}
                </div>
              )}
            </>
          ) : (
            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">First Name *</label>
                  <input
                    type="text"
                    value={newCustomer.firstName}
                    onChange={(e) => setNewCustomer({ ...newCustomer, firstName: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Last Name *</label>
                  <input
                    type="text"
                    value={newCustomer.lastName}
                    onChange={(e) => setNewCustomer({ ...newCustomer, lastName: e.target.value })}
                    className="input"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Email *</label>
                  <input
                    type="email"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Phone *</label>
                  <input
                    type="tel"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    className="input"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">Address</label>
                <input
                  type="text"
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  className="input"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label">City</label>
                  <input
                    type="text"
                    value={newCustomer.city}
                    onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">State</label>
                  <input
                    type="text"
                    value={newCustomer.state}
                    onChange={(e) => setNewCustomer({ ...newCustomer, state: e.target.value })}
                    className="input"
                    maxLength={2}
                  />
                </div>
                <div>
                  <label className="label">Zip Code</label>
                  <input
                    type="text"
                    value={newCustomer.zipCode}
                    onChange={(e) => setNewCustomer({ ...newCustomer, zipCode: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button type="submit" className="btn-primary">
                  Create Customer
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewCustomerForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {selectedCustomer && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setStep(2)}
                className="btn-primary"
              >
                Next: Select Collection & Style →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Collection & Style */}
      {step === 2 && (
        <div className="card">
          <h2 className="text-2xl font-bold mb-6">Select Collection & Style</h2>

          <div className="space-y-6">
            <div>
              <label className="label">Cabinet Collection *</label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {collections.map(collection => (
                  <div
                    key={collection.id}
                    onClick={() => {
                      setSelectedCollection(collection);
                      setSelectedStyle(null);
                    }}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedCollection?.id === collection.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <h3 className="font-semibold text-lg">{collection.name}</h3>
                    {collection.description && (
                      <p className="text-sm text-gray-600 mt-2">{collection.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {selectedCollection && (
              <div>
                <label className="label">Cabinet Style *</label>
                {selectedCollection.styles && selectedCollection.styles.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedCollection.styles.map(style => (
                      <div
                        key={style.id}
                        onClick={() => setSelectedStyle(style)}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedStyle?.id === style.id
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <h3 className="font-semibold">{style.name}</h3>
                        {style.description && (
                          <p className="text-sm text-gray-600 mt-1">{style.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-yellow-700">
                    No styles available for this collection. Please contact an administrator to add styles.
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-between">
            <button onClick={() => setStep(1)} className="btn-secondary">
              ← Back
            </button>
            {selectedCollection && selectedStyle && (
              <button onClick={() => setStep(3)} className="btn-primary">
                Next: Add Products →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Products */}
      {step === 3 && (
        <div className="space-y-6">
          {/* Current Quote Items */}
          {quoteItems.length > 0 && (
            <div className="card">
              <h3 className="text-xl font-bold mb-4">Quote Items ({quoteItems.length})</h3>
              <div className="space-y-2">
                {quoteItems.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded border border-gray-200">
                    <div className="flex-1">
                      <div className="font-semibold text-blue-600">{item.product.itemCode}</div>
                      <div className="text-sm text-gray-600">{item.product.description}</div>
                    </div>
                    <div className="w-24">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleUpdateQuantity(index, parseInt(e.target.value))}
                        className="input text-center"
                      />
                    </div>
                    <div className="w-32 text-right">
                      <div className="text-sm text-gray-500">@ {formatPrice(item.unitPrice)}</div>
                      <div className="font-semibold text-green-600">{formatPrice(item.total)}</div>
                    </div>
                    <button
                      onClick={() => handleRemoveItem(index)}
                      className="text-red-600 hover:text-red-700 p-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between text-xl font-bold">
                  <span>Subtotal:</span>
                  <span className="text-green-600">{formatPrice(calculateSubtotal())}</span>
                </div>
              </div>
            </div>
          )}

          {/* Product Catalog */}
          <div className="card">
            <h3 className="text-xl font-bold mb-4">Add Products</h3>
            <ProductCatalog
              onAddProduct={handleAddProduct}
              selectedCollectionId={selectedCollection?.id}
            />
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(2)} className="btn-secondary">
              ← Back
            </button>
            {quoteItems.length > 0 && (
              <button onClick={() => setStep(4)} className="btn-primary">
                Next: Review & Save →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Step 4: Review & Save */}
      {step === 4 && (
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Review Quote</h2>
            <button
              onClick={() => setClientPreview(!clientPreview)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                clientPreview
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {clientPreview ? 'Client View' : 'Installer View'}
            </button>
          </div>

          {/* Customer Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded border border-gray-200">
            <h3 className="font-semibold mb-2">Customer</h3>
            <p>{selectedCustomer?.firstName} {selectedCustomer?.lastName}</p>
            <p className="text-sm text-gray-600">{selectedCustomer?.email} • {selectedCustomer?.phone}</p>
          </div>

          {/* Collection & Style */}
          <div className="mb-6 p-4 bg-gray-50 rounded border border-gray-200">
            <h3 className="font-semibold mb-2">Collection & Style</h3>
            <p>{selectedCollection?.name} - {selectedStyle?.name}</p>
          </div>

          {/* Quote Items */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Items</h3>
            <div className="space-y-2">
              {quoteItems.map((item, index) => {
                const msrp = Number(item.product.msrp);
                const savings = (msrp - item.unitPrice) * item.quantity;
                return (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div className="flex-1">
                      <div className="font-medium">{item.product.itemCode}</div>
                      <div className="text-sm text-gray-600">{item.product.description}</div>
                    </div>
                    <div className="text-right">
                      {clientPreview ? (
                        <>
                          <div className="text-sm text-gray-600">Qty: {item.quantity}</div>
                          <div className="font-semibold text-green-600">{formatPrice(item.total)}</div>
                        </>
                      ) : (
                        <>
                          <div className="text-xs text-gray-400 line-through">MSRP: {formatPrice(msrp * item.quantity)}</div>
                          <div className="text-sm text-gray-600">Qty: {item.quantity} @ {formatPrice(item.unitPrice)}</div>
                          <div className="font-semibold text-green-600">{formatPrice(item.total)}</div>
                          {savings > 0 && (
                            <div className="text-xs text-green-500">Save {formatPrice(savings)}</div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Installer Costing - Hidden in Client View */}
          {!clientPreview && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
              <h3 className="font-semibold mb-4 text-yellow-800">Installer Costing (Internal Only)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Installation Labor Fee</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={installationFee}
                    onChange={(e) => setInstallationFee(parseFloat(e.target.value) || 0)}
                    className="input"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="label">Miscellaneous Expenses</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={miscExpenses}
                    onChange={(e) => setMiscExpenses(parseFloat(e.target.value) || 0)}
                    className="input"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-yellow-300">
                <div className="flex justify-between text-yellow-800">
                  <span>Wholesale Cabinet Cost:</span>
                  <span className="font-semibold">{formatPrice(calculateSubtotal())}</span>
                </div>
                <div className="flex justify-between text-yellow-800">
                  <span>+ Installation Labor:</span>
                  <span className="font-semibold">{formatPrice(installationFee)}</span>
                </div>
                <div className="flex justify-between text-yellow-800">
                  <span>+ Misc Expenses:</span>
                  <span className="font-semibold">{formatPrice(miscExpenses)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-yellow-900 pt-2 border-t border-yellow-300 mt-2">
                  <span>Internal Total (Break-even):</span>
                  <span>{formatPrice(calculateSubtotal() + installationFee + miscExpenses)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Totals - Different views */}
          <div className={`mb-6 p-4 rounded border ${clientPreview ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'}`}>
            <div className="space-y-2">
              {clientPreview ? (
                <>
                  <div className="flex justify-between text-gray-500">
                    <span>Retail Market Value:</span>
                    <span className="line-through">{formatPrice(calculateTotalMsrp())}</span>
                  </div>
                  <div className="flex justify-between text-green-600 font-semibold">
                    <span>Your Savings:</span>
                    <span>{formatPrice(calculateTotalSavings())}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-blue-300">
                    <span>Cabinet Package:</span>
                    <span className="font-semibold">{formatPrice(calculateSubtotal())}</span>
                  </div>
                  {installationFee > 0 && (
                    <div className="flex justify-between">
                      <span>Professional Installation:</span>
                      <span className="font-semibold">{formatPrice(installationFee)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Tax ({(taxRate * 100).toFixed(2)}%):</span>
                    <span className="font-semibold">{formatPrice(calculateTax())}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold pt-2 border-t border-blue-300">
                    <span>Total Package:</span>
                    <span className="text-blue-600">{formatPrice(calculateTotal() + installationFee)}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between text-gray-500">
                    <span>MSRP Total:</span>
                    <span className="line-through">{formatPrice(calculateTotalMsrp())}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Wholesale Cost:</span>
                    <span className="font-semibold">{formatPrice(calculateSubtotal())}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Margin (MSRP - Wholesale):</span>
                    <span className="font-semibold">{formatPrice(calculateTotalSavings())}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-green-300">
                    <span>Tax ({(taxRate * 100).toFixed(2)}%):</span>
                    <span className="font-semibold">{formatPrice(calculateTax())}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold pt-2 border-t border-green-300">
                    <span>Client Total:</span>
                    <span className="text-green-600">{formatPrice(calculateTotal() + installationFee)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-green-700">
                    <span>Profit Margin:</span>
                    <span>{formatPrice(calculateTotal() + installationFee - calculateSubtotal() - installationFee - miscExpenses)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="label">Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input"
              rows={4}
              placeholder="Add any additional notes or special instructions..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-between">
            <button onClick={() => setStep(3)} className="btn-secondary">
              ← Back
            </button>
            <div className="flex gap-3">
              <button
                onClick={() => handleSaveQuote('DRAFT')}
                disabled={loading}
                className="btn-secondary"
              >
                {loading ? 'Saving...' : 'Save as Draft'}
              </button>
              <button
                onClick={() => handleSaveQuote('SENT')}
                disabled={loading}
                className="btn-primary"
              >
                {loading ? 'Saving...' : 'Save & Mark as Sent'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
