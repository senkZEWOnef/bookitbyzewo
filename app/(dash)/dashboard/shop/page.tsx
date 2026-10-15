'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Alert, Badge, Button, Card, Form, Modal, Nav, Spinner } from 'react-bootstrap'
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
  is_active: boolean
}

interface Order {
  id: string
  kind: 'order' | 'quote'
  customer_name: string
  customer_phone: string
  fulfillment: 'pickup' | 'delivery'
  address: string | null
  notes: string | null
  total_cents: number
  delivery_fee_cents: number
  status: string
  created_at: string
  items: { name: string; price_cents: number; quantity: number }[]
}

const money = (cents: number) => '$' + (cents / 100).toLocaleString('en-US', { minimumFractionDigits: cents % 100 ? 2 : 0 })
const EMPTY = { name: '', description: '', category: '', price: '', price_mode: 'fixed' as 'fixed' | 'quote', image_url: '' as string, is_active: true }

// Shrink a photo in the browser so it is stored as a small JPEG
function resizeImage(file: File, max = 800): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.8))
    }
    img.onerror = reject
    img.src = url
  })
}

export default function ShopDashboardPage() {
  const { language } = useLanguage()
  const es = language === 'es'
  const t = (a: string, b: string) => (es ? a : b)

  const [tab, setTab] = useState<'products' | 'orders' | 'settings'>('products')
  const [business, setBusiness] = useState<any>(null)
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(true)
  const [allowed, setAllowed] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [settings, setSettings] = useState<any>({ enabled: false, pickup_enabled: true, delivery_enabled: false, delivery_fee_cents: 0, delivery_note: '' })
  const [feeText, setFeeText] = useState('0')
  const [message, setMessage] = useState<{ type: 'success' | 'danger'; text: string } | null>(null)
  const [editing, setEditing] = useState<Product | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const headers = (tk = token) => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${tk}` })

  useEffect(() => {
    const load = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user') || 'null')
        const tk = localStorage.getItem('token') || ''
        if (!user || !tk) { window.location.href = '/login'; return }
        const biz = JSON.parse(localStorage.getItem(`currentBusiness_${user.id}`) || localStorage.getItem('currentBusiness') || 'null')
        if (!biz) { setLoading(false); return }
        setBusiness(biz); setToken(tk)
        const [p, s, o] = await Promise.all([
          fetch(`/api/businesses/${biz.id}/products`, { headers: headers(tk) }).then(r => r.json()),
          fetch(`/api/businesses/${biz.id}/shop`, { headers: headers(tk) }).then(r => r.json()),
          fetch(`/api/businesses/${biz.id}/orders`, { headers: headers(tk) }).then(r => r.json())
        ])
        setProducts(p.products || [])
        setOrders(o.orders || [])
        if (s.settings) { setSettings(s.settings); setFeeText(String((s.settings.delivery_fee_cents || 0) / 100)) }
        setAllowed(s.allowed !== false)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const flash = (type: 'success' | 'danger', text: string) => { setMessage({ type, text }); setTimeout(() => setMessage(null), 4000) }

  const openNew = () => { setEditing(null); setForm(EMPTY); setShowModal(true) }
  const openEdit = (p: Product) => {
    setEditing(p)
    setForm({ name: p.name, description: p.description || '', category: p.category || '', price: String(p.price_cents / 100), price_mode: p.price_mode, image_url: p.image_url || '', is_active: p.is_active })
    setShowModal(true)
  }

  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!business) return
    setSaving(true)
    try {
      const payload = { ...(editing ? { id: editing.id } : {}), ...form, price_cents: Math.round((parseFloat(form.price) || 0) * 100) }
      const r = await fetch(`/api/businesses/${business.id}/products`, { method: editing ? 'PUT' : 'POST', headers: headers(), body: JSON.stringify(payload) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.code === 'upgrade' ? t('La tienda es una función del plan Pro.', 'The shop is a Pro feature.') : d.error)
      setProducts(prev => editing ? prev.map(p => (p.id === d.product.id ? d.product : p)) : [d.product, ...prev])
      setShowModal(false)
    } catch (err: any) {
      flash('danger', err.message || 'Error')
    } finally {
      setSaving(false)
    }
  }

  const removeProduct = async (p: Product) => {
    if (!business || !confirm(t(`¿Eliminar "${p.name}"?`, `Delete "${p.name}"?`))) return
    await fetch(`/api/businesses/${business.id}/products?id=${p.id}`, { method: 'DELETE', headers: headers() })
    setProducts(prev => prev.filter(x => x.id !== p.id))
  }

  const saveSettings = async () => {
    if (!business) return
    const body = { ...settings, delivery_fee_cents: Math.round((parseFloat(feeText) || 0) * 100) }
    const r = await fetch(`/api/businesses/${business.id}/shop`, { method: 'PUT', headers: headers(), body: JSON.stringify(body) })
    const d = await r.json()
    if (!r.ok) return flash('danger', d.code === 'upgrade' ? t('La tienda es una función del plan Pro.', 'The shop is a Pro feature.') : d.error)
    flash('success', t('Guardado', 'Saved'))
  }

  const setStatus = async (o: Order, status: string) => {
    if (!business) return
    await fetch(`/api/businesses/${business.id}/orders`, { method: 'PATCH', headers: headers(), body: JSON.stringify({ id: o.id, status }) })
    setOrders(prev => prev.map(x => (x.id === o.id ? { ...x, status } : x)))
  }

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f || !f.type.startsWith('image/')) return
    try { setForm(prev => ({ ...prev, image_url: '' })); const data = await resizeImage(f); setForm(prev => ({ ...prev, image_url: data })) } catch { flash('danger', t('No se pudo leer la imagen', 'Could not read the image')) }
  }

  if (loading) return <div className="text-center py-5"><Spinner animation="border" variant="success" /></div>
  if (!business) return <Alert variant="warning">{t('Primero crea un negocio.', 'Create a business first.')}</Alert>

  const shopUrl = typeof window !== 'undefined' ? `${window.location.origin}/shop/${business.slug}` : ''
  const statusLabel: Record<string, string> = es
    ? { new: 'Nuevo', confirmed: 'Confirmado', ready: 'Listo', completed: 'Completado', cancelled: 'Cancelado' }
    : { new: 'New', confirmed: 'Confirmed', ready: 'Ready', completed: 'Completed', cancelled: 'Cancelled' }
  const newCount = orders.filter(o => o.status === 'new').length

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div>
          <h2 className="fw-bold mb-0">{t('Tienda', 'Shop')}</h2>
          <p className="text-muted mb-0">{t('Vende productos, menús o pide cotizaciones.', 'Sell products or menus, or take quote requests.')}</p>
        </div>
        {settings.enabled && (
          <Link href={`/shop/${business.slug}`} target="_blank" className="btn btn-outline-success btn-sm">
            <i className="fas fa-external-link-alt me-2"></i>{t('Ver mi tienda', 'View my shop')}
          </Link>
        )}
      </div>

      {!allowed && (
        <Alert variant="info">
          <i className="fas fa-lock me-2"></i>
          {t('La tienda está incluida en el plan Pro. Puedes preparar tus productos, pero necesitas Pro para publicarla.', 'The shop is included in the Pro plan. You can prepare your products, but you need Pro to publish it.')}{' '}
          <Link href="/dashboard/settings">{t('Mejorar plan', 'Upgrade plan')}</Link>
        </Alert>
      )}
      {message && <Alert variant={message.type}>{message.text}</Alert>}

      <Nav variant="pills" className="shop-pills mb-3 gap-1" activeKey={tab} onSelect={k => setTab((k as any) || 'products')}>
        <Nav.Item><Nav.Link eventKey="products">{t('Productos', 'Products')}</Nav.Link></Nav.Item>
        <Nav.Item><Nav.Link eventKey="orders">{t('Pedidos', 'Orders')} {newCount > 0 && <Badge bg="danger" pill>{newCount}</Badge>}</Nav.Link></Nav.Item>
        <Nav.Item><Nav.Link eventKey="settings">{t('Ajustes', 'Settings')}</Nav.Link></Nav.Item>
      </Nav>

      {tab === 'products' && (
        <>
          <Button variant="success" className="mb-3" onClick={openNew}><i className="fas fa-plus me-2"></i>{t('Agregar producto', 'Add product')}</Button>
          {products.length === 0 ? (
            <Card body className="text-center text-muted py-5">
              {t('Aún no tienes productos. Agrega tu menú, piezas o proyectos.', 'No products yet. Add your menu, parts or projects.')}
            </Card>
          ) : (
            <div className="d-grid gap-2">
              {products.map(p => (
                <Card key={p.id} className={p.is_active ? '' : 'opacity-50'}>
                  <Card.Body className="d-flex align-items-center gap-3 py-2">
                    <div className="shop-thumb">{p.image_url ? <img src={p.image_url} alt="" /> : <i className="fas fa-image"></i>}</div>
                    <div className="flex-grow-1" style={{ minWidth: 0 }}>
                      <div className="fw-semibold">{p.name}</div>
                      <div className="small text-muted">{p.category || t('Sin categoría', 'No category')} · {p.price_mode === 'quote' ? t('Cotización', 'Quote') : money(p.price_cents)}{!p.is_active && ` · ${t('Oculto', 'Hidden')}`}</div>
                    </div>
                    <Button variant="outline-secondary" size="sm" onClick={() => openEdit(p)}><i className="fas fa-pen"></i></Button>
                    <Button variant="outline-danger" size="sm" onClick={() => removeProduct(p)}><i className="fas fa-trash"></i></Button>
                  </Card.Body>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'orders' && (
        orders.length === 0 ? (
          <Card body className="text-center text-muted py-5">{t('Aún no hay pedidos.', 'No orders yet.')}</Card>
        ) : (
          <div className="d-grid gap-3">
            {orders.map(o => (
              <Card key={o.id}>
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start gap-2">
                    <div>
                      <div className="fw-bold">{o.customer_name} {o.kind === 'quote' && <Badge bg="warning" text="dark">{t('Cotización', 'Quote')}</Badge>}</div>
                      <a href={`https://wa.me/${o.customer_phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="small"><i className="fab fa-whatsapp text-success me-1"></i>{o.customer_phone}</a>
                    </div>
                    <div className="text-end">
                      <div className="fw-bold text-success">{o.kind === 'quote' ? t('Por cotizar', 'To quote') : money(o.total_cents)}</div>
                      <div className="small text-muted">{new Date(o.created_at).toLocaleString(es ? 'es-PR' : 'en-US', { dateStyle: 'short', timeStyle: 'short' })}</div>
                    </div>
                  </div>
                  <ul className="small mt-2 mb-2 ps-3">
                    {o.items.map((i, k) => <li key={k}>{i.quantity} × {i.name}</li>)}
                  </ul>
                  <div className="small text-muted mb-2">
                    <i className={`fas ${o.fulfillment === 'delivery' ? 'fa-truck' : 'fa-store'} me-1`}></i>
                    {o.fulfillment === 'delivery' ? `${t('Entrega', 'Delivery')}: ${o.address}` : t('Recogido en el negocio', 'Pickup')}
                    {o.notes && <div><i className="far fa-comment me-1"></i>{o.notes}</div>}
                  </div>
                  <Form.Select size="sm" value={o.status} onChange={e => setStatus(o, e.target.value)} style={{ maxWidth: 200 }}>
                    {Object.keys(statusLabel).map(k => <option key={k} value={k}>{statusLabel[k]}</option>)}
                  </Form.Select>
                </Card.Body>
              </Card>
            ))}
          </div>
        )
      )}

      {tab === 'settings' && (
        <Card body style={{ maxWidth: 560 }}>
          <Form.Check type="switch" id="shop-enabled" className="mb-3 fs-5" label={t('Tienda abierta al público', 'Shop open to the public')} checked={!!settings.enabled} onChange={e => setSettings({ ...settings, enabled: e.target.checked })} />
          <div className="fw-semibold mb-1">{t('¿Cómo entregas?', 'How do you fulfill orders?')}</div>
          <Form.Check type="checkbox" id="pickup" label={t('Recogido en el negocio', 'Pickup')} checked={!!settings.pickup_enabled} onChange={e => setSettings({ ...settings, pickup_enabled: e.target.checked })} />
          <Form.Check type="checkbox" id="delivery" label={t('Entrega a domicilio', 'Delivery')} checked={!!settings.delivery_enabled} onChange={e => setSettings({ ...settings, delivery_enabled: e.target.checked })} className="mb-3" />
          {settings.delivery_enabled && (
            <>
              <Form.Group className="mb-3">
                <Form.Label>{t('Cargo de entrega ($)', 'Delivery fee ($)')}</Form.Label>
                <Form.Control type="number" min="0" step="0.01" inputMode="decimal" value={feeText} onChange={e => setFeeText(e.target.value)} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>{t('Nota de entrega (zona, horario)', 'Delivery note (area, hours)')}</Form.Label>
                <Form.Control placeholder={t('Ej: Entregas en el pueblo, 11am–2pm', 'e.g. Downtown deliveries, 11am–2pm')} value={settings.delivery_note || ''} onChange={e => setSettings({ ...settings, delivery_note: e.target.value })} />
              </Form.Group>
            </>
          )}
          <Alert variant="light" className="small">{t('Por ahora el pago se coordina directamente con el cliente (efectivo, ATH Móvil, etc.) al recoger o entregar.', 'For now, payment is handled directly with the customer (cash, ATH Móvil, etc.) at pickup or delivery.')}</Alert>
          <Button variant="success" onClick={saveSettings}>{t('Guardar', 'Save')}</Button>
          {settings.enabled && shopUrl && (
            <div className="mt-3 small text-muted">{t('Tu enlace', 'Your link')}: <a href={shopUrl} target="_blank" rel="noreferrer">{shopUrl}</a></div>
          )}
        </Card>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)} centered fullscreen="sm-down">
        <Form onSubmit={saveProduct}>
          <Modal.Header closeButton><Modal.Title>{editing ? t('Editar producto', 'Edit product') : t('Nuevo producto', 'New product')}</Modal.Title></Modal.Header>
          <Modal.Body>
            <div className="mb-3 d-flex align-items-center gap-3">
              <div className="shop-thumb lg">{form.image_url ? <img src={form.image_url} alt="" /> : <i className="fas fa-image fa-lg"></i>}</div>
              <div>
                <Button type="button" variant="outline-secondary" size="sm" onClick={() => fileRef.current?.click()}>{t('Subir foto', 'Upload photo')}</Button>
                {form.image_url && <Button type="button" variant="link" size="sm" className="text-danger" onClick={() => setForm({ ...form, image_url: '' })}>{t('Quitar', 'Remove')}</Button>}
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickFile} />
              </div>
            </div>
            <Form.Group className="mb-3"><Form.Label>{t('Nombre', 'Name')} *</Form.Label><Form.Control required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Form.Group>
            <Form.Group className="mb-3"><Form.Label>{t('Categoría', 'Category')}</Form.Label><Form.Control placeholder={t('Ej: Platos, Frenos, Cocinas', 'e.g. Meals, Brakes, Kitchens')} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /></Form.Group>
            <Form.Group className="mb-3"><Form.Label>{t('Descripción', 'Description')}</Form.Label><Form.Control as="textarea" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>{t('Precio', 'Pricing')}</Form.Label>
              <Form.Select value={form.price_mode} onChange={e => setForm({ ...form, price_mode: e.target.value as any })} className="mb-2">
                <option value="fixed">{t('Precio fijo', 'Fixed price')}</option>
                <option value="quote">{t('Pedir cotización (sin precio)', 'Request a quote (no price)')}</option>
              </Form.Select>
              {form.price_mode === 'fixed' && <Form.Control type="number" min="0" step="0.01" inputMode="decimal" required placeholder="0.00" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />}
            </Form.Group>
            <Form.Check type="switch" id="active" label={t('Visible en la tienda', 'Visible in the shop')} checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShowModal(false)}>{t('Cancelar', 'Cancel')}</Button>
            <Button type="submit" variant="success" disabled={saving}>{saving ? <Spinner size="sm" animation="border" /> : t('Guardar', 'Save')}</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  )
}
