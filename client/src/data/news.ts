import type { NewsArticle } from '../types'

export const newsArticles: NewsArticle[] = [
  {
    id: 'news-due-diligence',
    title: 'A Practical Due Diligence Checklist for Better Decisions',
    slug: 'practical-due-diligence-checklist',
    excerpt:
      'A focused review process can reveal the assumptions and dependencies that matter before a commitment is made.',
    content: [
      'Good due diligence is not about collecting the largest possible volume of documents. It is about identifying which facts can materially change a decision, then testing those facts with the right level of depth.',
      'Begin with the decision criteria. Commercial fit, legal readiness, implementation capacity, and downside exposure should each have a clear owner and evidence standard. This keeps the review focused and makes gaps easier to discuss.',
      'The final output should connect every material finding to an action: accept the risk, reduce it, seek more evidence, or reconsider the opportunity. That translation from information to action is where diligence creates real value.',
    ],
    category: 'Business Advisory',
    publishedAt: '2026-06-18',
    readTime: '6 min read',
  },
  {
    id: 'news-construction-controls',
    title: 'Five Project Controls That Keep Construction Visible',
    slug: 'construction-project-controls',
    excerpt:
      'Simple, consistently applied controls help project owners detect pressure before it becomes disruption.',
    content: [
      'Construction reporting becomes useful when it answers a small set of recurring questions: what changed, why it changed, what the impact is, and who must decide next.',
      'A reliable baseline, disciplined change log, risk register, short-term lookahead, and decision tracker form a practical control system. Each tool should be concise enough to use in every project review.',
      'Controls do not replace experienced judgment. They create a shared picture that allows judgment to happen earlier, with better evidence and clearer accountability.',
    ],
    category: 'Construction',
    publishedAt: '2026-06-04',
    readTime: '5 min read',
  },
  {
    id: 'news-investment-assumptions',
    title: 'How to Challenge Investment Assumptions Constructively',
    slug: 'challenge-investment-assumptions',
    excerpt:
      'The strongest investment cases make uncertainty explicit and invite disciplined challenge.',
    content: [
      'An investment model can be mathematically precise while its assumptions remain uncertain. Constructive review separates the quality of the idea from the confidence of the evidence supporting it.',
      'Test the variables that drive the largest outcome changes first. Compare a base case with realistic downside and upside scenarios, then identify the signals that would show which scenario is emerging.',
      'A useful challenge process improves the decision rather than merely delaying it. Document the assumptions, owners, and monitoring triggers so the team can adapt as evidence changes.',
    ],
    category: 'Investment',
    publishedAt: '2026-05-21',
    readTime: '7 min read',
  },
  {
    id: 'news-property-location',
    title: 'Looking Beyond Price in a Property Location Review',
    slug: 'property-location-review',
    excerpt:
      'Access, talent, resilience, and long-term flexibility can matter more than the headline property cost.',
    content: [
      'Property comparisons often begin with price, but a location decision shapes operating performance for years. Accessibility, customer proximity, workforce availability, infrastructure, and expansion options all deserve explicit consideration.',
      'Create a weighted scorecard that reflects the organization’s actual priorities. Supporting every score with evidence makes tradeoffs visible and prevents one attractive feature from dominating the decision.',
      'The best location is rarely the strongest on every measure. It is the option whose tradeoffs best match the organization’s strategy and capacity to manage risk.',
    ],
    category: 'Real Estate',
    publishedAt: '2026-05-08',
    readTime: '5 min read',
  },
  {
    id: 'news-compliance-operations',
    title: 'Turning Compliance Requirements into Daily Operations',
    slug: 'compliance-into-operations',
    excerpt:
      'Policies become effective when responsibilities, evidence, and review rhythms are clear.',
    content: [
      'A policy is only the beginning of an effective compliance system. Teams need to know which actions are required, who owns them, what evidence to retain, and when exceptions should be escalated.',
      'Translate each important requirement into a simple operational control. Assign ownership to a role, define the expected record, and include the control in an existing management rhythm wherever possible.',
      'Periodic review should focus on whether the controls work in practice. A smaller set of well-understood controls is usually stronger than a complex framework that teams cannot maintain.',
    ],
    category: 'Legal',
    publishedAt: '2026-04-24',
    readTime: '6 min read',
  },
  {
    id: 'news-advisory-engagement',
    title: 'What to Prepare Before an Advisory Engagement',
    slug: 'prepare-for-advisory-engagement',
    excerpt:
      'A clear decision, honest constraints, and accessible evidence help consulting work create value faster.',
    content: [
      'The most productive advisory engagements begin with a specific decision or outcome. A broad topic can be useful context, but the team should agree on what will be different when the work is complete.',
      'Share constraints early, including timing, budget, stakeholder expectations, and known gaps in information. This allows the approach to be designed around reality rather than an idealized process.',
      'Finally, nominate a decision owner and an operational contact. Clear access and timely feedback keep the work moving and ensure recommendations reflect the organization’s practical context.',
    ],
    category: 'Insights',
    publishedAt: '2026-04-10',
    readTime: '4 min read',
  },
]
