export const queryKeys = {
  auth: {
    me: ['auth', 'me'],
  },
  categories: {
    all: ['categories'],
  },
  products: {
    all: ['products'],
    compare: (ids) => ['products', 'compare', ids],
    detail: (productId) => ['products', 'detail', productId],
    farmerList: (filters = {}) => ['farmer', 'products', filters],
    list: (filters = {}) => ['products', 'list', filters],
    recent: ['products', 'recent'],
  },
  profile: {
    farmer: ['farmer', 'profile'],
  },
}
