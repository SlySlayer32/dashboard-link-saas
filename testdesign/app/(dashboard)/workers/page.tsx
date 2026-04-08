'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-context'
import { getWorkersByOrganization } from '@/lib/data/demo-data'
import { Worker } from '@/lib/data/types'
import { Header } from '@/components/dashboard/header'
import { WorkerTable } from '@/components/workers/worker-table'
import { WorkerForm } from '@/components/workers/worker-form'
import { Button } from '@/components/ui/button'
import { UserPlus, Upload } from 'lucide-react'

export default function WorkersPage() {
  const router = useRouter()
  const { organization } = useAuth()
  const [formOpen, setFormOpen] = useState(false)
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null)

  const workers = organization ? getWorkersByOrganization(organization.id) : []

  const handleEdit = (worker: Worker) => {
    setSelectedWorker(worker)
    setFormOpen(true)
  }

  const handleMessage = (worker: Worker) => {
    router.push(`/messages/${worker.id}`)
  }

  const handleAddWorker = () => {
    setSelectedWorker(null)
    setFormOpen(true)
  }

  const handleSubmit = (workerData: Partial<Worker>) => {
    // In a real app, this would call an API
    console.log('Saving worker:', workerData)
    setFormOpen(false)
  }

  return (
    <>
      <Header title="Workers" />
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Workers</h1>
              <p className="text-muted-foreground">
                Manage your team members and their contact information
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Import CSV
              </Button>
              <Button onClick={handleAddWorker}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Worker
              </Button>
            </div>
          </div>

          <WorkerTable
            workers={workers}
            onEdit={handleEdit}
            onMessage={handleMessage}
          />

          <WorkerForm
            worker={selectedWorker}
            open={formOpen}
            onOpenChange={setFormOpen}
            onSubmit={handleSubmit}
          />
        </div>
      </main>
    </>
  )
}
