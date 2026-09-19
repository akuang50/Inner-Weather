import { TrackerProvider } from './state/TrackerProvider'
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

export default function App() {
  return (
    <TrackerProvider>
      <div className="min-h-screen bg-bg text-ink">
        <Navbar />
        <main>
          <Hero />
          <div id="demo">
            <SignalExplorer />
          </div>
          <VoiceJournal />
          <HealthLogger />
          <StressReplay />
          <BaselineSection />
          <ExplainabilityCard />
          <HowItWorks />
          <PrivacySection />
          <FinalCTA />
        </main>
        <Footer />
      </div>
    </TrackerProvider>
  )
}
