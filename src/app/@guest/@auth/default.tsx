import { redirect } from 'next/navigation'

export default function DefaultAuthPage() {
  // console.log('auth default page called')
  console.log('redirect to login')
  redirect('/login')
}
