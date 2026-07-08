import { useEffect } from 'react'

const baseDescription = 'CultivaX agricultural marketplace MVP for Buea Municipality.'

function PageTitle({ description = baseDescription, title }) {
  useEffect(() => {
    document.title = title ? `${title} | CultivaX` : 'CultivaX'

    let metaDescription = document.querySelector('meta[name="description"]')
    if (!metaDescription) {
      metaDescription = document.createElement('meta')
      metaDescription.setAttribute('name', 'description')
      document.head.append(metaDescription)
    }

    metaDescription.setAttribute('content', description)
  }, [description, title])

  return null
}

export default PageTitle
