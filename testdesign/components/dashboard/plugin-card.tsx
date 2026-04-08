import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  FileText,
  BarChart3,
  Users,
  Radio,
  CheckSquare,
  MapPin,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Calendar,
  FileText,
  BarChart3,
  Users,
  Radio,
  CheckSquare,
  MapPin,
  AlertTriangle,
}

interface PluginCardProps {
  name: string
  description: string
  icon: string
  href: string
  stat?: {
    label: string
    value: string | number
  }
}

export function PluginCard({ name, description, icon, href, stat }: PluginCardProps) {
  const IconComponent = iconMap[icon] || Calendar

  return (
    <Card className="group hover:border-primary/50 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <IconComponent className="h-5 w-5" />
          </div>
          {stat && (
            <div className="text-right">
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          )}
        </div>
        <CardTitle className="text-base mt-3">{name}</CardTitle>
        <CardDescription className="text-sm line-clamp-2">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <Button variant="ghost" className="w-full justify-between group-hover:text-primary" asChild>
          <Link href={href}>
            Open
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
