/**
 * 헤더·Footer의 '발명품 검색'을 누르면 빈 /search 페이지로 가는 대신
 * 지금 화면에 있는 검색창으로 이동해 강조(반짝임)하고 커서를 넣는다.
 *
 * 검색창 요소에는 data-search-bar 속성을 붙인다 (홈: HomeSearchSection, 검색 페이지: search/SearchBar).
 * 검색창이 없는 화면(약관·상세 등)에서는 '/#search'로 이동하고, 홈이 열리면서 강조한다.
 */
export const SEARCH_HASH = '#search'

const HIGHLIGHT_CLASS = 'search-spotlight'

/** 현재 화면의 검색창을 강조. 검색창이 없으면 false */
export function spotlightSearchBar(block: ScrollLogicalPosition = 'center'): boolean {
  const bar = document.querySelector<HTMLElement>('[data-search-bar]')
  if (!bar) return false

  bar.scrollIntoView({ behavior: 'smooth', block })
  bar.querySelector('input')?.focus({ preventScroll: true })

  // 연달아 눌러도 애니메이션이 다시 재생되도록 클래스를 뗐다 붙임
  bar.classList.remove(HIGHLIGHT_CLASS)
  void bar.offsetWidth
  bar.classList.add(HIGHLIGHT_CLASS)
  window.setTimeout(() => bar.classList.remove(HIGHLIGHT_CLASS), 2000)
  return true
}
