import { useState } from 'react'
import { TrackerProvider, useTracker } from './state/TrackerProvider'
import { AuthProvider, useAuth } from './state/AuthProvider'
import { Navbar } from './components/Navbar'
import { Hero } from './components/Hero'
import { SignalExplorer } from './components/SignalExplorer'
import { VoiceJournal } from './components/VoiceJournal'
import { HealthLogger } from './components/HealthLogger'
import { StressReplay } from './components/StressReplay'
import { BaselineSection } from './components/BaselineSection'
import { ExplainabilityCard } from './components/ExplainabilityCard'
import { HowItWorks } from './components/HowItWorks'
import { PrivacySection } from './components/PrivacySection'
import { FinalCTA, Footer } from './components/FinalCTA'
import { LoginModal, SignInPrompt } from './components/LoginModal'
import { StressCoachChat } from './components/StressCoachChat'
import { ChatProvider } from './state/ChatProvider'

function TrackerDemo({ onSignIn, onDemo }: { onSignIn: () => void; onDemo: () => void }) {
  const { authenticated, ready } = useTracker()

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted">
        Loading your workspace…
      </div>
    )
  }

  if (!authenticated) {
    return <SignInPrompt onSignIn={onSignIn} onDemo={onDemo} />
  }

  return (
    <>
      <SignalExplorer />
      <VoiceJournal />
      <StressCoachChat />
      <HealthLogger />
      <div className="section-rule mx-auto max-w-6xl" />
      <StressReplay />
      <BaselineSection />
      <ExplainabilityCard />
    </>
  )
}

function Shell() {
  const { user, loginDemo } = useAuth()
  const [loginOpen, setLoginOpen] = useState(false)
  const [loginMode, setLoginMode] = useState<'login' | 'register'>('login')

  const openLogin = (mode: 'login' | 'register' = 'login') => {
    setLoginMode(mode)
    setLoginOpen(true)
  }

  return (
    <div className="site-shell min-h-screen text-ink">
      <Navbar
        user={user}
        onSignIn={() => openLogin('login')}
        onRegister={() => openLogin('register')}
      />
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} initialMode={loginMode} />
      <main>
        <Hero />
        <div className="section-rule mx-auto max-w-6xl" />
        <div id="demo">
          <TrackerDemo
            onSignIn={() => openLogin('login')}
            onDemo={() => void loginDemo()}
          />
        </div>
        <HowItWorks />
        <PrivacySection />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <TrackerProvider>
        <ChatProvider>
          <Shell />
        </ChatProvider>
      </TrackerProvider>
    </AuthProvider>
  )
}
