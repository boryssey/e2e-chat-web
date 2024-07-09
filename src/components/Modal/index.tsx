import { createContext, useContext, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import styles from './modal.module.scss'
type ShowModal = (
  props: {
    title: string | React.ReactNode
    content: React.ReactNode
    confirmButtonText?: string
    onConfirm?: () => void
    cancelButtonText?: string
    onCancel?: () => void
  },
  targetElement?: HTMLElement | null
) => void

interface IModalContext {
  showModal: ShowModal
  hideModal: () => void
  isModalOpen: boolean
  targetElement?: HTMLElement | null
  modalContent: {
    title: string | React.ReactNode
    content: React.ReactNode
    confirmButtonText?: string
    onConfirm?: () => void
    cancelButtonText?: string
    onCancel?: () => void
  } | null
}

const ModalContext = createContext<IModalContext | null>(null)

export const useModal = () => {
  const modalContext = useContext(ModalContext)
  if (!modalContext) {
    throw new Error('useModal must be used within a ModalProvider')
  }
  const { showModal, hideModal } = modalContext
  return { showModal, hideModal }
}

const useModalData = () => {
  const modalContext = useContext(ModalContext)
  if (!modalContext) {
    throw new Error('useModalData must be used within a ModalProvider')
  }

  return modalContext
}

export const ModalProvider = ({ children }: { children: React.ReactNode }) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [targetElement, setTargetElement] = useState<HTMLElement | null>()
  const [modalContent, setModalContent] =
    useState<IModalContext['modalContent']>(null)

  const showModal: ShowModal = (props, targetElement) => {
    setModalContent(props)
    setIsModalOpen(true)
    setTargetElement(targetElement)
  }

  const hideModal = () => {
    setIsModalOpen(false)
    setModalContent(null)
    setTargetElement(null)
  }

  return (
    <ModalContext.Provider
      value={{
        targetElement,
        showModal,
        hideModal,
        isModalOpen,
        modalContent,
      }}
    >
      {children}
    </ModalContext.Provider>
  )
}

const Modal = () => {
  const { targetElement, isModalOpen, modalContent } = useModalData()
  const modalRef = useRef<HTMLDivElement>(null)

  if (!isModalOpen || !modalContent) {
    return null
  }

  const {
    title,
    content,
    confirmButtonText,
    cancelButtonText,
    onConfirm,
    onCancel,
  } = modalContent

  const onOverlayClick = () => {
    onCancel?.()
  }

  return createPortal(
    <div className={styles.backdrop} onClick={onOverlayClick}>
      <div role="dialog" ref={modalRef} className={styles.container}>
        <div className={styles.body}>
          {title && typeof title === 'string' ? <h2>{title}</h2> : title}
          {content && typeof content === 'string' ? <p>{content}</p> : content}
        </div>
        <div className={styles.actions}>
          {cancelButtonText && onCancel && (
            <button className={styles.button} onClick={onCancel}>
              {cancelButtonText}
            </button>
          )}
          {confirmButtonText && onConfirm && (
            <button className={styles.confirmButton} onClick={onConfirm}>
              {confirmButtonText}
            </button>
          )}
        </div>
      </div>
    </div>,
    targetElement ?? document.body
  )
}

export default Modal
