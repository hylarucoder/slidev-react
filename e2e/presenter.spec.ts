import { expect, test, type Page } from "@playwright/test";

async function openPresenterNavbar(page: Page) {
  const viewport = page.viewportSize();
  if (!viewport) throw new Error("viewport size is unavailable");

  await page.mouse.move(40, viewport.height - 40);
}

async function openPresenterDetails(page: Page) {
  const liveButton = page.getByRole("button", { name: "Live" });
  if ((await liveButton.count()) > 0 && (await liveButton.isVisible())) {
    await liveButton.click();
  }
}

test.describe("presenter shell", () => {
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

  test("opens notes workspace, blocks overlay navigation, and jumps to a selected slide", async ({
    page,
  }) => {
    await page.goto("/presenter/2");
    await openPresenterNavbar(page);

    await page.getByRole("button", { name: "Toggle quick overview" }).click();
    await expect(page.getByRole("heading", { name: "Quick Overview" })).toBeVisible();

    await page.keyboard.press("ArrowRight");
    await expect(page).toHaveURL(/\/presenter\/2$/);

    await page.keyboard.press("n");

    await expect(page.getByRole("heading", { name: "Notes Workspace" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Quick Overview" })).toHaveCount(0);
    await expect(page.getByText("No notes on this slide yet.")).toBeVisible();

    await page.getByRole("button", { name: "Jump To Slide" }).click();

    await expect(page).toHaveURL(/\/presenter\/2$/);
    await expect(page.getByRole("heading", { name: "Notes Workspace" })).toHaveCount(0);

    await page.keyboard.press("n");
    await page.getByRole("button", { name: /Navigation/ }).click();
    await page.getByRole("button", { name: "Jump To Slide" }).click();

    await expect(page).toHaveURL(/\/presenter\/4$/);
    await expect(page.getByRole("heading", { name: "Navigation" })).toBeVisible();
  });

  test("persists display settings and opens a mirror stage", async ({ page, context }) => {
    await page.goto("/presenter/2");
    await openPresenterDetails(page);

    await page.getByLabel("stage scale").selectOption("0.9");
    await page.getByLabel("cursor").selectOption("idle-hide");

    await expect(page.getByText("fullscreen: off")).toBeVisible();
    await expect(page.getByText("wake lock:")).toBeVisible();

    await expect
      .poll(() =>
        page.evaluate(() => ({
          stageScale: window.localStorage.getItem("slide-react:presenter-stage-scale"),
          cursorMode: window.localStorage.getItem("slide-react:presenter-cursor-mode"),
        })),
      )
      .toEqual({
        stageScale: "0.9",
        cursorMode: "idle-hide",
      });

    await page.reload();
    await openPresenterDetails(page);

    await expect(page.getByLabel("stage scale")).toHaveValue("0.9");
    await expect(page.getByLabel("cursor")).toHaveValue("idle-hide");

    const popupPromise = context.waitForEvent("page", { timeout: 2_000 }).catch(() => null);
    await page.getByRole("button", { name: "Open mirror stage" }).click();
    const mirrorPage = await popupPromise;

    if (mirrorPage) {
      await mirrorPage.waitForLoadState("domcontentloaded");
      await expect(mirrorPage).toHaveURL(/\/2$/);
      await expect(mirrorPage.url()).not.toContain("/presenter/");
      await expect(
        mirrorPage.getByRole("heading", { name: "Welcome to slidev-react" }),
      ).toBeVisible();
      return;
    }

    await expect(page).toHaveURL(/\/2$/);
    await expect(page.url()).not.toContain("/presenter/");
    await expect(page.getByRole("heading", { name: "Welcome to slidev-react" })).toBeVisible();
  });
});
