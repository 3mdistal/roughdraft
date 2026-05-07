import { expect, test } from "@playwright/test";
import { logE2eEvent } from "./helpers";

test.describe("homepage workflow storyboard", () => {
  test("renders the plan-review storyboard above the Markdown section @smoke", async ({
    page,
  }, testInfo) => {
    await page.goto("/");

    const storyboard = page.getByTestId("homepage-workflow-storyboard");
    await expect(storyboard).toBeVisible();
    await expect(page.getByTestId("homepage-workflow-heading")).toHaveText(
      "How it works",
    );

    const scenes = storyboard.getByTestId("homepage-workflow-scene");
    await expect(scenes).toHaveCount(6);
    const sceneTexts = await scenes.allTextContents();
    expect(sceneTexts).toHaveLength(6);
    expect(sceneTexts[0]).toContain("Ask for a plan");
    expect(sceneTexts[1]).toContain("The agent works normally");
    expect(sceneTexts[2]).toContain("Roughdraft opens the plan");
    expect(sceneTexts[3]).toContain("Leave comments and suggestions");
    expect(sceneTexts[4]).toContain("Click I'm done");
    expect(sceneTexts[5]).toContain("The agent resumes");
    await expect(storyboard).toContainText(
      "Let's make the homepage more persuasive. Write a plan first.",
    );

    const agentWorkTranscript = storyboard.getByTestId(
      "homepage-workflow-agent-work",
    );
    await expect(agentWorkTranscript).toHaveAttribute(
      "data-agent-work-visible",
      "false",
    );
    const hiddenTranscriptState = await agentWorkTranscript.evaluate(
      (element) => ({
        maxHeight: window.getComputedStyle(element).maxHeight,
        opacity: window.getComputedStyle(element).opacity,
      }),
    );
    expect(hiddenTranscriptState).toEqual({
      maxHeight: "0px",
      opacity: "0",
    });

    const roughdraftPopup = storyboard.getByTestId("homepage-workflow-popup");
    await expect(roughdraftPopup).toHaveAttribute(
      "data-popup-visible",
      "false",
    );
    await expect(roughdraftPopup).toHaveAttribute("aria-hidden", "true");

    const hiddenPopupState = await roughdraftPopup.evaluate((element) => ({
      opacity: window.getComputedStyle(element).opacity,
      pointerEvents: window.getComputedStyle(element).pointerEvents,
    }));
    expect(hiddenPopupState).toEqual({
      opacity: "0",
      pointerEvents: "none",
    });

    await scenes.nth(1).evaluate((element) => {
      window.scrollTo({
        top: element.getBoundingClientRect().top + window.scrollY - 1,
      });
    });
    await expect(agentWorkTranscript).toHaveAttribute(
      "data-agent-work-visible",
      "false",
    );

    await scenes.nth(1).evaluate((element) => {
      window.scrollTo({
        top: element.getBoundingClientRect().top + window.scrollY,
      });
    });
    await expect(agentWorkTranscript).toHaveAttribute(
      "data-agent-work-visible",
      "true",
    );
    await expect(storyboard).toContainText(
      "I'll inspect the current homepage, draft a Markdown plan, and open it in Roughdraft for review before I code.",
    );
    await expect(
      storyboard.getByTestId("homepage-workflow-terminal-tools"),
    ).toContainText("Tool calls");
    await expect(roughdraftPopup).toHaveAttribute(
      "data-popup-visible",
      "false",
    );

    await scenes.nth(2).evaluate((element) => {
      window.scrollTo({
        top: element.getBoundingClientRect().top + window.scrollY,
      });
    });
    await expect(roughdraftPopup).toHaveAttribute("data-popup-visible", "true");
    await expect(roughdraftPopup).not.toHaveAttribute("aria-hidden", "true");
    await expect(
      storyboard.getByTestId("homepage-workflow-document-title"),
    ).toBeVisible();
    await expect(
      roughdraftPopup.getByTestId(
        "homepage-workflow-document-shell-no-comments",
      ),
    ).toBeVisible();
    await expect(
      roughdraftPopup.getByTestId("homepage-workflow-review-comment"),
    ).toHaveCount(0);
    await expect(
      storyboard.getByTestId("homepage-workflow-handoff-button"),
    ).toHaveCount(0);
    await expect(storyboard).not.toContainText("Review complete");

    await scenes.nth(3).evaluate((element) => {
      window.scrollTo({
        top: element.getBoundingClientRect().top + window.scrollY,
      });
    });
    await expect(
      roughdraftPopup.getByTestId(
        "homepage-workflow-document-shell-with-comments",
      ),
    ).toBeVisible();
    await expect(
      roughdraftPopup.getByTestId("homepage-workflow-review-comment"),
    ).toBeVisible();

    await scenes.nth(4).evaluate((element) => {
      window.scrollTo({
        top: element.getBoundingClientRect().top + window.scrollY,
      });
    });
    await expect(
      storyboard.getByTestId("homepage-workflow-handoff-button"),
    ).toBeVisible();
    await expect(storyboard).not.toContainText("Review complete");

    const stickyLayout = await storyboard.evaluate((element) => {
      const sticky = element.querySelector(
        '[data-testid="homepage-workflow-sticky-visual"]',
      );
      const sceneList = element.querySelector(
        '[data-testid="homepage-workflow-scene-list"]',
      );
      if (!sticky || !sceneList) {
        throw new Error("Expected sticky visual and scene list");
      }

      const stickyRect = sticky.getBoundingClientRect();
      const sceneListRect = sceneList.getBoundingClientRect();
      return {
        position: window.getComputedStyle(sticky).position,
        sceneListRight: sceneListRect.right,
        stickyLeft: stickyRect.left,
        stickyTop: stickyRect.top,
      };
    });
    expect(stickyLayout.position).toBe("sticky");
    expect(stickyLayout.stickyLeft).toBeGreaterThan(
      stickyLayout.sceneListRight,
    );

    const sceneLayout = await scenes.evaluateAll((elements) =>
      elements.map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          height: rect.height,
          top: rect.top + window.scrollY,
        };
      }),
    );
    expect(sceneLayout).toHaveLength(6);
    for (let index = 1; index < sceneLayout.length; index += 1) {
      expect(sceneLayout[index].top).toBeGreaterThan(
        sceneLayout[index - 1].top,
      );
    }
    for (const scene of sceneLayout) {
      expect(scene.height).toBeGreaterThan(500);
    }

    const storyboardTop = await storyboard.evaluate(
      (element) => element.getBoundingClientRect().top + window.scrollY,
    );
    const markdownTop = await page
      .getByTestId("rfm-format-demo")
      .evaluate(
        (element) => element.getBoundingClientRect().top + window.scrollY,
      );
    expect(storyboardTop).toBeLessThan(markdownTop);

    await testInfo.attach("homepage-workflow-storyboard-desktop", {
      body: await storyboard.screenshot(),
      contentType: "image/png",
    });

    logE2eEvent("homepage.workflow-storyboard.desktop", {
      sceneLayout,
      stickyLayout,
      storyboardTop,
      markdownTop,
    });
  });

  test("does not create horizontal overflow on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    const storyboard = page.getByTestId("homepage-workflow-storyboard");
    await expect(storyboard).toBeVisible();
    await expect(page.getByTestId("homepage-workflow-heading")).toHaveText(
      "How it works",
    );

    const mobileSceneTexts = await storyboard
      .getByTestId("homepage-workflow-scene")
      .allTextContents();
    expect(mobileSceneTexts).toHaveLength(6);
    expect(mobileSceneTexts[0]).toContain("Ask for a plan");
    expect(mobileSceneTexts[1]).toContain("The agent works normally");
    expect(mobileSceneTexts[2]).toContain("Roughdraft opens the plan");
    expect(mobileSceneTexts[3]).toContain("Leave comments and suggestions");
    expect(mobileSceneTexts[4]).toContain("Click I'm done");
    expect(mobileSceneTexts[5]).toContain("The agent resumes");

    const dimensions = await page.evaluate(() => ({
      bodyScrollWidth: document.body.scrollWidth,
      documentScrollWidth: document.documentElement.scrollWidth,
      storyboardClientWidth:
        document.querySelector('[data-testid="homepage-workflow-storyboard"]')
          ?.clientWidth ?? 0,
      storyboardScrollWidth:
        document.querySelector('[data-testid="homepage-workflow-storyboard"]')
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
