import PlaceholderPage from './PlaceholderPage'
import PageTitle from './PageTitle'

function RoutePlaceholderPage({ description, title }) {
  return (
    <>
      <PageTitle title={title} description={description} />
      <PlaceholderPage title={title} description={description} />
    </>
  )
}

export default RoutePlaceholderPage
