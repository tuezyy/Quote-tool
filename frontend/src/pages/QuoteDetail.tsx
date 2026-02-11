import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../services/api';
import { Quote } from '../types';

export default function QuoteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [clientView, setClientView] = useState(false);

  useEffect(() => {
    if (id) {
      fetchQuote();
    }
  }, [id]);

  const fetchQuote = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/quotes/${id}`);
      setQuote(response.data);
      setError('');
    } catch (err: any) {
      setError('Failed to load quote');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!quote) return;

    setUpdating(true);
    try {
      const response = await axios.put(`/quotes/${quote.id}`, { status: newStatus });
      setQuote(response.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleDownloadPDF = async (forClient = false) => {
    if (!quote) return;

    try {
      const response = await axios.get(`/quotes/${quote.id}/pdf?clientView=${forClient}`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${quote.quoteNumber}${forClient ? '-client' : '-internal'}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError('Failed to download PDF');
    }
  };

  const handleSendEmail = async () => {
    if (!quote) return;

    try {
      await axios.post(`/quotes/${quote.id}/send`);
      alert('Quote sent successfully!');
      fetchQuote(); // Refresh to update status
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send email');
    }
  };

  const handleDelete = async () => {
    if (!quote || !confirm('Are you sure you want to delete this quote?')) return;

    try {
      await axios.delete(`/quotes/${quote.id}`);
      navigate('/quotes');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete quote');
    }
  };

  const handleDuplicate = async () => {
    if (!quote) return;

    try {
      const response = await axios.post(`/quotes/${quote.id}/duplicate`);
      navigate(`/quotes/${response.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to duplicate quote');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusStyles: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-800',
      SENT: 'bg-blue-100 text-blue-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-3 py-1 text-sm font-semibold rounded ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">Loading quote...</p>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500">Quote not found</p>
        <button onClick={() => navigate('/quotes')} className="btn-primary mt-4">
          Back to Quotes
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/quotes')}
          className="text-blue-600 hover:text-blue-700 mb-4 flex items-center"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Quotes
        </button>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{quote.quoteNumber}</h1>
              {getStatusBadge(quote.status)}
            </div>
            <p className="text-gray-600">Created {formatDate(quote.createdAt)}</p>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setClientView(!clientView)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                clientView
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {clientView ? 'Client View' : 'Installer View'}
            </button>
            <button onClick={() => handleDownloadPDF(false)} className="btn-secondary">
              Internal PDF
            </button>
            <button onClick={() => handleDownloadPDF(true)} className="btn-primary">
              Client PDF
            </button>
            <button onClick={handleSendEmail} className="btn-secondary">
              Send Email
            </button>
            <button onClick={handleDuplicate} className="btn-secondary">
              Duplicate
            </button>
            <button onClick={handleDelete} className="text-red-600 hover:text-red-700 px-3">
              Delete
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Status Update */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-4">Update Status</h2>
        <div className="flex gap-2">
          {['DRAFT', 'SENT', 'APPROVED', 'REJECTED'].map((status) => (
            <button
              key={status}
              onClick={() => handleUpdateStatus(status)}
              disabled={updating || quote.status === status}
              className={`px-4 py-2 rounded font-medium transition-colors ${
                quote.status === status
                  ? 'bg-blue-600 text-white cursor-default'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Customer & Collection Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Customer Information</h2>
          <div className="space-y-2">
            <div>
              <div className="text-sm text-gray-500">Name</div>
              <div className="font-medium">
                {quote.customer?.firstName} {quote.customer?.lastName}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Email</div>
              <div className="font-medium">{quote.customer?.email}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Phone</div>
              <div className="font-medium">{quote.customer?.phone}</div>
            </div>
            {quote.customer?.address && (
              <div>
                <div className="text-sm text-gray-500">Address</div>
                <div className="font-medium">
                  {quote.customer.address}<br />
                  {quote.customer.city}, {quote.customer.state} {quote.customer.zipCode}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Collection & Style</h2>
          <div className="space-y-2">
            <div>
              <div className="text-sm text-gray-500">Collection</div>
              <div className="font-medium">{quote.collection?.name}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Style</div>
              <div className="font-medium">{quote.style?.name}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quote Items */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-4">Items</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {quote.items?.map((item, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-blue-600">
                    {item.product?.itemCode}
                  </td>
                  <td className="px-6 py-4">
                    {item.product?.description}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {formatPrice(Number(item.unitPrice))}
                  </td>
                  <td className="px-6 py-4 text-right font-semibold">
                    {formatPrice(Number(item.total))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals */}
      {(() => {
        // Calculate values
        const wholesaleCost = Number(quote.subtotal);
        const cabinetPrice = Number(quote.clientCabinetPrice || quote.subtotal);
        const installFee = Number(quote.installationFee || 0);
        const miscFee = Number(quote.miscExpenses || 0);
        const clientSubtotal = cabinetPrice + installFee + miscFee;
        const baseCabinetMsrp = Number(quote.msrpTotal) || wholesaleCost * 1.5;

        // For customer display: Calculate "market value" MSRP that represents what
        // competitors (other GCs) would charge. This includes:
        // 1. Full cabinet MSRP (retail price)
        // 2. Installation at market rates (competitors charge ~50% more)
        // 3. Additional services at market rates
        const installationMarketRate = installFee * 1.5;
        const miscMarketRate = miscFee * 1.5;
        const fullMarketMsrp = baseCabinetMsrp + installationMarketRate + miscMarketRate;

        // Ensure MSRP is always at least 15% higher than what we charge
        const displayMsrp = Math.max(fullMarketMsrp, clientSubtotal * 1.15);
        const displaySavings = displayMsrp - clientSubtotal;
        const savingsPercent = displayMsrp > 0 ? Math.round((displaySavings / displayMsrp) * 100) : 0;

        const profit = clientSubtotal - wholesaleCost;
        const profitMargin = clientSubtotal > 0 ? (profit / clientSubtotal) * 100 : 0;
        const isProfitable = profit >= 0;

        return clientView ? (
          // CLIENT VIEW - Clean, sales-focused presentation (bundled pricing)
          <div className="card max-w-lg ml-auto bg-blue-50 border-blue-200">
            <h3 className="text-lg font-bold text-blue-800 mb-4">Your Quote Summary</h3>
            <div className="space-y-3">
              {/* Always show savings (guaranteed positive with market rate MSRP) */}
              <div className="bg-green-100 border border-green-300 rounded-lg p-3">
                <div className="flex justify-between text-gray-500 text-sm">
                  <span>Retail Market Value:</span>
                  <span className="line-through">{formatPrice(displayMsrp)}</span>
                </div>
                <div className="flex justify-between text-green-600 font-bold text-lg mt-1">
                  <span>You Save:</span>
                  <span>{formatPrice(displaySavings)} ({savingsPercent}% OFF)</span>
                </div>
              </div>
              <p className="text-xs text-blue-500 italic mt-2">
                Bundled pricing includes all services
              </p>

              <div className="border-t border-blue-200 pt-3 space-y-2">
                {/* Bundled price - no breakdown of installation/misc */}
                <div className="flex justify-between text-lg">
                  <span>Cabinet Package:</span>
                  <span className="font-semibold">{formatPrice(clientSubtotal)}</span>
                </div>
                <div className="flex justify-between text-lg">
                  <span>Tax ({(Number(quote.taxRate) * 100).toFixed(2)}%):</span>
                  <span className="font-semibold">{formatPrice(Number(quote.taxAmount))}</span>
                </div>
              </div>
              <div className="flex justify-between text-2xl font-bold pt-3 border-t border-blue-300">
                <span>Total:</span>
                <span className="text-blue-700">{formatPrice(Number(quote.total))}</span>
              </div>
            </div>
          </div>
        ) : (
          // INSTALLER VIEW - Full cost breakdown with profit analysis
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl ml-auto">
            {/* OUR COST - What we pay */}
            <div className="card bg-red-50 border-red-200">
              <h3 className="text-lg font-bold text-red-800 mb-4">OUR COST (What We Pay)</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-lg">
                  <span className="text-gray-700">Wholesale Cabinet Cost:</span>
                  <span className="font-semibold">{formatPrice(wholesaleCost)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-red-300 text-lg font-bold text-red-700">
                  <span>Our Total Cost:</span>
                  <span>{formatPrice(wholesaleCost)}</span>
                </div>
                <p className="text-sm text-red-600 italic">This is what we pay. Everything we charge above this is profit.</p>
              </div>
            </div>

            {/* WHAT WE CHARGE - Customer pricing */}
            <div className="card bg-green-50 border-green-200">
              <h3 className="text-lg font-bold text-green-800 mb-4">WHAT WE CHARGE (Customer Pays)</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-gray-500">
                  <span>MSRP Total:</span>
                  <span className="line-through">{formatPrice(baseCabinetMsrp)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Cabinet Price:</span>
                  <span className="font-semibold">{formatPrice(cabinetPrice)}</span>
                </div>
                {installFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-700">Installation Fee:</span>
                    <span className="font-semibold">{formatPrice(installFee)}</span>
                  </div>
                )}
                {miscFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-700">Misc/Other Fees:</span>
                    <span className="font-semibold">{formatPrice(miscFee)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-green-200">
                  <span className="text-gray-700">Subtotal:</span>
                  <span className="font-semibold">{formatPrice(clientSubtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Tax ({(Number(quote.taxRate) * 100).toFixed(2)}%):</span>
                  <span className="font-semibold">{formatPrice(Number(quote.taxAmount))}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-green-300 text-lg font-bold text-green-700">
                  <span>Client Total:</span>
                  <span>{formatPrice(Number(quote.total))}</span>
                </div>
              </div>
            </div>

            {/* PROFIT SUMMARY */}
            <div className={`card md:col-span-2 ${isProfitable ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'}`}>
              <h3 className={`text-lg font-bold mb-4 ${isProfitable ? 'text-green-800' : 'text-red-800'}`}>
                PROFIT SUMMARY {isProfitable ? '' : '- QUOTING BELOW COST!'}
              </h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-sm text-gray-600">We Charge (before tax)</div>
                  <div className="text-xl font-bold text-green-700">{formatPrice(clientSubtotal)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Our Wholesale Cost</div>
                  <div className="text-xl font-bold text-red-700">{formatPrice(wholesaleCost)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Your Profit</div>
                  <div className={`text-xl font-bold ${isProfitable ? 'text-green-700' : 'text-red-700'}`}>
                    {isProfitable ? '' : '-'}{formatPrice(Math.abs(profit))} ({profitMargin.toFixed(1)}%)
                  </div>
                </div>
              </div>
              {!isProfitable && (
                <div className="mt-4 p-3 bg-red-200 rounded-lg text-red-800 text-center font-medium">
                  You are losing {formatPrice(Math.abs(profit))} on this quote. Consider raising the prices.
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Notes */}
      {quote.notes && (
        <div className="card mt-6">
          <h2 className="text-lg font-semibold mb-3">Notes</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{quote.notes}</p>
        </div>
      )}
    </div>
  );
}
