const categoryRepository = require('../repositories/categoryRepository')
const { sendSuccess } = require('../utils/apiResponse')

async function listCategories(_req, res) {
  const categories = await categoryRepository.listCategories()

  return sendSuccess(res, {
    categories: categories.map((category) => ({
      categoryId: category.category_id,
      description: category.description,
      name: category.name,
    })),
  })
}

module.exports = {
  listCategories,
}
