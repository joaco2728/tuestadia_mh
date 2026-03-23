'use client'

import { useEffect, useState } from 'react'
import { supabase, Property } from '@/lib/supabase'
import { Users, BedDouble, Bath, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function PropertyGrid() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false })
      setProperties(data || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-2xl overflow-hidden">
            <div className="skeleton h-52 w-full" />
            <div className="p-5 space-y-3">
              <div className="skeleton h-5 w-3/4" />
              <div className="skeleton h-4 w-1/2" />
              <div className="skeleton h-4 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (properties.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="font-display text-3xl text-[var(--dusk)]/30" style={{ fontWeight: 300 }}>
          Las propiedades se cargan pronto.
        </p>
        <p className="font-body text-sm text-[var(--dusk)]/40 mt-2">
          Si sos propietario, <a href="/propietarios" className="underline">registrá tu propiedad</a>.
        </p>
      </div>
    )
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" id="propiedades">
      {properties.map((p, i) => (
        <PropertyCard key={p.id} property={p} index={i} />
      ))}
    </div>
  )
}

function PropertyCard({ property: p, index }: { property: Property; index: number }) {
  const img = p.images?.[0] || `https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80`

  return (
    <Link
      href={`/propiedad/${p.id}`}
      className="group rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-xl transition-all duration-500 opacity-0 animate-fade-up cursor-pointer block"
      style={{ animationDelay: `${index * 0.08}s`, animationFillMode: 'forwards' }}
    >
      {/* Image */}
      <div className="relative h-52 overflow-hidden">
        <img
          src={img}
          alt={p.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
          <span className="font-body text-xs font-medium text-[var(--dusk)]">
            ${p.price_per_night.toLocaleString('es-AR')}/noche
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-display text-xl text-[var(--dusk)] mb-1" style={{ fontWeight: 400 }}>
          {p.name}
        </h3>
        <p className="font-body text-xs text-[var(--dusk)]/50 mb-4">{p.address}</p>

        <div className="flex items-center gap-4 text-[var(--dusk)]/60">
          <span className="flex items-center gap-1 font-body text-xs">
            <Users size={13} /> {p.capacity} personas
          </span>
          <span className="flex items-center gap-1 font-body text-xs">
            <BedDouble size={13} /> {p.bedrooms} hab.
          </span>
          <span className="flex items-center gap-1 font-body text-xs">
            <Bath size={13} /> {p.bathrooms} baño{p.bathrooms !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="mt-4 flex justify-end">
          <span className="flex items-center gap-1 font-body text-xs text-[var(--ocean-deep)] opacity-0 group-hover:opacity-100 transition-opacity">
            Ver disponibilidad <ArrowRight size={12} />
          </span>
        </div>
      </div>
    </Link>
  )
}
