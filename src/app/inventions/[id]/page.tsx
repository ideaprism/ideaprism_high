import { getInventionById } from '@/utils/supabase/queries'
import { Button } from '@/components/ui/Button'
import { BadgeCheck, ArrowLeft, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function InventionDetailPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const invention = await getInventionById(id)

    if (!invention) {
        notFound()
    }

    const kiprisUrl = `http://kpat.kipris.or.kr/kpat/searchLogina.do?next=MainSearch#page1`

    return (
        <div className="container mx-auto px-4 py-8">
            <Link href="/search" className="inline-flex items-center text-on-surface-variant hover:text-primary mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-1" />
                목록으로 돌아가기
            </Link>

            <div className="bg-surface rounded-[32px] overflow-hidden shadow-sm border border-outline-variant/20">
                <div className="grid grid-cols-1 lg:grid-cols-2">
                    {/* Left Column: Image */}
                    <div className="bg-surface-variant/30 min-h-[400px] lg:min-h-[600px] p-8 flex items-center justify-center relative">
                        {invention.drawing_url ? (
                            <img
                                src={invention.drawing_url}
                                alt={invention.original_title}
                                className="max-w-full max-h-[500px] object-contain rounded-xl shadow-lg bg-surface"
                            />
                        ) : (
                            <div className="text-on-surface-variant">이미지가 없습니다</div>
                        )}
                        {/* Grade Badge Overlay */}
                        {invention.grades?.name && (
                            <div className="absolute top-6 left-6 px-3 py-1.5 bg-surface/90 backdrop-blur rounded-lg text-sm font-bold shadow-md">
                                {invention.grades.name}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Details */}
                    <div className="p-8 lg:p-12 flex flex-col">
                        <div className="mb-8">
                            <div className="flex items-center gap-2 mb-2 text-primary font-medium">
                                {invention.categories?.name && (
                                    <span className="flex items-center gap-1">
                                        <BadgeCheck className="w-5 h-5" />
                                        {invention.categories.name}
                                    </span>
                                )}
                            </div>
                            <h1 className="text-3xl lg:text-4xl font-bold text-on-surface mb-4 leading-tight">
                                {invention.original_title}
                            </h1>
                        </div>

                        <div className="space-y-8 flex-1">
                            {/* Problem Tags - Chips */}
                            {invention.problem_tag && (
                                <div>
                                    <h3 className="text-sm font-semibold text-on-surface-variant mb-3 uppercase tracking-wider">문제유형</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {invention.problem_tag.split(',').map((tag: string, idx: number) => {
                                            const tagName = tag.trim()
                                            if (!tagName) return null
                                            return (
                                                <Link key={idx} href={`/search?problem=${tagName}`}>
                                                    <span className="px-3 py-1 rounded-full text-sm bg-primary-container text-on-primary-container hover:opacity-80 transition-opacity cursor-pointer">
                                                        #{tagName}
                                                    </span>
                                                </Link>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* SCAMPER Tags - Chips */}
                            {invention.scamper && (
                                <div>
                                    <h3 className="text-sm font-semibold text-on-surface-variant mb-3 uppercase tracking-wider">SCAMPER</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {invention.scamper.split(',').map((tag: string, idx: number) => {
                                            const tagName = tag.trim()
                                            if (!tagName) return null
                                            return (
                                                <Link key={idx} href={`/search?scamper=${tagName}`}>
                                                    <span className="px-3 py-1 rounded-full text-sm bg-secondary-container text-on-secondary-container hover:opacity-80 transition-opacity cursor-pointer">
                                                        {tagName}
                                                    </span>
                                                </Link>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className="prose prose-lg max-w-none text-on-surface-variant">
                                {invention.invention_motive && (
                                    <div className="mb-6">
                                        <h3 className="text-lg font-bold text-on-surface mb-2">발명 동기</h3>
                                        <p className="whitespace-pre-line text-base">{invention.invention_motive}</p>
                                    </div>
                                )}
                                {invention.problem && (
                                    <div className="mb-6">
                                        <h3 className="text-lg font-bold text-on-surface mb-2">해결하려는 문제</h3>
                                        <p className="whitespace-pre-line text-base">{invention.problem}</p>
                                    </div>
                                )}
                                {invention.solution && (
                                    <div className="mb-6">
                                        <h3 className="text-lg font-bold text-on-surface mb-2">해결방법 및 효과</h3>
                                        <p className="whitespace-pre-line text-base">{invention.solution}</p>
                                    </div>
                                )}
                                {(!invention.problem && !invention.solution && invention.simple_summary) && (
                                    <div className="mb-6">
                                        <h3 className="text-lg font-bold text-on-surface mb-2">요약</h3>
                                        <p className="whitespace-pre-line text-base">{invention.simple_summary}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-12 pt-8 border-t border-outline-variant/30">
                            <a
                                href={`http://kpat.kipris.or.kr/kpat/searchLogina.do?next=MainSearch`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Button variant="filled" fullWidth className="h-14 text-lg gap-2">
                                    <ExternalLink className="w-5 h-5" />
                                    KIPRIS에서 특허 검색하기
                                </Button>
                            </a>
                            <p className="text-center text-xs text-on-surface-variant mt-3">
                                * 버튼을 클릭하여 특허청 검색 사이트에서 유사한 아이디어가 있는지 확인해보세요.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
