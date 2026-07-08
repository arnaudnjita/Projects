export function isUnavailableCompareError(error) {
  return error?.status === 404 || error?.code === 'PRODUCTS_UNAVAILABLE'
}

export function comparisonRows(products) {
  return [
    { key: 'image', label: 'Image', type: 'image' },
    { key: 'name', label: 'Product', values: products.map((product) => product.name) },
    { key: 'category', label: 'Category', values: products.map((product) => product.category?.name || 'Produce') },
    { key: 'price', label: 'Price', type: 'price' },
    { key: 'quantity', label: 'Quantity', values: products.map((product) => `${Number(product.quantityAvailable).toLocaleString()} ${product.unit}`) },
    { key: 'farmer', label: 'Farmer', values: products.map((product) => product.farmer?.name || 'Farmer') },
    { key: 'location', label: 'Location', values: products.map((product) => product.farmer?.farmLocation || product.farmer?.accountLocation || 'Buea') },
    { key: 'createdAt', label: 'Date added', type: 'date' },
  ]
}
