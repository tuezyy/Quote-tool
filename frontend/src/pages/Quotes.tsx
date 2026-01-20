import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../services/api';
import { Quote } from '../types';

export default function Quotes() {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/quotes');
      setQuotes(response.data.quotes || []);
      setError('');
    } catch (err: any) {
      setError('Failed to load quotes');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuote = async (quoteId: string) => {
    if (!confirm('Are you sure you want to delete this quote?')) {
      return;
    }

    try {
      await axios.delete(`/quotes/${quoteId}`);
      setQuotes(quotes.filter(q => q.id !== quoteId));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete quote');
    }
  };

  const handleDuplicateQuote = async (quoteId: string) => {
    try {
      const response = await axios.post(`/quotes/${quoteId}/duplicate`);
      navigate(`/quotes/${response.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to duplicate quote');
    }
  };

  const filteredQuotes = quotes.filter(quote => {
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      quote.quoteNumber.toLowerCase().includes(search) ||
      quote.customer?.firstName.toLowerCase().includes(search) ||
      quote.customer?.lastName.toLowerCase().includes(search) ||
      quote.customer?.email.toLowerCase().includes(search);

    const matchesStatus = statusFilter ? quote.status === statusFilter : true;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusStyles: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-800',
      SENT: 'bg-blue-100 text-blue-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quotes</h1>
          <p className="text-gray-600 mt-2">View and manage all quotes</p>
        </div>
        <button
          onClick={() => navigate('/quotes/new')}
          className="btn-primary"
        >
          + New Quote
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <input
          type="text"
          placeholder="Search by quote number, customer name, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input flex-1 max-w-md"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input w-40"
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="SENT">Sent</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* Quotes List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading quotes...</p>
        </div>
      ) : filteredQuotes.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">
            {searchTerm || statusFilter
              ? 'No quotes match your filters'
              : 'No quotes yet. Create your first quote to get started.'}
          </p>
          {!searchTerm && !statusFilter && (
            <button
              onClick={() => navigate('/quotes/new')}
              className="btn-primary mt-4"
            >
              Create First Quote
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuotes.map((quote) => (
            <div
              key={quote.id}
              className="card hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/quotes/${quote.id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-blue-600">{quote.quoteNumber}</h3>
                    {getStatusBadge(quote.status)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-gray-500">Customer</div>
                      <div className="font-medium">
                        {quote.customer?.firstName} {quote.customer?.lastName}
                      </div>
                      <div className="text-sm text-gray-600">{quote.customer?.email}</div>
                    </div>

                    <div>
                      <div className="text-sm text-gray-500">Collection & Style</div>
                      <div className="font-medium">{quote.collection?.name}</div>
                      <div className="text-sm text-gray-600">{quote.style?.name}</div>
                    </div>

                    <div>
                      <div className="text-sm text-gray-500">Date</div>
                      <div className="font-medium">{formatDate(quote.createdAt)}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div>
                      <span className="text-sm text-gray-500">Items: </span>
                      <span className="font-medium">{quote.items?.length || 0}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Total: </span>
                      <span className="font-bold text-green-600 text-lg">
                        {formatPrice(Number(quote.total))}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => navigate(`/quotes/${quote.id}`)}
                    className="btn-secondary text-sm py-2 px-3"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleDuplicateQuote(quote.id)}
                    className="btn-secondary text-sm py-2 px-3"
                    title="Duplicate quote"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteQuote(quote.id)}
                    className="text-red-600 hover:text-red-700 p-2"
                    title="Delete quote"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
