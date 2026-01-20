export interface User {
  id: string
  email: string
  fullname: string
  role: 'INSTALLER' | 'ADMIN'
}

export interface Collection {
  id: string
  name: string
  description?: string
  styles?: Style[]
  _count?: {
    products: number
  }
}

export interface Style {
  id: string
  collectionId: string
  code: string
  name: string
  description?: string
  collection?: Collection
}

export interface Product {
  id: string
  collectionId: string
  itemCode: string
  description: string
  category: string
  width?: number
  height?: number
  depth?: number
  doors?: string
  msrp: number
  price: number
  collection?: Collection
}

export interface Customer {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  createdAt: string
  updatedAt: string
}

export interface Quote {
  id: string
  quoteNumber: string
  customerId: string
  userId: string
  collectionId: string
  styleId: string
  subtotal: number
  taxRate: number
  taxAmount: number
  total: number
  status: 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED'
  notes?: string
  createdAt: string
  updatedAt: string
  sentAt?: string
  expiresAt?: string
  customer?: Customer
  user?: User
  collection?: Collection
  style?: Style
  items?: QuoteItem[]
  _count?: {
    items: number
  }
}

export interface QuoteItem {
  id: string
  quoteId: string
  productId: string
  quantity: number
  unitPrice: number
  lineTotal: number
  total: number
  roomName?: string
  notes?: string
  product?: Product
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  fullname: string
  role?: 'INSTALLER' | 'ADMIN'
}
