
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all budget requests
    const requests = await prisma.budgetRequest.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        companyName: true,
        contactName: true,
        email: true,
        phone: true,
        projectType: true,
        location: true,
        services: true,
        status: true,
        priority: true,
        createdAt: true,
      }
    })

    // Calculate stats
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))

    const stats = {
      totalRequests: requests.length,
      pendingRequests: requests.filter(r => r.status === 'pending').length,
      thisMonthRequests: requests.filter(r => new Date(r.createdAt) >= startOfMonth).length,
      thisWeekRequests: requests.filter(r => new Date(r.createdAt) >= startOfWeek).length,
    }

    return NextResponse.json({
      requests,
      stats
    })
  } catch (error) {
    console.error('Dashboard API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
