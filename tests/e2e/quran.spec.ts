import { test, expect } from '@playwright/test'

test.describe('Quran Viewer', () => {
  test.describe('Surah List Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/quran')
    })

    test('should display surah list page with correct title', async ({ page }) => {
      await expect(page).toHaveTitle('Quran Memorizer')
    })

    test('should display surah list heading', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'The Holy Quran' })).toBeVisible()
    })

    test('should display subtitle text', async ({ page }) => {
      await expect(page.getByText('Select a Surah to begin reading')).toBeVisible()
    })

    test('should display surah cards in a grid', async ({ page }) => {
      // Check for multiple surah cards
      const surahCards = page.locator('a[href^="/quran/"]')
      await expect(surahCards).toHaveCount(114) // All 114 surahs
    })

    test('should display first surah (Al-Fatiha) with correct info', async ({ page }) => {
      const firstCard = page.locator('a[href="/quran/1"]').first()

      // Check for surah number
      await expect(firstCard.getByText('1')).toBeVisible()

      // Check for surah name
      await expect(firstCard.getByText('Al-Fatiha')).toBeVisible()

      // Check for Arabic name
      await expect(firstCard.locator('span[dir="rtl"]')).toBeVisible()

      // Check for verse count
      await expect(firstCard.getByText(/verses/i)).toBeVisible()

      // Check for revelation place
      await expect(firstCard.getByText(/Makkah|Madinah/i)).toBeVisible()
    })

    test('should navigate to surah detail when clicking a surah card', async ({ page }) => {
      await page.locator('a[href="/quran/1"]').first().click()
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveURL(/\/quran\/1/)
    })
  })

  test.describe('Surah Detail Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/quran/1')
      await page.waitForLoadState('networkidle')
    })

    test('should display surah detail page', async ({ page }) => {
      await expect(page).toHaveURL(/\/quran\/1/)

      // Check for surah number
      await expect(page.getByText('1')).toBeVisible()

      // Check for surah name
      await expect(page.getByRole('heading', { name: 'Al-Fatiha' })).toBeVisible()

      // Check for Arabic name (the text may be in the heading)
      await expect(page.locator('p[dir="rtl"]')).toContainText('فاتحة')
    })

    test('should display verse count and revelation place', async ({ page }) => {
      await expect(page.getByText(/Verses/i)).toBeVisible()
      await expect(page.getByText(/Makkah|Madinah/i)).toBeVisible()
    })

    test('should display view mode toggle button', async ({ page }) => {
      await expect(page.getByRole('button', { name: /Switch to/i })).toBeVisible()
    })

    test('should toggle between verses and reading mode', async ({ page }) => {
      // Initially in verses mode
      let toggleButton = page.getByRole('button', { name: /Switch to Reading Mode/i })
      await expect(toggleButton).toBeVisible()

      // Click to switch to reading mode
      await toggleButton.click()
      await page.waitForLoadState('networkidle')
      await expect(page.getByRole('button', { name: /Switch to Verses Mode/i })).toBeVisible()

      // Click to switch back to verses mode
      toggleButton = page.getByRole('button', { name: /Switch to Verses Mode/i })
      await toggleButton.click()
      await page.waitForLoadState('networkidle')
      await expect(page.getByRole('button', { name: /Switch to Reading Mode/i })).toBeVisible()
    })

    test('should display verses with Arabic text', async ({ page }) => {
      // Check for Arabic text
      const arabicText = page.locator('p[dir="rtl"]')
      await expect(arabicText.first()).toBeVisible()
    })

    test('should display verse numbers with Arabic numerals', async ({ page }) => {
      // Check for verse number badges
      const verseBadges = page.locator('.border-2.border-cyan-400')
      await expect(verseBadges.first()).toBeVisible()
    })

    test('should display English translations', async ({ page }) => {
      // Check for translation text
      const translations = page.locator('p.text-gray-300')
      await expect(translations.first()).toBeVisible()

      // Check for footnote markers
      await expect(page.locator('sub').first()).toBeVisible()
    })

    test('should display carousel navigation arrows for multi-page surahs', async ({ page }) => {
      // Go to a longer surah
      await page.goto('/quran/2')
      await page.waitForLoadState('networkidle')

      // Check for navigation arrows (use first() to get the carousel arrow)
      await expect(page.locator('button[title="Previous page"]').first()).toBeVisible()
      await expect(page.locator('button[title="Next page"]').first()).toBeVisible()

      // Check for page indicator
      await expect(page.getByText(/Page 1 of/)).toBeVisible()
    })

    test('should navigate between pages using carousel arrows', async ({ page }) => {
      await page.goto('/quran/2')
      await page.waitForLoadState('networkidle')

      // Get initial URL
      const initialUrl = page.url()

      // Click next arrow (use first() to get the carousel arrow)
      await page.locator('button[title="Next page"]').first().click()
      await page.waitForLoadState('networkidle')

      // Should be on page 2
      await expect(page).not.toHaveURL(initialUrl)
      await expect(page.getByText(/Page 2 of/)).toBeVisible()

      // Click previous arrow
      await page.locator('button[title="Previous page"]').first().click()
      await page.waitForLoadState('networkidle')

      // Should be back on page 1
      await expect(page.getByText(/Page 1 of/)).toBeVisible()
    })

    test('should display pagination controls', async ({ page }) => {
      await page.goto('/quran/2')
      await page.waitForLoadState('networkidle')

      // Check for pagination info
      await expect(page.getByText(/Showing verses/i)).toBeVisible()
      await expect(page.getByText(/Page 1 of/)).toBeVisible()

      // Check for page number buttons
      await expect(page.locator('button:has-text("2")').first()).toBeVisible()
    })

    test('should navigate between surahs', async ({ page }) => {
      await page.goto('/quran/2')
      await page.waitForLoadState('networkidle')

      // Check for next surah link (use text content)
      const nextSurahLink = page.locator('a[href="/quran/3"]')
      await expect(nextSurahLink).toBeVisible()

      // Click next surah
      await nextSurahLink.click()
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveURL(/\/quran\/3/)
      await expect(page.getByRole('heading', { name: /Al-Imran/i })).toBeVisible()
    })

    test('should hide Bismillah on pages other than page 1', async ({ page }) => {
      await page.goto('/quran/2')
      await page.waitForLoadState('networkidle')

      // Page 1 should show Bismillah
      await expect(page.locator('p[dir="rtl"]').getByText(/بِسْمِ/)).toBeVisible()

      // Navigate to page 2 (use first() to get the carousel arrow)
      await page.locator('button[title="Next page"]').first().click()
      await page.waitForLoadState('networkidle')

      // Page 2 should not show Bismillah
      await expect(page.locator('p[dir="rtl"]').getByText(/بِسْمِ/)).not.toBeVisible()
    })

    test('should display reading mode correctly', async ({ page }) => {
      await page.goto('/quran/2')
      await page.waitForLoadState('networkidle')

      // Switch to reading mode
      await page.getByRole('button', { name: /Switch to Reading Mode/i }).click()
      await page.waitForLoadState('networkidle')

      // Check for continuous Arabic text
      await expect(page.locator('p[dir="rtl"]').first()).toBeVisible()

      // Check for circle badge dividers (use a more flexible selector)
      await expect(page.locator('.rounded-full.w-10.h-10').first()).toBeVisible()

      // Check for translations section
      await expect(page.locator('div.border-t.border-slate-600')).toBeVisible()
    })

    test('should handle Surah 1 (Al-Fatiha) correctly', async ({ page }) => {
      await page.goto('/quran/1')

      // Al-Fatiha should not show Bismillah separately (it's built into verse 1)
      await expect(page.locator('p[dir="rtl"]').getByText(/بِسْمِ/).nth(1)).not.toBeVisible()

      // Should display all 7 verses
      await expect(page.locator('.border-2.border-cyan-400')).toHaveCount(7)
    })

    test('should handle Surah 9 (At-Tawbah) correctly - no Bismillah', async ({ page }) => {
      await page.goto('/quran/9')

      // Surah 9 should not show Bismillah
      await expect(page.locator('p[dir="rtl"]').getByText(/بِسْمِ/)).not.toBeVisible()
    })
  })
})
