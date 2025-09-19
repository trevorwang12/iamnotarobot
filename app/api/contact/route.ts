import { NextRequest, NextResponse } from 'next/server'

interface ContactMessage {
  id: string
  name: string
  email: string
  subject: string
  message: string
  timestamp: string
  status: 'new' | 'read' | 'replied'
  ipAddress?: string
  userAgent?: string
}

// 内存中的联系消息数据，服务重启后会恢复默认值
let contactMessages: ContactMessage[] = []


async function cleanupOldMessages(messages: ContactMessage[]): Promise<ContactMessage[]> {
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
  const twoMonthsAgo = Date.now() - 60 * 24 * 60 * 60 * 1000
  
  return messages.filter(msg => {
    const messageTime = new Date(msg.timestamp).getTime()
    
    // Keep all messages from last 30 days
    if (messageTime > thirtyDaysAgo) return true
    
    // Keep only replied messages from 30 days to 2 months
    if (messageTime > twoMonthsAgo && msg.status === 'replied') return true
    
    // Delete everything older than policy allows
    return false
  })
}

// POST - Submit a new contact message
export async function POST(request: NextRequest) {
  try {
    const { name, email, subject, message } = await request.json()

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Rate limiting - simple check for spam (same email within 5 minutes)
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
    const recentMessagesFromEmail = contactMessages.filter(
      msg => msg.email === email && 
      new Date(msg.timestamp).getTime() > fiveMinutesAgo
    )

    if (recentMessagesFromEmail.length >= 3) {
      return NextResponse.json(
        { error: 'Too many messages sent recently. Please wait before sending another message.' },
        { status: 429 }
      )
    }

    // Create new message
    const newMessage: ContactMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
      timestamp: new Date().toISOString(),
      status: 'new',
      ipAddress: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    }

    // Add to messages array
    contactMessages.unshift(newMessage) // Add to beginning for latest first

    // Cleanup old messages
    const cleanedMessages = await cleanupOldMessages(contactMessages)
    
    // Keep only last 1000 messages to prevent memory from growing too large
    contactMessages = cleanedMessages.slice(0, 1000)

    // In a real application, you would also:
    // 1. Send email notification to admin
    // 2. Send confirmation email to user
    // 3. Log to monitoring service
    
    console.log('New contact message received:', {
      id: newMessage.id,
      name: newMessage.name,
      email: newMessage.email,
      subject: newMessage.subject,
      timestamp: newMessage.timestamp
    })

    return NextResponse.json({
      success: true,
      message: 'Your message has been sent successfully. We will get back to you soon.',
      messageId: newMessage.id
    })

  } catch (error) {
    console.error('Error processing contact form:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - Retrieve contact messages (admin only)
export async function GET(request: NextRequest) {
  try {
    // Simple admin check - you should implement proper authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || authHeader !== 'Bearer admin-token-here') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Periodic cleanup (run cleanup on admin access)
    const originalLength = contactMessages.length
    const cleanedMessages = await cleanupOldMessages(contactMessages)
    if (cleanedMessages.length !== originalLength) {
      contactMessages = cleanedMessages
      console.log(`Cleaned up ${originalLength - cleanedMessages.length} old messages`)
    }
    
    // Optional filtering by status
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const filteredMessages = status 
      ? contactMessages.filter(msg => msg.status === status)
      : contactMessages

    return NextResponse.json({
      messages: filteredMessages,
      total: contactMessages.length,
      filtered: filteredMessages.length
    })

  } catch (error) {
    console.error('Error retrieving contact messages:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve messages' },
      { status: 500 }
    )
  }
}

// DELETE - Manual cleanup (admin only)
export async function DELETE(request: NextRequest) {
  try {
    // Simple admin check
    const authHeader = request.headers.get('authorization')
    if (!authHeader || authHeader !== 'Bearer admin-token-here') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const originalCount = contactMessages.length
    const cleanedMessages = await cleanupOldMessages(contactMessages)
    
    if (cleanedMessages.length !== originalCount) {
      contactMessages = cleanedMessages
      const deletedCount = originalCount - cleanedMessages.length
      
      return NextResponse.json({
        success: true,
        message: `Successfully cleaned up ${deletedCount} old messages`,
        deletedCount,
        remainingCount: cleanedMessages.length
      })
    } else {
      return NextResponse.json({
        success: true,
        message: 'No old messages to clean up',
        deletedCount: 0,
        remainingCount: contactMessages.length
      })
    }

  } catch (error) {
    console.error('Error during manual cleanup:', error)
    return NextResponse.json(
      { error: 'Failed to cleanup messages' },
      { status: 500 }
    )
  }
}

// PUT - Update message status (admin only)
export async function PUT(request: NextRequest) {
  try {
    // Simple admin check
    const authHeader = request.headers.get('authorization')
    if (!authHeader || authHeader !== 'Bearer admin-token-here') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { messageId, status } = await request.json()

    if (!messageId || !status || !['new', 'read', 'replied'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid messageId or status' },
        { status: 400 }
      )
    }

    const messageIndex = contactMessages.findIndex(msg => msg.id === messageId)

    if (messageIndex === -1) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      )
    }

    contactMessages[messageIndex].status = status

    return NextResponse.json({
      success: true,
      message: 'Message status updated successfully'
    })

  } catch (error) {
    console.error('Error updating message status:', error)
    return NextResponse.json(
      { error: 'Failed to update message status' },
      { status: 500 }
    )
  }
}