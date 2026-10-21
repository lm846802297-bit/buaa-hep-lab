import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { parse } from '@vue/compiler-sfc'

describe('Navbar Sidebar Tour Pinning Integration', () => {
  const navbarPath = path.resolve(__dirname, 'Navbar.vue')
  const navbarContent = fs.readFileSync(navbarPath, 'utf8')
  const navbarParsed = parse(navbarContent)
  const script = navbarParsed.descriptor.scriptSetup?.content || ''
  const template = navbarParsed.descriptor.template?.content || ''

  it('declares isTourPinStep computed property matching home_pin_sidebar', () => {
    expect(script).toContain("currentSubStep.value?.id === 'home_pin_sidebar'")
    expect(script).toContain('isTourPinStep')
  })

  it('unpins sidebar in step 1 and locks sidebar in all subsequent steps regardless of click', () => {
    expect(script).toContain("subStepId === 'home_pin_sidebar'")
    expect(script).toContain("emit('update:pinned', false)")
    expect(script).toContain("emit('update:pinned', true)")
    expect(script).toContain("localStorage.setItem('sidebar_pinned', 'true')")
  })

  it('restores the user's original sidebar preference after the tutorial closes', () => {
    expect(script).toContain('let tutorialPreviousPinned = null')
    expect(script).toContain('tutorialPreviousPinned = props.pinned')
    expect(script).toContain('const restorePinned = tutorialPreviousPinned')
    expect(script).toContain("localStorage.setItem('sidebar_pinned', String(restorePinned))")
  })

  it('binds isTourPinStep to sidebar classes so it floats expanded during step 1', () => {
    expect(template).toContain("!pinned && !isHovered && !isPeeking && !isTourPinStep")
    expect(template).toContain("(!pinned && isHovered) || isTourPinStep")
  })
})
