import { expect, test } from "@playwright/test";
import { logE2eEvent } from "./helpers";

test.describe("homepage workflow storyboard", () => {
  test("renders the plan-review storyboard above the Markdown section @smoke", async ({
    page,
  }, testInfo) => {
    await page.goto("/");

    const storyboard = page.locator("[data-homepage-workflow-storyboard]");
    await expect(storyboard).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "Review an agent's plan before it starts coding.",
      }),
    ).toBeVisible();

    await expect(
      storyboard.locator("[data-homepage-workflow-scene]"),
    ).toHaveCount(6);
    await expect(
      storyboard.getByText("Ask for a plan", { exact: true }),
    ).toBeVisible();
    await expect(
      storyboard.getByText("The agent works normally", { exact: true }),
    ).toBeVisible();
    await expect(
      storyboard.getByText("Roughdraft opens the plan", { exact: true }),
    ).toBeVisible();
    await expect(
      storyboard.getByText("Leave comments and suggestions", { exact: true }),
    ).toBeVisible();
    await expect(
      storyboard.getByText("Click Done Reviewing", { exact: true }),
    ).toBeVisible();
    await expect(
      storyboard.getByText("The agent resumes", { exact: true }),
    ).toBeVisible();
    await expect(
      storyboard.getByText(
        "Let's make the homepage more persuasive. Write a plan first.",
      ),
    ).toBeVisible();
    await expect(
      storyboard.getByText("Homepage Conversion Plan"),
    ).toBeVisible();
    await expect(
      storyboard.locator("[data-homepage-workflow-done-reviewing]"),
    ).toContainText("Done Reviewing");
    await expect(storyboard.getByText("Review complete")).toBeVisible();

    const storyboardTop = await storyboard.evaluate(
      (element) => element.getBoundingClientRect().top + window.scrollY,
    );
    const markdownTop = await page
      .locator(".rfm-format-demo")
      .evaluate(
        (element) => element.getBoundingClientRect().top + window.scrollY,
      );
    expect(storyboardTop).toBeLessThan(markdownTop);

    await testInfo.attach("homepage-workflow-storyboard-desktop", {
      body: await storyboard.screenshot(),
      contentType: "image/png",
    });

    logE2eEvent("homepage.workflow-storyboard.desktop", {
      storyboardTop,
      markdownTop,
    });
  });

  test("does not create horizontal overflow on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    const storyboard = page.locator("[data-homepage-workflow-storyboard]");
    await expect(storyboard).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "Review an agent's plan before it starts coding.",
      }),
    ).toBeVisible();

    await expect(
      storyboard.getByText("Ask for a plan", { exact: true }),
    ).toBeVisible();
    await expect(
      storyboard.getByText("The agent works normally", { exact: true }),
    ).toBeVisible();
    await expect(
      storyboard.getByText("Roughdraft opens the plan", { exact: true }),
    ).toBeVisible();
    await expect(
      storyboard.getByText("Leave comments and suggestions", { exact: true }),
    ).toBeVisible();
    await expect(
      storyboard.getByText("Click Done Reviewing", { exact: true }),
    ).toBeVisible();
    await expect(
      storyboard.getByText("The agent resumes", { exact: true }),
    ).toBeVisible();

    const dimensions = await page.evaluate(() => ({
      bodyScrollWidth: document.body.scrollWidth,
      documentScrollWidth: document.documentElement.scrollWidth,
      storyboardClientWidth:
        document.querySelector("[data-homepage-workflow-storyboard]")
          ?.clientWidth ?? 0,
      storyboardScrollWidth:
        document.querySelector("[data-homepage-workflow-storyboard]")
          ?.scrollWidth ?? 0,
      viewportWidth: window.innerWidth,
    }));

    expect(dimensions.bodyScrollWidth).toBeLessThanOrEqual(
      dimensions.viewportWidth,
    );
    expect(dimensions.documentScrollWidth).toBeLessThanOrEqual(
      dimensions.viewportWidth,
    );
    expect(dimensions.storyboardScrollWidth).toBeLessThanOrEqual(
      dimensions.storyboardClientWidth,
    );

    logE2eEvent("homepage.workflow-storyboard.mobile-overflow", dimensions);
  });
});
