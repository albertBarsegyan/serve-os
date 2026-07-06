import { Icons } from '#/pages/landing/landing/ui/icons'
import { Reveal, SiteCta } from '#/pages/landing/landing/ui/landing-page'
import { m } from '#/paraglide/messages'

export function AboutPage() {
  const storyPoints: [string, string][] = [
    [m.about_story_point_1_title(), m.about_story_point_1_body()],
    [m.about_story_point_2_title(), m.about_story_point_2_body()],
    [m.about_story_point_3_title(), m.about_story_point_3_body()],
  ]

  return (
    <>
      {/* Hero */}
      <section className='about-hero'>
        <div className='wrap'>
          <Reveal>
            <span className='eyebrow'>{m.about_hero_eyebrow()}</span>
            <h1 className='about-h1'>
              {m.about_hero_title_line1()}
              <br className='about-br' />
              <span className='g'> {m.about_hero_title_line2()}</span>
            </h1>
            <p className='about-lead'>{m.about_hero_lead()}</p>
          </Reveal>
        </div>
      </section>

      {/* The Why */}
      <section className='about-section'>
        <div className='wrap about-two-col'>
          <Reveal className='about-label-col'>
            <span className='eyebrow'>{m.about_why_eyebrow()}</span>
          </Reveal>
          <Reveal className='about-content-col'>
            <h2 className='about-h2'>{m.about_why_title()}</h2>
            <p className='about-body'>{m.about_why_body_1()}</p>
            <p className='about-body' style={{ marginTop: '20px' }}>
              {m.about_why_body_2()}
            </p>
            <div className='about-points'>
              {storyPoints.map(([title, body]) => (
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
            <span className='eyebrow'>{m.about_founder_eyebrow()}</span>
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
                <p className='founder-role'>{m.about_founder_role()}</p>
              </div>
            </div>
            <p className='about-body' style={{ marginTop: '28px' }}>
              {m.about_founder_body_1()}
            </p>
            <p className='about-body' style={{ marginTop: '20px' }}>
              {m.about_founder_body_2()}
            </p>
            <div className='founder-links'>
              <a className='btn ghost' href='mailto:albertbarsegyan6@gmail.com'>
                <Icons.Globe />
                {m.about_founder_cta()}
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      <SiteCta />
    </>
  )
}
