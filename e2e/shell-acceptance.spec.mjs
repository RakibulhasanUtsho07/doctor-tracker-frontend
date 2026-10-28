import { test, expect } from "../.e2e-tools/node_modules/@playwright/test/index.mjs";

const MOBILE_BREAKPOINT = 760;

async function openPrimaryNavigation(page) {
  if (page.viewportSize().width <= MOBILE_BREAKPOINT) {
    await page.getByRole("banner").getByRole("button", { name: "Open navigation" }).click();
  }
  return page.getByRole("navigation", { name: "Primary navigation" });
}

async function navigateTo(page, section) {
  const navigation = await openPrimaryNavigation(page);
  await navigation.getByRole("button", { name: new RegExp("^" + section) }).click();
  await expect(page.locator("#primary-sidebar .nav-link[aria-current='page']")).toContainText(section);
}

test("shell stays within viewport and screenshots contain preview-only data", async ({ page }, testInfo) => {
  const viewport = page.viewportSize();
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Good systems make better care." })).toBeVisible();
  await expect(page.locator(".preview-note")).toContainText("Live data is not connected");
  await expect(page.locator(".page-disclaimer")).toContainText(
    "Preview only. No real patient data or live record counts are shown on this screen."
  );
  await expect(page.locator(".metric-value > span")).toHaveCount(3);
  await expect(page.locator(".metric-value > span")).toHaveText(["—", "—", "—"]);

  const layout = await page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
    viewportHeight: window.innerHeight
  }));

  await page.screenshot({
    path: testInfo.outputPath("shell-" + viewport.width + "x" + viewport.height + ".png"),
    fullPage: true
  });

  expect(
    layout.documentWidth <= layout.viewportWidth && layout.bodyWidth <= layout.viewportWidth,
    "Unexpected horizontal overflow: " + JSON.stringify(layout)
  ).toBe(true);
});

test("primary navigation updates the announced page heading and never fabricates records", async ({ page }) => {
  await page.goto("/");
  await navigateTo(page, "Doctors");

  const doctorsHeading = page.getByRole("heading", { level: 1, name: "Doctors" });
  await expect(doctorsHeading).toBeVisible();
  await expect(doctorsHeading).toBeFocused();
  await expect(page.locator(".placeholder-notice")).toContainText("No records are displayed");
  await expect(page.locator(".placeholder-notice")).toContainText("not connected to the API");

  await page.getByRole("button", { name: /Return to dashboard/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Good systems make better care." })).toBeFocused();

  await navigateTo(page, "Patients");
  const patientsHeading = page.getByRole("heading", { level: 1, name: "Patients" });
  await expect(patientsHeading).toBeVisible();
  await expect(patientsHeading).toBeFocused();
  await expect(page.locator(".placeholder-notice")).toContainText("No records are displayed");
});

test("skip link moves keyboard users to the main content", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");

  const skipLink = page.getByRole("link", { name: "Skip to main content" });
  await expect(skipLink).toBeFocused();
  await page.keyboard.press("Enter");

  await expect(page).toHaveURL(/#main-content$/);
  await expect(page.locator("#main-content")).toBeFocused();
});

test("reduced-motion preference disables smooth scrolling and minimizes transitions", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  const motion = await page.evaluate(() => {
    const durationsInMilliseconds = (value) => value.split(",").map((item) => {
      const duration = item.trim();
      const amount = Number.parseFloat(duration);
      if (duration.endsWith("ms")) return amount;
      if (duration.endsWith("s")) return amount * 1000;
      return 0;
    });
    return {
      scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
      skipLinkDurations: durationsInMilliseconds(getComputedStyle(document.querySelector(".skip-link")).transitionDuration),
      metricDurations: durationsInMilliseconds(getComputedStyle(document.querySelector(".metric-card")).transitionDuration)
    };
  });

  expect(motion.scrollBehavior).toBe("auto");
  expect(motion.skipLinkDurations.length).toBeGreaterThan(0);
  expect(motion.metricDurations.length).toBeGreaterThan(0);
  expect(motion.skipLinkDurations.every((duration) => duration <= 0.1), JSON.stringify(motion)).toBe(true);
  expect(motion.metricDurations.every((duration) => duration <= 0.1), JSON.stringify(motion)).toBe(true);
});

test("mobile navigation opens by keyboard and restores focus when closed", async ({ page }, testInfo) => {
  test.skip(page.viewportSize().width > MOBILE_BREAKPOINT, "Mobile-only navigation behavior.");
  await page.goto("/");

  const menuButton = page.getByRole("banner").getByRole("button", { name: "Open navigation" });
  await menuButton.focus();
  await page.keyboard.press("Enter");

  await expect(page.getByRole("banner").getByRole("button", { name: "Close navigation" })).toBeVisible();
  await expect(page.locator("#primary-sidebar .nav-link").first()).toBeFocused();

  await page.keyboard.press("Escape");
  const restoredMenuButton = page.getByRole("banner").getByRole("button", { name: "Open navigation" });
  await expect(restoredMenuButton).toHaveAttribute("aria-expanded", "false");
  await expect(restoredMenuButton).toBeFocused();

  await page.keyboard.press("Enter");
  await expect(page.locator("#primary-sidebar .nav-link").first()).toBeFocused();
  await page.locator("#primary-sidebar").getByRole("button", { name: "Close navigation" }).click();
  await expect(restoredMenuButton).toHaveAttribute("aria-expanded", "false");
  await expect(restoredMenuButton).toBeFocused();
});
