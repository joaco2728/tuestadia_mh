'use client'
 
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Users, BedDouble, Bath, ChevronLeft,
  ChevronRight, MessageCircle, Loader2, ChevronLeftIcon
} from 'lucide-react'
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  eachDayOfInterval, isToday, parseISO, isBefore, startOfDay
} from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'
 
type Property = {
  id: string
  name: string
  description: string
  address: string
  capacity: number
  bedrooms: number
  bathrooms: number
  price_per_night: number
  base_price: number
  amenities: string[]
  images: string[]
  owner_name: string
  owner_phone: string
}
 
type DayData = {
  price: number | null
  is_available: boolean
}
 
export default function PropertyDetail() {
  const { id } = useParams()
  const router = useRouter()
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPhoto, setCurrentPhoto] = useState(0)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [dayData, setDayData] = useState<Record<string, DayData>>({})
 
  useEffect(() => {
    loadProperty()
  }, [id])
 
  useEffect(() => {
    if (property) loadAvailability()
  }, [property, currentMonth])
 
  const loadProperty = async () => {
    const { data } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .single()
    setProperty(data)
    setLoading(false)
  }
 
  const loadAvailability = async () => {
    if (!property) return
    const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd')
    const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd')
 
    const { data: exceptions } = await supabase
      .from('price_exceptions')
      .select('*')
      .eq('property_id', property.id)
      .gte('date', start)
      .lte('date', end)
 
    const map: Record<string, DayData> = {}
    for (const exc of exceptions || []) {
      map[exc.date] = {
        price: exc.price,
        is_available: exc.is_available,
      }
    }
    setDayData(map)
  }
 
  const getDayStyle = (dateStr: string) => {
    const past = isBefore(parseISO(dateStr), startOfDay(new Date()))
    if (past) return 'text-[var(--dusk)]/20 cursor-default'
    const data = dayData[dateStr]
    if (data && !data.is_available) return 'bg-red-50 text-red-300 line-through cursor-not-allowed'
    if (data?.price && property && data.price !== property.base_price)
      return 'bg-amber-50 text-amber-700 border border-amber-200 cursor-pointer hover:bg-amber-100'
    return 'bg-emerald-50 text-emerald-700 cursor-pointer hover:bg-emerald-100'
  }
 
  const getPrice = (dateStr: string) => {
    const data = dayData[dateStr]
    if (data?.price) return data.price
    return property?.base_price || property?.price_per_night || 0
  }
 
  const handleWhatsApp = () => {
    if (!property) return
    const msg = encodeURIComponent(
      `Hola! Me interesa la propiedad "${property.name}" en Monte Hermoso. ¿Podés darme más información sobre disponibilidad?`
    )
    const phone = property.owner_phone?.replace(/\D/g, '') || ''
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank')
  }
 
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--cream)' }}>
        <Loader2 size={24} className="animate-spin text-[var(--dusk)]/30" />
      </div>
    )
  }
 
  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--cream)' }}>
        <p className="font-display text-2xl text-[var(--dusk)]/30">Propiedad no encontrada.</p>
      </div>
    )
  }
 
  const photos = property.images?.length > 0
    ? property.images
    : ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80']
 
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startWeekday = monthStart.getDay()
 
  return (
    <main className="min-h-screen" style={{ background: 'var(--cream)' }}>
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-[var(--dusk)]/5 px-4 py-3 flex items-center gap-3">
        <Link href="/" className="flex items-center gap-1 font-body text-sm text-[var(--dusk)]/50 hover:text-[var(--dusk)] transition-colors">
          <ArrowLeft size={16} /> Volver
        </Link>
        <span className="font-display text-lg text-[var(--dusk)] ml-2" style={{ fontWeight: 400 }}>
          {property.name}
        </span>
      </nav>
 
      <div className="max-w-4xl mx-auto px-4 py-8">
 
        {/* Galería */}
        <div className="relative rounded-2xl overflow-hidden mb-8 bg-gray-100" style={{ height: '420px' }}>
          <img
            src={photos[currentPhoto]}
            alt={property.name}
            className="w-full h-full object-cover transition-opacity duration-300"
          />
 
          {/* Controles galería */}
          {photos.length > 1 && (
            <>
              <button
                onClick={() => setCurrentPhoto(p => (p - 1 + photos.length) % photos.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => setCurrentPhoto(p => (p + 1) % photos.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-all"
              >
                <ChevronRight size={20} />
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                {photos.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPhoto(i)}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentPhoto ? 'bg-white' : 'bg-white/50'}`}
                  />
                ))}
              </div>
            </>
          )}
 
          {/* Miniaturas */}
          {photos.length > 1 && (
            <div className="absolute bottom-4 right-4 flex gap-2">
              {photos.slice(0, 4).map((photo, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPhoto(i)}
                  className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${i === currentPhoto ? 'border-white' : 'border-transparent opacity-70'}`}
                >
                  <img src={photo} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
 
        <div className="grid md:grid-cols-3 gap-8">
          {/* Info principal */}
          <div className="md:col-span-2">
            <div className="mb-6">
              <h1 className="font-display text-4xl text-[var(--dusk)] mb-1" style={{ fontWeight: 300 }}>
                {property.name}
              </h1>
              <p className="font-body text-sm text-[var(--dusk)]/50">{property.address}</p>
            </div>
 
            {/* Características */}
            <div className="flex gap-6 mb-6 pb-6 border-b border-[var(--dusk)]/5">
              <div className="flex items-center gap-2 font-body text-sm text-[var(--dusk)]/70">
                <Users size={16} /> {property.capacity} personas
              </div>
              <div className="flex items-center gap-2 font-body text-sm text-[var(--dusk)]/70">
                <BedDouble size={16} /> {property.bedrooms} habitaciones
              </div>
              <div className="flex items-center gap-2 font-body text-sm text-[var(--dusk)]/70">
                <Bath size={16} /> {property.bathrooms} baños
              </div>
            </div>
 
            {/* Descripción */}
            {property.description && (
              <div className="mb-8">
                <h2 className="font-display text-2xl text-[var(--dusk)] mb-3" style={{ fontWeight: 300 }}>
                  Sobre la propiedad
                </h2>
                <p className="font-body text-sm text-[var(--dusk)]/60 leading-relaxed">
                  {property.description}
                </p>
              </div>
            )}
 
            {/* Calendario */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <button
                  onClick={() => setCurrentMonth(m => subMonths(m, 1))}
                  className="p-2 rounded-full hover:bg-[var(--dusk)]/5 transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <h3 className="font-display text-xl text-[var(--dusk)] capitalize" style={{ fontWeight: 400 }}>
                  {format(currentMonth, 'MMMM yyyy', { locale: es })}
                </h3>
                <button
                  onClick={() => setCurrentMonth(m => addMonths(m, 1))}
                  className="p-2 rounded-full hover:bg-[var(--dusk)]/5 transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
 
              <div className="grid grid-cols-7 mb-2">
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
                  <div key={d} className="text-center font-body text-xs text-[var(--dusk)]/30 py-1">{d}</div>
                ))}
              </div>
 
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: startWeekday }).map((_, i) => <div key={`e-${i}`} />)}
                {calendarDays.map(day => {
                  const dateStr = format(day, 'yyyy-MM-dd')
                  const price = getPrice(dateStr)
                  return (
                    <div
                      key={dateStr}
                      className={`rounded-lg p-1 text-center transition-all ${getDayStyle(dateStr)} ${isToday(day) ? 'ring-2 ring-[var(--ocean-deep)]' : ''}`}
                    >
                      <p className="font-body text-sm">{format(day, 'd')}</p>
                      {price > 0 && (
                        <p className="font-body text-[9px] opacity-60 hidden md:block">
                          ${(price / 1000).toFixed(0)}k
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
 
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[var(--dusk)]/5">
                {[
                  { color: 'bg-emerald-100', label: 'Disponible' },
                  { color: 'bg-amber-100', label: 'Precio especial' },
                  { color: 'bg-red-100', label: 'No disponible' },
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <div className={`w-3 h-3 rounded-sm ${l.color}`} />
                    <span className="font-body text-xs text-[var(--dusk)]/40">{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
 
          {/* Sidebar precio + contacto */}
          <div className="md:col-span-1">
            <div className="sticky top-20 bg-white rounded-2xl p-5 shadow-sm">
              <div className="mb-4 pb-4 border-b border-[var(--dusk)]/5">
                <p className="font-body text-xs text-[var(--dusk)]/40 mb-1">Precio desde</p>
                <p className="font-display text-3xl text-[var(--dusk)]" style={{ fontWeight: 300 }}>
                  ${(property.base_price || property.price_per_night).toLocaleString('es-AR')}
                </p>
                <p className="font-body text-xs text-[var(--dusk)]/40">por noche</p>
              </div>
 
              <button
                onClick={handleWhatsApp}
                className="w-full py-3 rounded-xl font-body font-medium text-white flex items-center justify-center gap-2 hover:opacity-90 transition-all mb-3"
                style={{ background: '#25D366' }}
              >
                <MessageCircle size={18} /> Consultar por WhatsApp
              </button>
 
              <p className="font-body text-xs text-[var(--dusk)]/30 text-center">
                Te responden a la brevedad
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}