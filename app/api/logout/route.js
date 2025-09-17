// app/api/auth/logout/route.js
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
  const cookieStore = await cookies()
  
  cookieStore.delete('jwt')
    cookieStore.delete('cartId')
  
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' })

  
  return response
}