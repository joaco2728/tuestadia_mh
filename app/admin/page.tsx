'use client'

import { useEffect, useState } from 'react'
import { supabase, Property } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Plus, LogOut, Home, Users, Loader2, X, Check, Upload } from 'lucide-react'

export default function AdminPanel() {
  const router = useRouter()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [previewImages, setPreviewImages] = useState<string[]>([])
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState(false)
  const [form, setForm] = useState({
    name: '', description: '', address: '',
    capacity: '4', bedrooms: '2', bathrooms: '1',
    price_per_night: '', owner_name: '', owner_phone: '',
  })

  useEffect(() => {
    checkAuth()
    loadProperties()
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/admin/login'); return }
    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') router.push('/admin/login')
  }

  const loadProperties = async () => {
    const { data } = await supabase
      .from('properties').select('*').order('created_at', { ascending: false })
    setProperties(data || [])
    setLoading(false)
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    setImageFiles(prev => [...prev, ...files])
    const previews = files.map(f => URL.createObjectURL(f))
    setPreviewImages(prev => [...prev, ...previews])
  }

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index))
    setPreviewImages(prev => prev.filter((_, i) => i !== index))
  }

  const uploadImages = async (propertyId: string): Promise<string[]> => {
    const urls: string[] = []
    for (const file of imageFiles) {
      const ext = file.name.split('.').pop()
      const path = `${propertyId}/${Date.now()}.${ext}`
      const { error } = await supabase.storage
        .from('property-images')
        .upload(path, file, { cacheControl: '3600', upsert: false })
      if (!error) {
        const { data } = supabase.storage
          .from('property-images')
          .getPublicUrl(path)
        urls.push(data.publicUrl)
      }
    }
    return urls
  }

  const handleSave = async () => {
    if (!form.name || !form.price_per_night) {
      alert('Completá nombre y precio.')
      return
    }
    setSaving(true)
    setUploadingImages(true)

    const { data: newProp, error } = await supabase.from('properties').insert([{
      name: form.name,
      description: form.description,
      address: form.address,
      capacity: parseInt(form.capacity),
      bedrooms: parseInt(form.bedrooms),
      bathrooms: parseInt(form.bathrooms),
      price_per_night: parseInt(form.price_per_night),
      owner_name: form.owner_name,
      owner_phone: form.owner_phone,
      images: [],
      amenities: [],
    }])
    .select()
    .single()

    if (error || !newProp) {
      setSaving(false)
      setUploadingImages(false)
      alert('Error al guardar.')
      return
    }

    let imageUrls: string[] = []
    if (imageFiles.length > 0) {
      imageUrls = await uploadImages(newProp.id)
      await supabase.from('properties').update({ images: imageUrls }).eq('id', newProp.id)
    }

    setUploadingImages(false)
    setSaving(false)
    setShowForm(false)
    setForm({ name: '', description: '', address: '', capacity: '4', bedrooms: '2', bathrooms: '1', price_per_night: '', owner_name: '', owner_phone: '' })
    setImageFiles([])
    setPreviewImages([])
    loadProperties()
  }

  const handleInvite = async () => {
    if (!inviteEmail) return
    setInviting(true)
    const { error } = await supabase.auth.admin.inviteUserByEmail(inviteEmail)
    setInviting(false)
    if (!error) {
      setInviteSuccess(true)
      setInviteEmail('')
      setTimeout(() => setInviteSuccess(false), 3000)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  return (
    <main className="min-h-screen" style={{ background: 'var(--cream)' }}>
      {/* Header */}
      <div style={{ background: 'var(--dusk)' }} className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-display text-white text-2xl italic" style={{ fontWeight: 300 }}>
            Encadenados
          </span>
          <span className="font-body text-xs text-white/30 border border-white/20 px-2 py-0.5 rounded-full">
            Admin
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1 font-body text-xs text-white/50 hover:text-white transition-colors"
        >
          <LogOut size={14} /> Salir
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Home size={18} className="text-[var(--ocean-deep)]" />
              <span className="font-body text-xs uppercase tracking-widest text-[var(--dusk)]/40">
                Propiedades
              </span>
            </div>
            <p className="font-display text-4xl text-[var(--dusk)]" style={{ fontWeight: 300 }}>
              {properties.length}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Users size={18} className="text-[var(--ocean-deep)]" />
              <span className="font-body text-xs uppercase tracking-widest text-[var(--dusk)]/40">
                Invitar propietario
              </span>
            </div>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="email@ejemplo.com"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleInvite()}
                className="flex-1 px-3 py-2 rounded-lg font-body text-sm border border-[var(--dusk)]/10 focus:outline-none focus:border-[var(--ocean-deep)] transition-colors"
              />
              <button
                onClick={handleInvite}
                disabled={inviting}
                className="px-4 py-2 rounded-lg font-body text-sm text-white flex items-center gap-1 disabled:opacity-50"
                style={{ background: 'var(--ocean-deep)' }}
              >
                {inviting ? <Loader2 size={14} className="animate-spin" /> :
                 inviteSuccess ? <Check size={14} /> : 'Invitar'}
              </button>
            </div>
          </div>
        </div>

        {/* Properties */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-3xl text-[var(--dusk)]" style={{ fontWeight: 300 }}>
            Propiedades
          </h2>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 font-body text-sm text-white px-4 py-2 rounded-full transition-all hover:opacity-90"
            style={{ background: 'var(--ocean-deep)' }}
          >
            <Plus size={16} /> Nueva propiedad
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-[var(--dusk)]/30" />
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl">
            <p className="font-display text-2xl text-[var(--dusk)]/30" style={{ fontWeight: 300 }}>
              Todavía no hay propiedades
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 font-body text-sm text-[var(--ocean-deep)] underline"
            >
              Agregar la primera
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {properties.map(p => (
              <div key={p.id} className="bg-white rounded-2xl p-5 shadow-sm flex gap-4">
                <div
                  className="w-20 h-20 rounded-xl flex-shrink-0 bg-cover bg-center"
                  style={{
                    backgroundImage: p.images?.[0]
                      ? `url(${p.images[0]})`
                      : `url(https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&q=80)`
                  }}
                />
                <div className="min-w-0">
                  <h3 className="font-display text-lg text-[var(--dusk)] truncate" style={{ fontWeight: 400 }}>
                    {p.name}
                  </h3>
                  <p className="font-body text-xs text-[var(--dusk)]/50 mb-2">{p.address}</p>
                  <p className="font-body text-sm font-medium text-[var(--ocean-deep)]">
                    ${p.price_per_night.toLocaleString('es-AR')}/noche
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal nueva propiedad */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(26,31,46,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-2xl text-[var(--dusk)]" style={{ fontWeight: 400 }}>
                Nueva propiedad
              </h3>
              <button onClick={() => setShowForm(false)}>
                <X size={20} className="text-[var(--dusk)]/40" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Upload de fotos */}
              <div>
                <label className="font-body text-xs uppercase tracking-widest text-[var(--dusk)]/40 mb-2 block">
                  Fotos de la propiedad
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {previewImages.map((src, i) => (
                    <div key={i} className="relative w-20 h-20">
                      <img src={src} alt="" className="w-20 h-20 object-cover rounded-xl" />
                      <button
                        onClick={() => removeImage(i)}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                  <label className="w-20 h-20 rounded-xl border-2 border-dashed border-[var(--dusk)]/20 flex flex-col items-center justify-center cursor-pointer hover:border-[var(--ocean-deep)] transition-colors">
                    <Upload size={16} className="text-[var(--dusk)]/30" />
                    <span className="font-body text-[10px] text-[var(--dusk)]/30 mt-1">Agregar</span>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
                  </label>
                </div>
              </div>
              {[
                { label: 'Nombre *', key: 'name', placeholder: 'Casa La Dunas' },
                { label: 'Dirección', key: 'address', placeholder: 'Calle 25 N°480, Monte Hermoso' },
                { label: 'Precio por noche (ARS) *', key: 'price_per_night', placeholder: '120000', type: 'number' },
                { label: 'Nombre del propietario', key: 'owner_name', placeholder: 'Carlos Méndez' },
                { label: 'Teléfono del propietario', key: 'owner_phone', placeholder: '+54 291 ...' },
              ].map(f => (
                <div key={f.key}>
                  <label className="font-body text-xs uppercase tracking-widest text-[var(--dusk)]/40 mb-1 block">
                    {f.label}
                  </label>
                  <input
                    type={f.type || 'text'}
                    placeholder={f.placeholder}
                    value={form[f.key as keyof typeof form]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl font-body text-sm border border-[var(--dusk)]/10 focus:border-[var(--ocean-deep)] focus:outline-none transition-colors"
                  />
                </div>
              ))}

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Habitaciones', key: 'bedrooms' },
                  { label: 'Baños', key: 'bathrooms' },
                  { label: 'Capacidad', key: 'capacity' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="font-body text-xs uppercase tracking-widest text-[var(--dusk)]/40 mb-1 block">
                      {f.label}
                    </label>
                    <input
                      type="number" min="1"
                      value={form[f.key as keyof typeof form]}
                      onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl font-body text-sm border border-[var(--dusk)]/10 focus:border-[var(--ocean-deep)] focus:outline-none transition-colors"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="font-body text-xs uppercase tracking-widest text-[var(--dusk)]/40 mb-1 block">
                  Descripción
                </label>
                <textarea
                  rows={3}
                  placeholder="Descripción de la propiedad..."
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl font-body text-sm border border-[var(--dusk)]/10 focus:border-[var(--ocean-deep)] focus:outline-none transition-colors resize-none"
                />
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3 rounded-xl font-body font-medium text-white flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: 'var(--ocean-deep)' }}
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                {saving ? uploadingImages ? 'Subiendo fotos...' : 'Guardando...' : 'Guardar propiedad'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}