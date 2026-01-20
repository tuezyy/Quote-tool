import { useState, useEffect } from 'react';
import axios from '../services/api';
import { Product, Collection } from '../types';

interface ProductCatalogProps {
  onAddProduct?: (product: Product, quantity: number) => void;
  selectedCollectionId?: string;
}

export default function ProductCatalog({ onAddProduct, selectedCollectionId }: ProductCatalogProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Quantity modal state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);

  // Filters
  const [collectionFilter, setCollectionFilter] = useState(selectedCollectionId || '');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 24;

  // Categories (common across all collections)
  const categories = [
    'Base Cabinets',
    'Wall Cabinets',
    'Tall Cabinets',
    'Specialty Cabinets',
    'Vanity Cabinets'
  ];

  useEffect(() => {
    fetchCollections();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [collectionFilter, categoryFilter, searchTerm, page]);

  const fetchCollections = async () => {
    try {
      const response = await axios.get('/collections');
      setCollections(response.data);
    } catch (err: any) {
      setError('Failed to load collections');
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit };
      if (collectionFilter) params.collectionId = collectionFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (searchTerm) params.search = searchTerm;

      const response = await axios.get('/products', { params });
      setProducts(response.data.products);
      setTotalPages(response.data.pagination.totalPages);
      setError('');
    } catch (err: any) {
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = (product: Product) => {
    setSelectedProduct(product);
    setQuantity(1);
  };

  const handleConfirmAdd = () => {
    if (quantity > 0 && selectedProduct && onAddProduct) {
      onAddProduct(selectedProduct, quantity);
    }
    setSelectedProduct(null);
    setQuantity(1);
  };

  const handleCloseModal = () => {
    setSelectedProduct(null);
    setQuantity(1);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const resetFilters = () => {
    setCollectionFilter(selectedCollectionId || '');
    setCategoryFilter('');
    setSearchTerm('');
    setPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="Search by item code or description..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="input w-full"
            />
          </div>

          {/* Collection Filter */}
          <div>
            <select
              value={collectionFilter}
              onChange={(e) => {
                setCollectionFilter(e.target.value);
                setPage(1);
              }}
              className="input w-full"
              disabled={!!selectedCollectionId}
            >
              <option value="">All Collections</option>
              {collections.map((collection) => (
                <option key={collection.id} value={collection.id}>
                  {collection.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="input w-full"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Actions */}
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={resetFilters}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Reset Filters
          </button>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">View:</span>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading products...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500">No products found</p>
        </div>
      ) : (
        <>
          {/* Products Grid/List */}
          <div className={viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
            : 'space-y-2'
          }>
            {products.map((product) => (
              <div
                key={product.id}
                className={`bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all ${
                  viewMode === 'list' ? 'flex items-center p-3' : 'p-4'
                }`}
              >
                {viewMode === 'grid' ? (
                  <>
                    <div className="mb-3">
                      <div className="text-sm font-semibold text-blue-600">{product.itemCode}</div>
                      <div className="text-sm text-gray-600 mt-1">{product.category}</div>
                    </div>

                    <div className="mb-3">
                      <p className="text-sm text-gray-800 line-clamp-2">{product.description}</p>
                    </div>

                    {product.width && product.height && product.depth && (
                      <div className="text-xs text-gray-500 mb-3">
                        {product.width}"W × {product.height}"H × {product.depth}"D
                      </div>
                    )}

                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-xs text-gray-500">MSRP: {formatPrice(Number(product.msrp))}</div>
                        <div className="text-lg font-bold text-green-600">{formatPrice(Number(product.price))}</div>
                      </div>
                      {onAddProduct && (
                        <button
                          onClick={() => handleAddProduct(product)}
                          className="btn-primary text-sm py-1 px-3"
                        >
                          Add
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex-1 grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-2">
                        <div className="font-semibold text-blue-600">{product.itemCode}</div>
                      </div>
                      <div className="col-span-4">
                        <div className="text-sm text-gray-800">{product.description}</div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-sm text-gray-600">{product.category}</div>
                      </div>
                      {product.width && product.height && product.depth && (
                        <div className="col-span-2">
                          <div className="text-xs text-gray-500">
                            {product.width}"W × {product.height}"H × {product.depth}"D
                          </div>
                        </div>
                      )}
                      <div className="col-span-1 text-right">
                        <div className="text-sm font-bold text-green-600">{formatPrice(Number(product.price))}</div>
                      </div>
                      {onAddProduct && (
                        <div className="col-span-1 text-right">
                          <button
                            onClick={() => handleAddProduct(product)}
                            className="btn-primary text-sm py-1 px-3"
                          >
                            Add
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`px-3 py-1 rounded ${
                        page === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Quantity Input Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Add to Quote</h3>

            <div className="mb-4">
              <div className="text-sm font-semibold text-blue-600">{selectedProduct.itemCode}</div>
              <div className="text-sm text-gray-600 mt-1">{selectedProduct.description}</div>
              <div className="text-sm text-gray-500 mt-1">{selectedProduct.category}</div>
              <div className="mt-2">
                <span className="text-xs text-gray-400">MSRP: {formatPrice(Number(selectedProduct.msrp))}</span>
                <span className="ml-2 text-green-600 font-semibold">{formatPrice(Number(selectedProduct.price))}</span>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-12 h-12 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg text-xl font-semibold"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 h-12 text-center text-xl font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={() => setQuantity(q => q + 1)}
                  className="w-12 h-12 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg text-xl font-semibold"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCloseModal}
                className="flex-1 py-3 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAdd}
                className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                Add {quantity} to Quote
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
