import { CTASection } from '../components/home/CTASection'
import { HeroSection } from '../components/home/HeroSection'
import { NewsPreview } from '../components/home/NewsPreview'
import { ProcessSection } from '../components/home/ProcessSection'
import { ProjectsPreview } from '../components/home/ProjectsPreview'
import { ServicesPreview } from '../components/home/ServicesPreview'

export function HomePage() {
  return (
    <>
      <HeroSection />
      <ServicesPreview />
      <ProcessSection />
      <ProjectsPreview />
      <NewsPreview />
      <CTASection />
    </>
  )
}
