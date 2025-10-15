import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { businessId: string; id: string } }
) {
  try {
    const { businessId, id } = params
    
    console.log('🟡 Deleting exception:', id, 'for business:', businessId)

    // Delete the specific exception
    const result = await query(
      'DELETE FROM availability_exceptions WHERE id = $1 AND business_id = $2',
      [id, businessId]
    )

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Exception not found' }, { status: 404 })
    }

    console.log('🟢 Deleted exception', id, 'for business', businessId)

    return NextResponse.json({ 
      success: true,
      message: 'Exception deleted successfully'
    })

  } catch (error) {
    console.error('Exception deletion error:', error)
    return NextResponse.json({ error: 'Failed to delete exception' }, { status: 500 })
  }
}