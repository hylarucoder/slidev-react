import { expect, test } from "@playwright/test";

test.describe("deck navigation", () => {
  test("normalizes the standalone route and supports keyboard navigation", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveURL(/\/1$/);
    await expect(page).toHaveTitle(/slidev-react Capability Tour/i);
    await expect(page.getByText("L01: 产品定义 & 工具就位").first()).toBeVisible();

    await page.keyboard.press("ArrowRight");

    await expect(page).toHaveURL(/\/2$/);
    await expect(page.getByRole("heading", { name: "Welcome to slidev-react" })).toBeVisible();

    await page.keyboard.press("Home");

    await expect(page).toHaveURL(/\/1$/);
  });

  test("opens quick overview and jumps to a selected slide", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("heading", { name: "Welcome to slidev-react" })).toBeVisible();

    const viewport = page.viewportSize();
    if (!viewport) throw new Error("viewport size is unavailable");

    await page.mouse.move(40, viewport.height - 40);
    await page.getByRole("button", { name: "Toggle quick overview" }).click();

    await expect(page.getByRole("heading", { name: "Quick Overview" })).toBeVisible();
    await page.getByRole("button", { name: "Go to slide 4" }).click();

    await expect(page).toHaveURL(/\/4$/);
    await expect(page.getByRole("heading", { name: "Navigation" })).toBeVisible();
  });
});
