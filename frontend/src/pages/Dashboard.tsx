import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

export default function Dashboard() {
  const { user } = useAuthStore()

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Welcome, {user?.fullName}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          to="/quotes/new"
          className="card hover:shadow-lg transition-shadow duration-200 cursor-pointer"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">
                Create New Quote
              </h3>
              <p className="text-sm text-gray-500">
                Start a new cabinet quote
              </p>
            </div>
          </div>
        </Link>

        <Link
          to="/quotes"
          className="card hover:shadow-lg transition-shadow duration-200 cursor-pointer"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-green-500 text-white">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">View Quotes</h3>
              <p className="text-sm text-gray-500">Browse all quotes</p>
            </div>
          </div>
        </Link>

        <Link
          to="/customers"
          className="card hover:shadow-lg transition-shadow duration-200 cursor-pointer"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-purple-500 text-white">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">
                Customers
              </h3>
              <p className="text-sm text-gray-500">Manage customer list</p>
            </div>
          </div>
        </Link>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Getting Started
        </h2>
        <div className="card">
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Navigate to "New Quote" to create your first quote</li>
            <li>Select a cabinet collection and style</li>
            <li>Add products to your quote</li>
            <li>Enter customer information</li>
            <li>Generate and download the PDF quote</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
