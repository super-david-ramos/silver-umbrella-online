import { Link } from 'react-router-dom'
import { FileText, Zap, Shield, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
        <div className="mb-8">
          <div className="h-16 w-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Notes
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-md mx-auto">
            Capture ideas in 3 seconds. Simple notes with smart todo formatting.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button asChild size="lg" className="min-w-[140px]">
            <Link to="/login">Get Started</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="min-w-[140px]">
            <Link to="/demo">Try Demo</Link>
          </Button>
        </div>
      </div>

      {/* Features Section */}
      <div className="border-t bg-muted/30 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold text-center mb-12">
            Built for speed
          </h2>
          <div className="grid sm:grid-cols-3 gap-8">
            <Feature
              icon={<Zap className="h-6 w-6" />}
              title="Instant capture"
              description="New note in one tap. No friction, no organization required."
            />
            <Feature
              icon={<Shield className="h-6 w-6" />}
              title="Secure by default"
              description="Your notes are private. Passkey authentication coming soon."
            />
            <Feature
              icon={<Smartphone className="h-6 w-6" />}
              title="Mobile-first"
              description="Designed for touch. Works great on any device."
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-8 px-4 text-center text-sm text-muted-foreground">
        <p>Open source productivity app</p>
      </footer>
    </div>
  )
}

function Feature({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="text-center">
      <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4 text-primary">
        {icon}
      </div>
      <h3 className="font-medium mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
