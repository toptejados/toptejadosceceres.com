import { useState } from 'react'

export default function ContactForm({ site, strapiUrl }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    messege: ''
  })
  const [status, setStatus] = useState('idle') // idle, loading, success, error

  const accent = 'var(--primary-color)'
  const accentHover = 'var(--secondary-color)'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus('loading')

    try {
      const response = await fetch(`${strapiUrl}/api/contancts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            ...formData,
            site: site
          }
        }),
      })

      if (!response.ok) throw new Error('Error al enviar el mensaje')

      setStatus('success')
      setFormData({ name: '', phone: '', messege: '' })
    } catch (err) {
      console.error(err)
      setStatus('error')
    }
  }

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-8 rounded-3xl bg-stone-900/50 backdrop-blur-xl border border-stone-800 shadow-2xl">
      <h2 className="text-3xl font-black mb-2 text-white">Solicitar Presupuesto</h2>
      <p className="text-stone-400 mb-8">Déjanos tus datos y te contactaremos en menos de 24 horas.</p>

      {status === 'success' ? (
        <div className="bg-green-500/10 border border-green-500/50 text-green-400 p-6 rounded-2xl text-center">
          <div className="text-4xl mb-4">✅</div>
          <h3 className="text-xl font-bold mb-2">¡Mensaje enviado con éxito!</h3>
          <p>Nos pondremos en contacto contigo pronto.</p>
          <button
            onClick={() => setStatus('idle')}
            className="mt-6 text-sm font-bold underline"
          >
            Enviar otro mensaje
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-stone-500 ml-1">Nombre Completo</label>
              <input
                required
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Juan García"
                className="w-full bg-stone-950/50 border border-stone-800 rounded-xl px-5 py-4 text-white focus:outline-none focus:ring-2 transition-all placeholder:text-stone-700"
                style={{ '--tw-ring-color': accent }}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-stone-500 ml-1">Teléfono</label>
              <input
                required
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="34912345678"
                className="w-full bg-stone-950/50 border border-stone-800 rounded-xl px-5 py-4 text-white focus:outline-none focus:ring-2 transition-all placeholder:text-stone-700"
                style={{ '--tw-ring-color': accent }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-stone-500 ml-1">Mensaje</label>
            <textarea
              required
              rows="4"
              name="messege"
              value={formData.messege}
              onChange={handleChange}
              placeholder="Descríbenos brevemente lo que necesitas..."
              className="w-full bg-stone-950/50 border border-stone-800 rounded-xl px-5 py-4 text-white focus:outline-none focus:ring-2 transition-all placeholder:text-stone-700 resize-none"
              style={{ '--tw-ring-color': accent }}
            ></textarea>
          </div>

          {status === 'error' && (
            <p className="text-red-500 text-sm font-medium">Hubo un error al enviar el formulario. Por favor, inténtalo de nuevo.</p>
          )}

          <button
            disabled={status === 'loading'}
            type="submit"
            className="w-full py-5 rounded-2xl text-white font-black text-lg transition-all hover:scale-[1.02] active:scale-95 shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:hover:scale-100"
            style={{ background: accent }}
            onMouseEnter={e => e.currentTarget.style.background = accentHover}
            onMouseLeave={e => e.currentTarget.style.background = accent}
          >
            {status === 'loading' ? (
              <span className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                <span>Enviar Solicitud</span>
                <span className="text-xl">→</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  )
}
