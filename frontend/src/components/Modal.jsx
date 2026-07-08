import { X } from 'lucide-react'

import Button from './Button'

function Modal({ children, confirmLabel = 'Confirm', isOpen, onClose, onConfirm, title }) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section aria-modal="true" className="modal" role="dialog" aria-labelledby="modal-title">
        <div className="modal__header">
          <h2 id="modal-title">{title}</h2>
          <button aria-label="Close dialog" className="icon-button" onClick={onClose} type="button">
            <X size={20} />
          </button>
        </div>
        <div className="modal__body">{children}</div>
        <div className="modal__actions">
          <Button onClick={onClose} variant="ghost">
            Cancel
          </Button>
          <Button onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </section>
    </div>
  )
}

export default Modal
