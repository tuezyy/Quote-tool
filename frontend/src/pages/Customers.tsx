import { useState, useEffect } from 'react';
import axios from '../services/api';
import { Customer } from '../types';

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: ''
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/customers');
      setCustomers(response.data);
      setError('');
    } catch (err: any) {
      setError('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        address: customer.address || '',
        city: customer.city || '',
        state: customer.state || '',
        zipCode: customer.zipCode || ''
      });
    } else {
      setEditingCustomer(null);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zipCode: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCustomer(null);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (editingCustomer) {
        const response = await axios.put(`/api/customers/${editingCustomer.id}`, formData);
        setCustomers(customers.map(c => c.id === editingCustomer.id ? response.data : c));
      } else {
        const response = await axios.post('/api/customers', formData);
        setCustomers([...customers, response.data]);
      }
      handleCloseModal();
    } catch (err: any) {
      setError(err.response?.data?.error || `Failed to ${editingCustomer ? 'update' : 'create'} customer`);
    }
  };

  const handleDelete = async (customer: Customer) => {
    if (!confirm(`Are you sure you want to delete ${customer.firstName} ${customer.lastName}?`)) {
      return;
    }

    try {
      await axios.delete(`/api/customers/${customer.id}`);
      setCustomers(customers.filter(c => c.id !== customer.id));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete customer');
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const search = searchTerm.toLowerCase();
    return (
      customer.firstName.toLowerCase().includes(search) ||
      customer.lastName.toLowerCase().includes(search) ||
      customer.email.toLowerCase().includes(search) ||
      customer.phone.includes(search)
    );
  });

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600 mt-2">Manage your customer database</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn-primary">
          + New Customer
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search customers by name, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input w-full max-w-md"
        />
      </div>

      {/* Customers Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading customers...</p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">
            {searchTerm ? 'No customers match your search' : 'No customers yet. Create your first customer to get started.'}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {customer.firstName} {customer.lastName}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{customer.email}</div>
                      <div className="text-sm text-gray-500">{customer.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      {customer.address ? (
                        <div className="text-sm text-gray-900">
                          {customer.address}<br />
                          {customer.city}, {customer.state} {customer.zipCode}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400">No address</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleOpenModal(customer)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(customer)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">
                  {editingCustomer ? 'Edit Customer' : 'New Customer'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">First Name *</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Last Name *</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
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
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Phone *</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="input"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="input"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="label">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">State</label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="input"
                      maxLength={2}
                      placeholder="CA"
                    />
                  </div>
                  <div>
                    <label className="label">Zip Code</label>
                    <input
                      type="text"
                      value={formData.zipCode}
                      onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="submit" className="btn-primary flex-1">
                    {editingCustomer ? 'Update Customer' : 'Create Customer'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
