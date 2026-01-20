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
      <div className={`card max-w-lg ml-auto ${clientView ? 'bg-blue-50 border-blue-200' : ''}`}>
        <div className="space-y-3">
          {clientView ? (
            <>
              {/* Client View - Value Focused */}
              <div className="flex justify-between text-gray-500">
                <span>Retail Market Value:</span>
                <span className="line-through">{formatPrice(Number((quote as any).msrpTotal) || Number(quote.subtotal) * 1.5)}</span>
              </div>
              <div className="flex justify-between text-green-600 font-semibold">
                <span>Your Savings:</span>
                <span>{formatPrice((Number((quote as any).msrpTotal) || Number(quote.subtotal) * 1.5) - Number(quote.subtotal))}</span>
              </div>
              <div className="flex justify-between text-lg pt-2 border-t border-blue-300">
                <span>Cabinet Package:</span>
                <span className="font-semibold">{formatPrice(Number(quote.subtotal))}</span>
              </div>
              {Number((quote as any).installationFee) > 0 && (
                <div className="flex justify-between text-lg">
                  <span>Professional Installation:</span>
                  <span className="font-semibold">{formatPrice(Number((quote as any).installationFee))}</span>
                </div>
              )}
              <div className="flex justify-between text-lg">
                <span>Tax ({(Number(quote.taxRate) * 100).toFixed(2)}%):</span>
                <span className="font-semibold">{formatPrice(Number(quote.taxAmount))}</span>
              </div>
              <div className="flex justify-between text-2xl font-bold pt-3 border-t border-blue-300">
                <span>Total Package:</span>
                <span className="text-blue-600">{formatPrice(Number(quote.total) + Number((quote as any).installationFee || 0))}</span>
              </div>
            </>
          ) : (
            <>
              {/* Installer View - Full Cost Breakdown */}
              <div className="flex justify-between text-gray-500">
                <span>MSRP Total:</span>
                <span className="line-through">{formatPrice(Number((quote as any).msrpTotal) || Number(quote.subtotal) * 1.5)}</span>
              </div>
              <div className="flex justify-between text-lg">
                <span>Wholesale Cost:</span>
                <span className="font-semibold">{formatPrice(Number(quote.subtotal))}</span>
              </div>
              {Number((quote as any).installationFee) > 0 && (
                <div className="flex justify-between text-lg">
                  <span>Installation Labor:</span>
                  <span className="font-semibold">{formatPrice(Number((quote as any).installationFee))}</span>
                </div>
              )}
              {Number((quote as any).miscExpenses) > 0 && (
                <div className="flex justify-between text-lg">
                  <span>Misc Expenses:</span>
                  <span className="font-semibold">{formatPrice(Number((quote as any).miscExpenses))}</span>
                </div>
              )}
              <div className="flex justify-between text-lg pt-2 border-t border-gray-200">
                <span>Internal Total:</span>
                <span className="font-semibold">{formatPrice(Number(quote.subtotal) + Number((quote as any).installationFee || 0) + Number((quote as any).miscExpenses || 0))}</span>
              </div>
              <div className="flex justify-between text-lg">
                <span>Tax ({(Number(quote.taxRate) * 100).toFixed(2)}%):</span>
                <span className="font-semibold">{formatPrice(Number(quote.taxAmount))}</span>
              </div>
              <div className="flex justify-between text-2xl font-bold pt-3 border-t border-gray-300">
                <span>Client Total:</span>
                <span className="text-green-600">{formatPrice(Number(quote.total) + Number((quote as any).installationFee || 0))}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-green-700">
                <span>Profit Margin:</span>
                <span>{formatPrice(Number(quote.total) - Number(quote.subtotal) - Number((quote as any).miscExpenses || 0))}</span>
              </div>
            </>
          )}
        </div>
      </div>

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
