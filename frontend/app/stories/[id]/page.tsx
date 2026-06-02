import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ id: string }>
}

export default async function StoryDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: story, error } = await supabase
    .from('stories')
    .select('id, title, content, theme, duration_min, created_at, ai_tier_used')
    .eq('id', id)
    .single()

  if (error || !story) notFound()

  const date = new Date(story.created_at).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <main className="min-h-screen bg-[#0D0A12] px-4 py-10 max-w-lg mx-auto flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-serif text-[#F0EAE0] leading-snug">{story.title}</h1>
        <p className="text-[#8A7FA0] text-xs capitalize">
          {story.theme} - {story.duration_min} min - {date}
        </p>
      </div>

      {/* Story text */}
      <div className="bg-[#16121F] border border-[#2A2240] rounded-xl p-5">
        <p className="text-[#F0EAE0] leading-relaxed text-base whitespace-pre-wrap font-serif">
          {story.content}
        </p>
      </div>

      {/* Synthesize CTA — Module 3 */}
      <a
        href={`/player?storyId=${story.id}`}
        className="w-full py-4 rounded-2xl bg-[#C4A35A] text-[#0D0A12] font-semibold text-base text-center block active:scale-95 transition-transform"
      >
        Generar audio con mi voz
      </a>
    </main>
  )
}
