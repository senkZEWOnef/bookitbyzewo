'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Alert, Form, Spinner } from 'react-bootstrap'
import { useLanguage } from '@/lib/language-context'

export const dynamic = 'force-dynamic'

interface Product {
  id: string
  name: string
  description: string | null
  category: string | null
  price_cents: number
  price_mode: 'fixed' | 'quote'
  image_url: string | null
}

const money = (cents: number) => '$' + (cents / 100).toLocaleString('en-US', { minimumFractionDigits: cents % 100 ? 2 : 0 })

export default function ShopPage() {
  const { slug } = useParams() as { slug: string }
  const { language } = useLanguage()
  const es = language === 'es'
  const t = (a: string, b: string) => (es ? a : b)

  const [data, setData] = useState<any>(null)
  const [error, setError] = useState('')
  const [cart, setCart] = useState<Record<string, number>>({})
  const [cat, setCat] = useState('')
  const [view, setView] = useState<'menu' | 'checkout' | 'done'>('menu')
  const [form, setForm] = useState({ name: '', phone: '', fulfillment: 'pickup', address: '', notes: '' })
  const [submitting, setSubmitting] = useState(false)
  const [placed, setPlaced] = useState<any>(null)

  useEffect(() => {
    fetch(`/api/shop/${slug}`).then(async r => {
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Not found')
      setData(d)
      const s = d.shop
      setForm(f => ({ ...f, fulfillment: s.pickup_enabled ? 'pickup' : 'delivery' }))
    }).catch(e => setError(e.message))
  }, [slug])

  const products: Product[] = data?.products || []
  const categories = useMemo(() => Array.from(new Set(products.map(p => p.category).filter(Boolean))) as string[], [products])
  const visible = cat ? products.filter(p => p.category === cat) : products
  const lines = products.filter(p => cart[p.id] > 0)
  const count = lines.reduce((n, p) => n + cart[p.id], 0)
  const isQuote = lines.some(p => p.price_mode === 'quote')
  const subtotal = lines.reduce((n, p) => n + (p.price_mode === 'fixed' ? p.price_cents * cart[p.id] : 0), 0)
  const fee = !isQuote && form.fulfillment === 'delivery' ? data?.shop.delivery_fee_cents || 0 : 0

  const setQty = (id: string, q: number) => setCart(c => { const n = { ...c }; if (q <= 0) delete n[id]; else n[id] = Math.min(99, q); return n })

  const submit = async () => {
    setSubmitting(true); setError('')
    try {
      const r = await fetch(`/api/shop/${slug}/order`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: form.name, customerPhone: form.phone, fulfillment: form.fulfillment, address: form.address, notes: form.notes,
          items: lines.map(p => ({ productId: p.id, quantity: cart[p.id] }))
        })
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Error')
      setPlaced({ ...d.order, lines: lines.map(p => ({ name: p.name, qty: cart[p.id] })) })
      setCart({}); setView('done')
      window.scrollTo({ top: 0 })
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (error && !data) {
    return <div className="bk-page"><div className="bk-wrap" style={{ paddingTop: '7rem' }}><Alert variant="info" className="text-center">{t('Esta tienda no está disponible por ahora.', 'This shop is not available right now.')}</Alert></div></div>
  }
  if (!data) return <div className="bk-page"><div className="text-center" style={{ paddingTop: '8rem' }}><Spinner animation="border" variant="success" /></div></div>

  const biz = data.business
  const canSubmit = form.name.trim() && form.phone.trim() && (form.fulfillment !== 'delivery' || form.address.trim())

  return (
    <div className="bk-page">
      <div className="bk-hero">
        <div className="bk-wrap">
          <h1>{biz.name}</h1>
          <p>{biz.description || t('Haz tu pedido en línea', 'Order online')}</p>
          {biz.location && <div className="bk-loc"><i className="fas fa-map-marker-alt me-2"></i>{biz.location}</div>}
          <Link href={`/book/${biz.slug}`} className="small text-white d-inline-block mt-2" style={{ opacity: .9 }}><i className="far fa-calendar-alt me-1"></i>{t('Reservar una cita', 'Book an appointment')}</Link>
        </div>
      </div>

      <div className="bk-wrap bk-body">
        <div className="bk-card">
          {view === 'menu' && (
            <>
              {categories.length > 0 && (
                <div className="sh-cats">
                  <button className={`sh-cat ${cat === '' ? 'sel' : ''}`} onClick={() => setCat('')}>{t('Todo', 'All')}</button>
                  {categories.map(c => <button key={c} className={`sh-cat ${cat === c ? 'sel' : ''}`} onClick={() => setCat(c)}>{c}</button>)}
                </div>
              )}
              {visible.length === 0 && <p className="text-muted text-center py-4 mb-0">{t('Aún no hay productos.', 'No products yet.')}</p>}
              {visible.map(p => (
                <div key={p.id} className="sh-product">
                  {p.image_url ? <img src={p.image_url} alt={p.name} loading="lazy" /> : <div className="ph"><i className="fas fa-image"></i></div>}
                  <div className="flex-grow-1 d-flex flex-column">
                    <div className="nm">{p.name}</div>
                    {p.description && <div className="ds">{p.description}</div>}
                    <div className="d-flex align-items-center justify-content-between mt-auto pt-2">
                      <span className="pr">{p.price_mode === 'quote' ? t('Cotización', 'Quote') : money(p.price_cents)}</span>
                      {cart[p.id] ? (
                        <span className="sh-qty"><button onClick={() => setQty(p.id, cart[p.id] - 1)} aria-label="-">−</button><span>{cart[p.id]}</span><button onClick={() => setQty(p.id, cart[p.id] + 1)} aria-label="+">+</button></span>
                      ) : (
                        <button className={`sh-add ${p.price_mode === 'quote' ? 'quote' : ''}`} onClick={() => setQty(p.id, 1)}>
                          {p.price_mode === 'quote' ? t('Cotizar', 'Get a quote') : t('Agregar', 'Add')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {view === 'checkout' && (
            <>
              <button className="bk-back" onClick={() => setView('menu')}>← {t('Seguir comprando', 'Keep shopping')}</button>
              <div className="bk-title mt-1">{isQuote ? t('Tu solicitud', 'Your request') : t('Tu pedido', 'Your order')}</div>
              {lines.map(p => (
                <div key={p.id} className="d-flex justify-content-between align-items-center mb-2">
                  <div>{p.name}</div>
                  <div className="d-flex align-items-center gap-3">
                    <span className="sh-qty"><button onClick={() => setQty(p.id, cart[p.id] - 1)}>−</button><span>{cart[p.id]}</span><button onClick={() => setQty(p.id, cart[p.id] + 1)}>+</button></span>
                    <strong style={{ minWidth: 56, textAlign: 'right' }}>{p.price_mode === 'quote' ? '—' : money(p.price_cents * cart[p.id])}</strong>
                  </div>
                </div>
              ))}
              {isQuote ? (
                <Alert variant="warning" className="small mt-3">{t('Este pedido incluye artículos por cotizar. El negocio te contactará por WhatsApp con el precio.', 'This includes items that need a quote. The business will contact you on WhatsApp with a price.')}</Alert>
              ) : (
                <div className="border-top pt-2 mt-3 small">
                  <div className="d-flex justify-content-between"><span>Subtotal</span><span>{money(subtotal)}</span></div>
                  {form.fulfillment === 'delivery' && <div className="d-flex justify-content-between"><span>{t('Entrega', 'Delivery')}</span><span>{money(fee)}</span></div>}
                  <div className="d-flex justify-content-between fw-bold fs-5 mt-1"><span>Total</span><span>{money(subtotal + fee)}</span></div>
                </div>
              )}

              {(data.shop.pickup_enabled && data.shop.delivery_enabled) && (
                <div className="sh-seg mt-3">
                  <button className={form.fulfillment === 'pickup' ? 'sel' : ''} onClick={() => setForm({ ...form, fulfillment: 'pickup' })}><i className="fas fa-store me-2"></i>{t('Recoger', 'Pickup')}</button>
                  <button className={form.fulfillment === 'delivery' ? 'sel' : ''} onClick={() => setForm({ ...form, fulfillment: 'delivery' })}><i className="fas fa-truck me-2"></i>{t('Entrega', 'Delivery')}</button>
                </div>
              )}
              {form.fulfillment === 'delivery' && data.shop.delivery_note && <div className="small text-muted mt-2">{data.shop.delivery_note}</div>}

              <Form className="mt-3" onSubmit={e => e.preventDefault()}>
                <Form.Group className="mb-3"><Form.Label>{t('Nombre completo', 'Full name')} *</Form.Label><Form.Control value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} autoComplete="name" /></Form.Group>
                <Form.Group className="mb-3"><Form.Label>{t('Número de WhatsApp', 'WhatsApp number')} *</Form.Label><Form.Control type="tel" inputMode="tel" placeholder="+1 787 555 0123" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} autoComplete="tel" /></Form.Group>
                {form.fulfillment === 'delivery' && <Form.Group className="mb-3"><Form.Label>{t('Dirección de entrega', 'Delivery address')} *</Form.Label><Form.Control as="textarea" rows={2} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} autoComplete="street-address" /></Form.Group>}
                <Form.Group className="mb-2"><Form.Label>{t('Notas (opcional)', 'Notes (optional)')}</Form.Label><Form.Control as="textarea" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></Form.Group>
              </Form>
              {!isQuote && <div className="small text-muted">{t('El pago se coordina directamente con el negocio al recoger o entregar.', 'Payment is arranged directly with the business at pickup or delivery.')}</div>}
              {error && <Alert variant="danger" className="mt-3 mb-0">{error}</Alert>}
            </>
          )}

          {view === 'done' && placed && (
            <div className="text-center py-3">
              <div style={{ fontSize: '3rem' }}>✅</div>
              <div className="bk-title mt-0">{placed.kind === 'quote' ? t('¡Solicitud enviada!', 'Request sent!') : t('¡Pedido recibido!', 'Order received!')}</div>
              <p className="text-muted">
                {placed.kind === 'quote'
                  ? t('El negocio te contactará pronto con tu cotización.', 'The business will contact you soon with your quote.')
                  : t(`${placed.business_name} confirmará tu pedido por WhatsApp.`, `${placed.business_name} will confirm your order on WhatsApp.`)}
              </p>
              {placed.kind === 'order' && <p className="fw-bold fs-4 mb-3">{money(placed.total_cents)}</p>}
              {placed.business_phone && (
                <a className="btn btn-success rounded-pill px-4 py-2 fw-bold" target="_blank" rel="noreferrer"
                  href={`https://wa.me/${placed.business_phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                    `${placed.kind === 'quote' ? t('Hola, quiero una cotización:', 'Hi, I would like a quote:') : t('Hola, hice un pedido:', 'Hi, I placed an order:')}\n` +
                    placed.lines.map((l: any) => `• ${l.qty} × ${l.name}`).join('\n') + `\n${form.name}`
                  )}`}>
                  <i className="fab fa-whatsapp me-2"></i>{t('Escribir por WhatsApp', 'Message on WhatsApp')}
                </a>
              )}
              <div className="mt-3"><button className="bk-link" onClick={() => setView('menu')}>{t('Volver a la tienda', 'Back to the shop')}</button></div>
            </div>
          )}
        </div>
      </div>

      {view === 'menu' && count > 0 && (
        <div className="bk-cta"><div className="inner">
          <button className="bk-btn" onClick={() => { setView('checkout'); window.scrollTo({ top: 0 }) }}>
            {isQuote ? t('Pedir cotización', 'Request quote') : t('Ver pedido', 'View order')} · {count}{!isQuote && ` · ${money(subtotal)}`}
          </button>
        </div></div>
      )}
      {view === 'checkout' && (
        <div className="bk-cta"><div className="inner">
          <button className="bk-btn" disabled={!canSubmit || submitting || count === 0} onClick={submit}>
            {submitting ? <Spinner animation="border" size="sm" /> : isQuote ? t('Enviar solicitud', 'Send request') : `${t('Hacer pedido', 'Place order')} · ${money(subtotal + fee)}`}
          </button>
        </div></div>
      )}
    </div>
  )
}
