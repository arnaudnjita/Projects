import { useState } from 'react'

import Button from '../components/Button'
import { Badge, Card, EmptyState, ErrorState, Skeleton, Spinner, ToastRegion } from '../components/Feedback'
import { FormField, PasswordInput, Select, Textarea, TextInput } from '../components/FormControls'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import ResponsiveImage from '../components/ResponsiveImage'

function ShellPreviewPage() {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <div className="stack stack--large">
      <section className="intro-panel" aria-labelledby="shell-title">
        <div>
          <Badge tone="accent">MVP shell</Badge>
          <h1 id="shell-title">CultivaX development environment is running</h1>
          <p>
            The frontend now has design tokens, layout, navigation, and reusable UI building blocks ready for feature
            pages.
          </p>
        </div>
        <div className="intro-panel__actions">
          <Button>Primary action</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Text action</Button>
        </div>
      </section>

      <section className="component-grid" aria-label="Design system preview">
        <Card>
          <div className="stack">
            <h2>Form controls</h2>
            <FormField label="Phone number" helperText="Use your WhatsApp number if possible.">
              <TextInput placeholder="+2376XXXXXXXX" />
            </FormField>
            <FormField label="Password" error="Password must include a letter and a number.">
              <PasswordInput placeholder="Enter password" />
            </FormField>
            <FormField label="Category">
              <Select defaultValue="">
                <option value="" disabled>
                  Choose category
                </option>
                <option>Vegetables</option>
                <option>Fruits</option>
              </Select>
            </FormField>
            <FormField label="Description">
              <Textarea placeholder="Short listing description" />
            </FormField>
          </div>
        </Card>

        <Card>
          <div className="stack">
            <h2>Content states</h2>
            <Spinner label="Loading listings" />
            <Skeleton />
            <EmptyState title="No products yet" message="Listings will appear here after farmers publish produce." />
            <ErrorState title="Could not load" message="Check your connection and try again." />
          </div>
        </Card>

        <Card>
          <div className="stack">
            <h2>Media and dialogs</h2>
            <ResponsiveImage
              alt="Fresh produce placeholder"
              src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 360'%3E%3Crect width='640' height='360' fill='%23F7F8F4'/%3E%3Ccircle cx='252' cy='186' r='86' fill='%23F28C28'/%3E%3Cpath d='M322 135c66 4 110 47 125 104-70 23-138 4-172-46 8-23 23-42 47-58z' fill='%23123F2D'/%3E%3C/svg%3E"
            />
            <Pagination page={1} pageCount={4} />
            <Button onClick={() => setModalOpen(true)} variant="secondary">
              Open dialog
            </Button>
          </div>
        </Card>
      </section>

      <ToastRegion toasts={[{ id: 'sample', message: 'Design system components are ready.' }]} />

      <Modal
        confirmLabel="Continue"
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={() => setModalOpen(false)}
        title="Confirm action"
      >
        <p>This dialog component is ready for future confirmation flows.</p>
      </Modal>
    </div>
  )
}

export default ShellPreviewPage
