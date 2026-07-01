import {
  Building2,
  Gavel,
  HardHat,
  TrendingUp,
} from 'lucide-react'
import type { Service } from '../types'

export const services: Service[] = [
  {
    id: 'service-real-estate',
    title: 'Real Estate Consulting',
    slug: 'real-estate-consulting',
    shortDescription:
      'Make confident property decisions with practical market, site, and transaction guidance.',
    description:
      'We help organizations and investors evaluate real estate opportunities from the first market question through transaction planning. Our advice connects commercial goals, local context, and measurable risk so every property decision has a clear rationale.',
    icon: Building2,
    benefits: [
      'Evidence-based market and location assessment',
      'Clear opportunity, cost, and risk comparison',
      'Coordinated transaction and due diligence planning',
      'Practical recommendations aligned with your goals',
    ],
    process: [
      'Define the property objective and decision criteria',
      'Review available market, site, and transaction information',
      'Compare scenarios and identify material risks',
      'Present a prioritized action plan',
    ],
  },
  {
    id: 'service-legal',
    title: 'Legal Consulting',
    slug: 'legal-consulting',
    shortDescription:
      'Navigate business requirements and documentation with clarity, structure, and confidence.',
    description:
      'Our legal consulting service brings structure to complex business matters. We review the operational context, organize documentation, and explain requirements in accessible language so leaders can make informed decisions and coordinate effectively with specialist counsel when needed.',
    icon: Gavel,
    benefits: [
      'Plain-language explanation of key requirements',
      'Structured document and compliance review',
      'Early identification of operational legal risks',
      'Better coordination across internal stakeholders',
    ],
    process: [
      'Clarify the business matter and intended outcome',
      'Collect and review relevant information',
      'Map requirements, dependencies, and risk areas',
      'Deliver recommendations and next-step guidance',
    ],
  },
  {
    id: 'service-investment',
    title: 'Investment Consulting',
    slug: 'investment-consulting',
    shortDescription:
      'Turn ambitious ideas into disciplined investment decisions supported by robust analysis.',
    description:
      'We support investment teams with independent analysis, scenario planning, and decision frameworks. Every engagement is designed to make assumptions visible, compare alternatives fairly, and connect capital decisions to sustainable business outcomes.',
    icon: TrendingUp,
    benefits: [
      'Transparent assumptions and evaluation criteria',
      'Scenario-based return and risk assessment',
      'Independent challenge of investment proposals',
      'Decision-ready recommendations for stakeholders',
    ],
    process: [
      'Align on objectives, constraints, and risk appetite',
      'Assess the opportunity and underlying assumptions',
      'Model scenarios and compare strategic options',
      'Recommend a decision path and monitoring approach',
    ],
  },
  {
    id: 'service-construction',
    title: 'Construction Consulting',
    slug: 'construction-consulting',
    shortDescription:
      'Keep complex projects aligned on scope, risk, quality, and commercial priorities.',
    description:
      'Our construction consulting specialists help project owners establish stronger controls from planning through completion. We bring commercial and delivery perspectives together to clarify scope, anticipate constraints, and maintain visibility over critical decisions.',
    icon: HardHat,
    benefits: [
      'Stronger scope and delivery control',
      'Early visibility into cost and schedule pressure',
      'Consistent risk and progress reporting',
      'More effective owner and contractor coordination',
    ],
    process: [
      'Review objectives, scope, and project baseline',
      'Assess delivery readiness and major constraints',
      'Establish controls, reporting, and decision gates',
      'Support delivery reviews through closeout',
    ],
  },
]
