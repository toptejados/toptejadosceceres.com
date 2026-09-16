import { useState, useEffect, useRef } from 'react'
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Share from "yet-another-react-lightbox/plugins/share";
import Counter from "yet-another-react-lightbox/plugins/counter";
import "yet-another-react-lightbox/plugins/counter.css";
import { optimizedImageUrl } from '../lib/site.js'

// ── Scroll reveal hook ────────────────────────────────────────
function useReveal(threshold = 0.1) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return [ref, visible]
}

// ─────────────────────────────────────────────────────────────
// PROJECT DETAIL VIEW — matches the clean screenshot design
// ─────────────────────────────────────────────────────────────
function ProjectDetail({ project, onBack, uiData }) {
  const [visible, setVisible] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  useEffect(() => { setTimeout(() => setVisible(true), 60) }, [])

  const paragraphs = project.description.split('\n\n').filter(Boolean)
  const slides = (project.images || []).map(src => ({ src }))

  return (
    <div style={{
      color: '#111827',
      background: '#FFFFFF',
      minHeight: '100vh',
      overflowX: 'hidden',
    }}>
      {/* Spacer for fixed navbar */}
      <div style={{ height: 80 }} />

      {/* Main content area */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '48px 16px 80px' }}>

        {/* Back button */}
        <button
          onClick={onBack}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#6B7280', fontSize: 14, marginBottom: 36,
            padding: 0,
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--primary-color)'}
          onMouseLeave={e => e.currentTarget.style.color = '#6B7280'}
        >
          {uiData.detailPage.backButton}
        </button>

        {/* Two-column layout: left=text, right=image */}
        <div className="project-detail-grid" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 420px',
          gap: 56,
          alignItems: 'start',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.6s ease, transform 0.6s ease',
        }}>

          {/* LEFT — Title + metadata + description */}
          <div>
            <h1 style={{
              fontSize: 'clamp(26px, 3.5vw, 38px)',
              fontWeight: 700,
              color: '#111827',
              lineHeight: 1.25,
              marginBottom: 20,
              margin: '0 0 20px',
            }}>
              {project.title}
            </h1>

            {/* Date + Location metadata */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#6B7280', fontSize: 13 }}>
                {/* Calendar icon */}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span>{project.date}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#6B7280', fontSize: 13 }}>
                {/* Pin icon */}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                </svg>
                <span>{project.location}</span>
              </div>
            </div>

            {/* Description paragraphs */}
            <h2 style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0 }}>
              Detalles del proyecto {project.title}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {paragraphs.map((para, i) => (
                <p key={i} style={{
                  fontSize: 14.5,
                  color: '#4B5563',
                  lineHeight: 1.8,
                  margin: 0,
                }}>
                  {para}
                </p>
              ))}
            </div>
          </div>

          {/* RIGHT — Cover image */}
          <div style={{ position: 'sticky', top: 100 }}>
            <div style={{
              borderRadius: 12,
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            }}>
              <img width="1200" height="900"
                src={optimizedImageUrl(project.coverImg, 1200)}
                alt={project.title}
                style={{ width: '100%', objectFit: 'cover', display: 'block', aspectRatio: '4/3' }}
              />
            </div>
          </div>
        </div>

        {/* Gallery strip — full width, 3 cols */}
        <div style={{ marginTop: 64 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 16,
          }}>
            {project.images.map((img, i) => (
              <div 
                key={i} 
                onClick={() => {
                  setLightboxIndex(i)
                  setLightboxOpen(true)
                }}
                style={{
                  borderRadius: 10,
                  overflow: 'hidden',
                  aspectRatio: '4/3',
                  cursor: 'pointer'
                }}>
                <img width="800" height="600"
                  src={optimizedImageUrl(img)}
                  alt={`${project.title} — foto ${i + 1}`}
                  style={{
                    width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                    transition: 'transform 0.4s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                />
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{
          marginTop: 56,
          padding: '36px 40px',
          background: '#F9FAFB',
          borderRadius: 14,
          border: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 20,
        }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 600, color: '#111827', marginBottom: 6 }}>{uiData.cta.title}</div>
            <div style={{ fontSize: 14, color: '#6B7280' }}>{uiData.cta.subtitle}</div>
          </div>
          <a
            href={uiData.cta.buttonLink}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 28px', borderRadius: 8,
              background: 'var(--primary-color)', color: '#FFFFFF',
              fontWeight: 600, fontSize: 14, textDecoration: 'none',
              transition: 'opacity 0.2s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            {uiData.cta.buttonText}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
          </a>
        </div>
      </div>

      {slides.length > 0 && (
        <Lightbox
          open={lightboxOpen}
          close={() => setLightboxOpen(false)}
          index={lightboxIndex}
          slides={slides}
          plugins={[Zoom, Fullscreen, Share, Counter]}
        />
      )}

      {/* Mobile responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .project-detail-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// PROJECT CARD
// ─────────────────────────────────────────────────────────────
function ProjectCard({ project }) {
  return (
    <a
      href={`/proyectos/${project.slug}`}
      style={{
        cursor: 'pointer',
        background: 'transparent',
        textDecoration: 'none',
        display: 'block'
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative', overflow: 'hidden', height: 400, borderRadius: 16, marginBottom: 16 }}>
        <img width="800" height="600"
          src={optimizedImageUrl(project.coverImg, 800)}
          alt={project.title}
          style={{
            width: '100%', height: '100%', objectFit: 'cover', display: 'block',
          }}
        />
      </div>

      {/* Card body */}
      <div style={{ padding: '0' }}>
        <h2 style={{ fontSize: 18, fontWeight: 500, color: '#1e293b', lineHeight: 1.3, marginBottom: 8, margin: '0 0 8px' }}>
          {project.title}
        </h2>
        <div
          className="project-card-desc"
          style={{
            fontSize: 14,
            color: '#6B7280',
            lineHeight: 1.5,
          }}
        >
          {project.description}
        </div>
      </div>
    </a>
  )
}


// ─────────────────────────────────────────────────────────────
// PROJECTS LISTING
// ─────────────────────────────────────────────────────────────
function ProjectsListing({ onSelectProject, projects, uiData }) {
  const [ref, visible] = useReveal()

  return (
    <div style={{ color: '#111827', background: '#FFFFFF', minHeight: '100vh' }}>

      {/* Page Header */}
      <div style={{ paddingTop: 140, paddingBottom: 40, paddingLeft: 32, paddingRight: 32, maxWidth: 1200, margin: '0 auto' }}>
        <h1 style={{
          fontSize: 'clamp(32px, 4vw, 40px)',
          fontWeight: 500,
          color: '#000000',
          lineHeight: 1.2,
          margin: 0,
        }}>
          {uiData.pageTitle}
        </h1>
      </div>

      {/* Grid or Empty Description */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px 80px' }}>

        {projects.length > 0 ? (
          <div
            ref={ref}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 32,
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(24px)',
              transition: 'all 0.7s ease',
            }}
          >
            {projects.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
              />
            ))}
          </div>
        ) : (
          <div style={{ maxWidth: 720 }}>
            <p style={{ fontSize: 17, color: '#4B5563', lineHeight: 1.8, marginBottom: 20 }}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </p>
            <p style={{ fontSize: 17, color: '#4B5563', lineHeight: 1.8, marginBottom: 20 }}>
              Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
            </p>
            <p style={{ fontSize: 17, color: '#4B5563', lineHeight: 1.8 }}>
              Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// ROOT EXPORT
// ─────────────────────────────────────────────────────────────
export default function ProjectsContent({ projects = [], project = null, uiData = {} }) {
  const handleBack = (e) => {
    e.preventDefault();
    window.location.href = '/proyectos';
  }

  return (
    <>
      <style>{`
        .project-card-desc {
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
      {project ? (
        <ProjectDetail project={project} onBack={handleBack} uiData={uiData} />
      ) : (
        <ProjectsListing projects={projects} uiData={uiData} />
      )}
    </>
  )
}
