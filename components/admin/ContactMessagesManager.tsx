"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mail, Clock, Check, Reply, Trash2, Eye, RefreshCw, Archive } from "lucide-react"

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

export default function ContactMessagesManager() {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [selectedTab, setSelectedTab] = useState('all')
  const [cleanupLoading, setCleanupLoading] = useState(false)

  useEffect(() => {
    loadMessages()
  }, [])

  const loadMessages = async () => {
    try {
      const response = await fetch('/api/contact', {
        headers: {
          'Authorization': 'Bearer admin-token-here' // In real app, use proper auth
        }
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      } else {
        console.error('Failed to load messages')
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateMessageStatus = async (messageId: string, status: 'new' | 'read' | 'replied') => {
    setUpdating(messageId)
    try {
      const response = await fetch('/api/contact', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token-here'
        },
        body: JSON.stringify({ messageId, status })
      })

      if (response.ok) {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === messageId ? { ...msg, status } : msg
          )
        )
      } else {
        console.error('Failed to update message status')
      }
    } catch (error) {
      console.error('Error updating message status:', error)
    } finally {
      setUpdating(null)
    }
  }

  const cleanupOldMessages = async () => {
    if (!confirm('确定要清理旧消息吗？\n\n清理规则：\n• 保留最近30天内的所有消息\n• 保留30天-2个月内已回复的消息\n• 删除30天以上未回复的消息')) {
      return
    }

    setCleanupLoading(true)
    try {
      const response = await fetch('/api/contact', {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer admin-token-here'
        }
      })

      if (response.ok) {
        const data = await response.json()
        alert(data.message)
        loadMessages() // Reload messages after cleanup
      } else {
        const errorData = await response.json()
        console.error('Failed to cleanup messages:', errorData.error)
        alert('清理失败：' + errorData.error)
      }
    } catch (error) {
      console.error('Error during cleanup:', error)
      alert('清理过程中发生错误')
    } finally {
      setCleanupLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge variant="destructive">New</Badge>
      case 'read':
        return <Badge variant="secondary">Read</Badge>
      case 'replied':
        return <Badge variant="default">Replied</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const filterMessages = (status?: string) => {
    if (!status || status === 'all') return messages
    return messages.filter(msg => msg.status === status)
  }

  const filteredMessages = filterMessages(selectedTab)

  if (loading) {
    return <div className="p-4">Loading contact messages...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Contact Messages</h2>
        <div className="flex gap-2">
          <Button 
            onClick={cleanupOldMessages} 
            variant="outline" 
            size="sm"
            disabled={cleanupLoading}
          >
            <Archive className="w-4 h-4 mr-2" />
            {cleanupLoading ? 'Cleaning...' : 'Cleanup Old'}
          </Button>
          <Button onClick={loadMessages} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Cleanup Policy Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Archive className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">清理策略</h4>
              <p className="text-sm text-blue-800">
                自动/手动清理：保留30天内所有消息，保留30天-2个月内已回复消息，删除30天以上未回复消息
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Mail className="w-8 h-8 text-blue-500 mr-3" />
              <div>
                <p className="text-2xl font-bold">{messages.length}</p>
                <p className="text-sm text-gray-600">Total Messages</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-red-500 mr-3" />
              <div>
                <p className="text-2xl font-bold">{messages.filter(m => m.status === 'new').length}</p>
                <p className="text-sm text-gray-600">New Messages</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Eye className="w-8 h-8 text-yellow-500 mr-3" />
              <div>
                <p className="text-2xl font-bold">{messages.filter(m => m.status === 'read').length}</p>
                <p className="text-sm text-gray-600">Read</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Reply className="w-8 h-8 text-green-500 mr-3" />
              <div>
                <p className="text-2xl font-bold">{messages.filter(m => m.status === 'replied').length}</p>
                <p className="text-sm text-gray-600">Replied</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Messages List */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="all">All ({messages.length})</TabsTrigger>
          <TabsTrigger value="new">New ({messages.filter(m => m.status === 'new').length})</TabsTrigger>
          <TabsTrigger value="read">Read ({messages.filter(m => m.status === 'read').length})</TabsTrigger>
          <TabsTrigger value="replied">Replied ({messages.filter(m => m.status === 'replied').length})</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="space-y-4">
          {filteredMessages.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No messages found.</p>
              </CardContent>
            </Card>
          ) : (
            filteredMessages.map((message) => (
              <Card key={message.id} className={message.status === 'new' ? 'border-l-4 border-l-red-500' : ''}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{message.subject}</CardTitle>
                      <p className="text-sm text-gray-600">
                        From: <strong>{message.name}</strong> ({message.email})
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(message.timestamp)} • IP: {message.ipAddress}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(message.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 rounded p-4 mb-4">
                    <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                  </div>
                  <div className="flex gap-2">
                    {message.status === 'new' && (
                      <Button
                        onClick={() => updateMessageStatus(message.id, 'read')}
                        variant="outline"
                        size="sm"
                        disabled={updating === message.id}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Mark as Read
                      </Button>
                    )}
                    {(message.status === 'new' || message.status === 'read') && (
                      <Button
                        onClick={() => updateMessageStatus(message.id, 'replied')}
                        variant="default"
                        size="sm"
                        disabled={updating === message.id}
                      >
                        <Reply className="w-4 h-4 mr-2" />
                        Mark as Replied
                      </Button>
                    )}
                    <Button
                      onClick={() => window.open(`mailto:${message.email}?subject=Re: ${message.subject}&body=Hi ${message.name},%0D%0A%0D%0AThank you for contacting us.%0D%0A%0D%0ABest regards,%0D%0ASupport Team`)}
                      variant="outline"
                      size="sm"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Reply via Email
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}