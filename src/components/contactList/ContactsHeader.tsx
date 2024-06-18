import { useState } from 'react'
import Button from '../Button'
import Input from '../Input'
import styles from './contactList.module.scss'
import UserPlus from '@geist-ui/icons/userPlus'

const ContactsHeader = ({
  onAddContact,
}: {
  onAddContact: (contactName: string) => Promise<unknown>
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')

  const handleAddContact = () => {
    onAddContact(inputValue)
      .then(() => {
        setIsOpen(false)
      })
      .catch(() => {
        console.error('something went wrong when adding new contact')
        setIsOpen(false)
      }) // TODO: Show toast
    setInputValue('')
  }
  if (!isOpen) {
    return (
      <div className={styles.header}>
        Chats
        <Button
          empty
          onClick={() => {
            setIsOpen(true)
          }}
        >
          <UserPlus size={16} />
        </Button>
      </div>
    )
  }

  return (
    <div className={styles.headerWithInput}>
      <Input
        value={inputValue}
        placeholder="Contact name"
        outlined
        onCancel={() => {
          setIsOpen(false)
        }}
        onChange={(e) => {
          setInputValue(e.target.value)
        }}
        type="text"
      />
      <Button
        color="secondary"
        onClick={() => {
          handleAddContact()
        }}
      >
        Add
      </Button>
    </div>
  )
}

export default ContactsHeader
