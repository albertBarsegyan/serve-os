import { Icons } from '#/pages/landing/landing/ui/icons'
import { Reveal, SiteCta } from '#/pages/landing/landing/ui/landing-page'

const STORY_POINTS: [string, string][] = [
  [
    'Real-time, everywhere',
    'Every order, every update — the guest, floor and kitchen all see the same live state.',
  ],
  [
    'No app to download',
    'Guests scan a QR code from their own phone. Nothing to install, nothing to learn.',
  ],
  [
    'Multi-business ready',
    'Built from day one to run multiple venues under one roof without extra setup.',
  ],
]

export function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className='about-hero'>
        <div className='wrap'>
          <Reveal>
            <span className='eyebrow'>About serve-os</span>
            <h1 className='about-h1'>
              From a table in Vietnam
              <br className='about-br' />
              <span className='g'> to serve-os.</span>
            </h1>
            <p className='about-lead'>
              The idea started on a trip to Vietnam. I sat down, scanned a QR code, browsed the
              menu, ordered and paid — all from my phone, without ever flagging anyone down. The
              whole flow just worked: smooth, fast, invisible. I left thinking hospitality
              everywhere should feel like that.
            </p>
          </Reveal>
        </div>
      </section>

      {/* The Why */}
      <section className='about-section'>
        <div className='wrap about-two-col'>
          <Reveal className='about-label-col'>
            <span className='eyebrow'>The why</span>
          </Reveal>
          <Reveal className='about-content-col'>
            <h2 className='about-h2'>Make the ordering part enjoyable too.</h2>
            <p className='about-body'>
              Dining isn't only about the food or the atmosphere — the ordering process is part of
              the experience. When it's clunky, it pulls you out of the moment. So I started
              building serve-os: one connected system that links the guest, the floor, the kitchen
              and the owner to the same live order, from the first scan to the closed bill.
            </p>
            <p className='about-body' style={{ marginTop: '20px' }}>
              The goal is simple — make hospitality faster and smoother, so guests can stay focused
              on enjoying themselves and staff can stay focused on service.
            </p>
            <div className='about-points'>
              {STORY_POINTS.map(([title, body]) => (
                <div className='about-point' key={title}>
                  <span className='about-point-ico'>
                    <Icons.Check />
                  </span>
                  <div>
                    <strong>{title}</strong>
                    <span> — {body}</span>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Founder */}
      <section className='about-section'>
        <div className='wrap about-two-col'>
          <Reveal className='about-label-col'>
            <span className='eyebrow'>Who's behind it</span>
          </Reveal>
          <Reveal className='about-content-col'>
            <div className='founder-card'>
              <div className='founder-avatar'>
                <span>AB</span>
              </div>
              <div>
                <h2 className='about-h2' style={{ marginBottom: '4px' }}>
                  Albert Barsegyan
                </h2>
                <p className='founder-role'>Founder &amp; Builder</p>
              </div>
            </div>
            <p className='about-body' style={{ marginTop: '28px' }}>
              I'm the founder and builder behind serve-os. What began as a single inspiring meal
              abroad turned into a project to bring that same effortless, QR-first flow to
              restaurants everywhere — built to be real-time for the kitchen and multi-business
              ready from day one.
            </p>
            <p className='about-body' style={{ marginTop: '20px' }}>
              serve-os is designed and built with care for the people who use it every day — the
              restaurant owner updating the menu at midnight, the kitchen staff reading tickets
              during a rush, and the guests who just want to enjoy their meal.
            </p>
            <div className='founder-links'>
              <a className='btn ghost' href='mailto:albertbarsegyan6@gmail.com'>
                <Icons.Globe />
                Get in touch
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      <SiteCta />
    </>
  )
}
