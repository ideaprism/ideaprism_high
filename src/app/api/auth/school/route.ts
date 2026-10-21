import { NextRequest, NextResponse } from 'next/server'
import { SCHOOL_ACCESS_CODES } from '@/config/school-codes'
import { getSchoolBySlug, isSchoolSlug } from '@/config/schools'
import { findSchoolSlugByCode } from '@/lib/school-access'
import {
  SCHOOL_SESSION_COOKIE,
  SCHOOL_SESSION_MAX_AGE,
  createSchoolSessionToken,
} from '@/lib/school-token'

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { code?: string }
    const slug = findSchoolSlugByCode(body.code ?? '', SCHOOL_ACCESS_CODES)

    if (!slug || !isSchoolSlug(slug)) {
      return NextResponse.json({
        ok: false,
        message: '학교 코드가 맞지 않습니다. 다시 확인해 주세요.',
      })
    }

    const school = getSchoolBySlug(slug)
    if (!school) {
      return NextResponse.json({
        ok: false,
        message: '학교 정보를 찾지 못했습니다.',
      })
    }

    const token = await createSchoolSessionToken(school.slug)
    const response = NextResponse.json({
      ok: true,
      school: {
        slug: school.slug,
        name: school.name,
        shortName: school.shortName,
        region: school.region,
        motto: school.motto,
      },
    })

    response.cookies.set(SCHOOL_SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: SCHOOL_SESSION_MAX_AGE,
    })

    return response
  } catch (error) {
    console.error('[SchoolCode]', error)
    return NextResponse.json(
      { ok: false, message: '잠시 후 다시 시도해 주세요.' },
      { status: 500 }
    )
  }
}
