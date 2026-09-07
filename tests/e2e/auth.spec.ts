import { test, expect } from "@playwright/test";

test.describe("authentication boundary", () => {
  test("redirects unauthenticated visitors to sign in", async ({ page }) => {
    await page.goto("/projects");
    await expect(page).toHaveURL(/\/sign-in/);
    await expect(page.getByRole("heading", { name: /مرحبًا بعودتك|sign in/i })).toBeVisible();
  });

  test("keeps authentication pages public", async ({ page }) => {
    await page.goto("/sign-up");
    await expect(page).toHaveURL(/\/sign-up/);
    await expect(page.getByRole("heading", { name: /أنشئ حسابك|create account|sign up/i })).toBeVisible();
  });
});
