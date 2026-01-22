import { test, expect } from '@playwright/test'

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display home page with correct title and heading', async ({ page }) => {
    await expect(page).toHaveTitle('Quran Memorizer')

    // Check for main heading (use .first() or nth(1) to get the page content h1, not the header one)
    await expect(page.getByRole('heading', { level: 1 }).nth(1)).toBeVisible()
  })

  test('should display navigation links', async ({ page }) => {
    // Home link
    await expect(page.getByRole('link', { name: 'Home' })).toBeVisible()

    // Sign In and Get Started (when not logged in)
    // Use nth(1) to get the page content links, not the header links
    await expect(page.getByRole('link', { name: 'Sign In' }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: 'Get Started' }).first()).toBeVisible()
  })

  test('should navigate to auth pages correctly', async ({ page }) => {
    // Click Get Started (use the main page link)
    await page.getByRole('link', { name: 'Get Started' }).first().click()
    await expect(page).toHaveURL('/auth/register')

    // Go back
    await page.goBack()

    // Click Sign In
    await page.getByRole('link', { name: 'Sign In' }).first().click()
    await expect(page).toHaveURL('/auth/login')
  })

  test('should have navbar with logo', async ({ page }) => {
    // Check for navbar
    const navbar = page.locator('header')
    await expect(navbar).toBeVisible()
    await expect(navbar).toHaveClass(/border-b/)

    // Check for app logo
    await expect(page.locator('header').getByText('📖')).toBeVisible()
  })

  test('should have responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.getByRole('link', { name: 'Home' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Sign In' }).first()).toBeVisible()

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })
    await expect(page.getByRole('link', { name: 'Home' })).toBeVisible()
  })
})

test.describe('Home Page - Authenticated User', () => {
  test('should show different navigation when logged in', async ({ page }) => {
    const timestamp = Date.now()
    const credentials = {
      name: `Test User ${timestamp}`,
      email: `test${timestamp}@example.com`,
      password: 'Test123456',
    }

    // Register
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

    // Should not show Sign In and Get Started in the main content
    // Check the page content links (second occurrence is in the page content)
    await expect(page.getByRole('link', { name: 'Sign In' }).nth(1)).not.toBeVisible()
    await expect(page.getByRole('link', { name: 'Get Started' }).nth(1)).not.toBeVisible()

    // Should show Dashboard and Sign Out
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign Out' })).toBeVisible()

    // Should show user name
    await expect(page.getByText(credentials.name)).toBeVisible()
  })
})
