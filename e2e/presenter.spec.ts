import { expect, test } from "@playwright/test";

test("renders the presenter shell and advances slides on presenter routes", async ({ page }) => {
  await page.goto("/presenter/2");

  await expect(page).toHaveURL(/\/presenter\/2$/);
  await expect(page.getByRole("heading", { name: "Welcome to slidev-react" })).toBeVisible();
  await expect(page.getByText("Up Next")).toBeVisible();
  await expect(page.getByText("Speaker Notes")).toBeVisible();
  await expect(page.getByRole("button", { name: "Live" })).toBeVisible();

  await page.keyboard.press("ArrowRight");

  await expect(page).toHaveURL(/\/presenter\/3$/);
  await expect(page.getByRole("heading", { name: "What is slidev-react?" })).toBeVisible();
});
