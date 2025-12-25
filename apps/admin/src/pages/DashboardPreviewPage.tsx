import { useParams } from 'react-router-dom'
import DashboardPreview from '../components/DashboardPreview'

export default function DashboardPreviewPage() {
  const { workerId } = useParams<{ workerId: string }>()

  if (!workerId) {
    return <div>Worker ID is required</div>
  }

  return (
    <div className='container mx-auto py-6'>
      <h1 className='text-2xl font-bold mb-6'>Dashboard Preview</h1>
      <DashboardPreview workerId={workerId} viewMode='desktop' />
    </div>
  )
}
