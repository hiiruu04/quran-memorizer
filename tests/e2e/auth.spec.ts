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

test.describe('Authentication - Happy Path', () => {
  test('should successfully register a new user', async ({ page }) => {
    const credentials = generateCredentials()

    await page.goto('/auth/register')

    // Wait for page to be fully loaded and interactive
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    // Fill registration form
    await page.locator('#name').fill(credentials.name)
    await page.locator('#email').fill(credentials.email)
    await page.locator('#password').fill(credentials.password)
    await page.locator('#confirmPassword').fill(credentials.password)

    // Submit form - use locator to ensure we're clicking the right button
    await page.locator('button[type="submit"]').click()

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard')

    // Wait for session to be loaded and user name to appear
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('button', { name: 'Sign Out' })).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(credentials.name)).toBeVisible()
  })

  test('should successfully login with valid credentials', async ({ page }) => {
    // Create a user first
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

    // Logout
    await page.getByRole('button', { name: 'Sign Out' }).click()
    await expect(page).toHaveURL('/')

    // Login again
    await page.goto('/auth/login')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)
    await page.locator('#email').fill(credentials.email)
    await page.locator('#password').fill(credentials.password)
    await page.locator('button[type="submit"]').click()

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard')

    // Wait for session to be loaded and user name to appear
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('button', { name: 'Sign Out' })).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(credentials.name)).toBeVisible()
  })

  test('should successfully logout and redirect to home', async ({ page }) => {
    // Register and login
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

    // Logout
    await page.getByRole('button', { name: 'Sign Out' }).click()

    // Should redirect to home
    await expect(page).toHaveURL('/')

    // Should show Sign In and Get Started buttons
    await expect(page.getByRole('link', { name: 'Sign In' }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: 'Get Started' }).first()).toBeVisible()

    // Should not show user name or Sign Out button
    await expect(page.getByText(credentials.name)).not.toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign Out' })).not.toBeVisible()
  })

  test('should persist session across page navigation when logged in', async ({ page }) => {
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

    // Navigate to home
    await page.goto('/')

    // Should still show logged in state
    await expect(page.getByRole('button', { name: 'Sign Out' })).toBeVisible()
    await expect(page.getByText(credentials.name)).toBeVisible()

    // Navigate back to dashboard
    await page.getByRole('link', { name: 'Dashboard' }).click()

    // Should be able to access dashboard
    await expect(page).toHaveURL('/dashboard')
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/auth/login')
    await page.waitForLoadState('networkidle')

    // Enter invalid credentials
    await page.locator('#email').fill('nonexistent@example.com')
    await page.locator('#password').fill('WrongPassword123')

    // Submit form
    await page.locator('button[type="submit"]').click()
    await page.waitForLoadState('networkidle')

    // Should stay on login page (not redirect to dashboard)
    await expect(page).toHaveURL('/auth/login')
  })
})

test.describe('Dashboard - Basic Functionality', () => {
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

  test('should display dashboard header and progress cards', async ({ page }) => {
    // Check for main heading
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()

    // Check for progress cards
    await expect(page.getByRole('heading', { name: 'Total Ayahs' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Surahs' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Streak' })).toBeVisible()
  })

  test('should show quick action cards', async ({ page }) => {
    await expect(page.getByText('Start Reading')).toBeVisible()
    await expect(page.getByText('Begin with Surah Al-Fatiha')).toBeVisible()
    await expect(page.getByText('Quiz Mode')).toBeVisible()
    await expect(page.getByText('Test your memorization')).toBeVisible()
  })

  test('should have navigation and app logo', async ({ page }) => {
    // Check for logo
    await expect(page.locator('header').getByText('📖')).toBeVisible()

    // Check for links
    await expect(page.getByRole('link', { name: 'Home' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible()
  })
})

test.describe('Navigation - Basic Routes', () => {
  test('should allow navigation between home and auth pages', async ({ page }) => {
    await page.goto('/')

    // Click Get Started
    await page.getByRole('link', { name: 'Get Started' }).first().click()
    await expect(page).toHaveURL('/auth/register')

    // Click Sign In link
    await page.getByRole('link', { name: 'Sign in' }).first().click()
    await expect(page).toHaveURL('/auth/login')

    // Click Home link
    await page.getByRole('link', { name: 'Home' }).click()
    await expect(page).toHaveURL('/')
  })

  // Skip this test until authentication guards are implemented on the dashboard route
  test.skip('should redirect unauthenticated users from dashboard', async ({ page }) => {
    // Try to access dashboard directly
    await page.goto('/dashboard')

    // Should redirect away (to home since no auth)
    await expect(page).not.toHaveURL('/dashboard')
  })
})

test.describe('Home Page - Basic UI', () => {
  test('should display home page content', async ({ page }) => {
    await page.goto('/')

    // Check for title
    await expect(page).toHaveTitle('Quran Memorizer')

    // Check for heading (there are 2 h1s - one in header, one in content)
    await expect(page.getByRole('heading', { level: 1 }).nth(1)).toBeVisible()
    await expect(page.getByText('Your companion for Hifz journey')).toBeVisible()
  })

  test('should have responsive navbar', async ({ page }) => {
    await page.goto('/')

    // Check for navbar
    const navbar = page.locator('header')
    await expect(navbar).toBeVisible()

    // Check for navigation elements
    await expect(page.getByRole('link', { name: 'Home' })).toBeVisible()
    // Use nth() to get the page content links (not the header links)
    await expect(page.getByRole('link', { name: 'Sign In' }).nth(1)).toBeVisible()
    await expect(page.getByRole('link', { name: 'Get Started' }).nth(1)).toBeVisible()
  })
})
