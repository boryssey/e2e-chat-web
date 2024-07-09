import {
  DetailedHTMLProps,
  TextareaHTMLAttributes,
  useEffect,
  useRef,
} from 'react'
import styles from './textArea.module.scss'

type TextAreaProps = DetailedHTMLProps<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  HTMLTextAreaElement
>

const TextArea = (props: TextAreaProps) => {
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const resizeTextArea = () => {
      if (ref.current) {
        ref.current.style.height = 'auto'
        console.log(ref.current.scrollHeight)
        if (ref.current.scrollHeight < 112) {
          ref.current.style.height = `${ref.current.scrollHeight + 2}px`
          if (ref.current.style.overflowY !== 'hidden') {
            ref.current.style.overflowY = 'hidden'
          }
          return
        }
        ref.current.style.height = '114px'
        if (ref.current.style.overflowY !== 'auto') {
          ref.current.style.overflowY = 'auto'
        }
      }
    }
    const currentRef = ref.current
    currentRef?.addEventListener('input', resizeTextArea)
    resizeTextArea()

    window.addEventListener('resize', resizeTextArea)
    return () => {
      currentRef?.removeEventListener('input', resizeTextArea)
      window.addEventListener('resize', resizeTextArea)
    }
  }, [])
  return <textarea ref={ref} rows={1} className={styles.container} {...props} />
}

export default TextArea
