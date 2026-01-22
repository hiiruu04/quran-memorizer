import { test, expect } from '@playwright/test'

// Helper function to generate unique user credentials
function generateCredentials() {
  const timestamp = Date.now()
  return {
    name: `Test User ${timestamp}`,
    email: `test${timestamp}@example.com`,
    password: 'Test123456',
  }
}

test.describe('Dashboard', () => {
  // Setup: Register and login before each test
  test.beforeEach(async ({ page }) => {
    const credentials = generateCredentials()

    await page.goto('/auth/register')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)
    await page.locator('#name').fill(credentials.name)
    await page.locator('#email').fill(credentials.email)
    await page.locator('#password').fill(credentials.password)
    await page.locator('#confirmPassword').fill(credentials.password)
    await page.locator('button[type="submit"]').click()
    await expect(page).toHaveURL('/dashboard')

    // Wait for session to be loaded
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('button', { name: 'Sign Out' })).toBeVisible({ timeout: 10000 })
  })

  test('should display dashboard header', async ({ page }) => {
    // Check for main heading
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()

    // Check for subtitle
    await expect(page.getByText('Track your Quran memorization progress')).toBeVisible()
  })

  test('should display progress overview cards', async ({ page }) => {
    // Total Ayahs card
    await expect(page.getByRole('heading', { name: 'Total Ayahs' })).toBeVisible()
    // "0" and "memorized" are in separate paragraph elements
    const ayahsCard = page.locator('main').getByRole('heading', { name: 'Total Ayahs' }).locator('../../..')
    await expect(ayahsCard.getByText('0').first()).toBeVisible()
    await expect(ayahsCard.getByText('memorized')).toBeVisible()

    // Surahs card
    await expect(page.getByRole('heading', { name: 'Surahs' })).toBeVisible()
    await expect(page.getByText('0/114')).toBeVisible()
    await expect(page.getByText('completed')).toBeVisible()

    // Streak card
    await expect(page.getByRole('heading', { name: 'Streak' })).toBeVisible()
    const streakCard = page.locator('main').getByRole('heading', { name: 'Streak' }).locator('../../..')
    await expect(streakCard.getByText('0').first()).toBeVisible()
    await expect(streakCard.getByText('days')).toBeVisible()
  })

  test('should display quick action cards', async ({ page }) => {
    // Start Reading card
    const startReadingCard = page.getByText('Start Reading').first()
    await expect(startReadingCard).toBeVisible()
    await expect(page.getByText('Begin with Surah Al-Fatiha')).toBeVisible()

    // Quiz Mode card (coming soon)
    const quizModeCard = page.getByText('Quiz Mode')
    await expect(quizModeCard).toBeVisible()
    await expect(page.getByText('Test your memorization')).toBeVisible()
    await expect(page.getByText('Coming soon')).toBeVisible()
  })

  // Skip this test until Quran reading route is implemented
  test.skip('should navigate to Quran reading page when clicking Start Reading', async ({ page }) => {
    await page.getByText('Start Reading').first().click()

    // Should navigate to Quran page
    await expect(page).toHaveURL('/quran/1')
  })

  test('should show user info in navbar', async ({ page }) => {
    // Dashboard link should be visible
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible()

    // User name or email should be visible
    const userInfo = page.locator('nav').filter({ hasText: /Dashboard/ })
    await expect(userInfo).toBeVisible()
  })

  test('should show app logo and title in navbar', async ({ page }) => {
    // Check for logo emoji
    await expect(page.locator('header').getByText('📖')).toBeVisible()

    // Check for app title
    await expect(page.getByRole('link', { name: 'Quran Memorizer' })).toBeVisible()
  })

  test('should have Home link in navbar', async ({ page }) => {
    const homeLink = page.getByRole('link', { name: 'Home' })
    await expect(homeLink).toBeVisible()

    // Click Home link
    await homeLink.click()
    await expect(page).toHaveURL('/')
  })
})

test.describe('Dashboard - Auth Required', () => {
  // Skip this test until authentication guards are implemented on the dashboard route
  test.skip('should redirect unauthenticated users accessing dashboard', async ({ page }) => {
    // Try to access dashboard directly
    await page.goto('/dashboard')

    // Should be redirected away from dashboard (to home or login)
    await expect(page).not.toHaveURL('/dashboard')
  })

  test('should not show Sign In/Get Started when authenticated', async ({ page }) => {
    const credentials = generateCredentials()

    // Register and login
    await page.goto('/auth/register')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)
    await page.locator('#name').fill(credentials.name)
    await page.locator('#email').fill(credentials.email)
    await page.locator('#password').fill(credentials.password)
    await page.locator('#confirmPassword').fill(credentials.password)
    await page.locator('button[type="submit"]').click()
    await expect(page).toHaveURL('/dashboard')

    // Wait for session to be loaded
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('button', { name: 'Sign Out' })).toBeVisible({ timeout: 10000 })

    // Should not show Sign In button
    await expect(page.getByRole('link', { name: 'Sign In' })).not.toBeVisible()

    // Should not show Get Started button
    await expect(page.getByRole('link', { name: 'Get Started' })).not.toBeVisible()

    // Should show Sign Out button
    await expect(page.getByRole('button', { name: 'Sign Out' })).toBeVisible()
  })
})
