import { test, expect } from "@playwright/test";
test("topics, mobile layout and persisted preferences", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Tvůj hlas. Větší jistota." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Témata", exact: true }).click();
  await expect(page.locator(".topic-card")).toHaveCount(10);
  await page.getByRole("button", { name: "A2 · Základy", exact: true }).click();
  await expect(page.locator(".topic-card")).toHaveCount(3);
  await page.getByRole("button", { name: "Nastavení", exact: true }).click();
  await page.getByLabel("Rychlost poslechu").selectOption("0.75");
  await page.getByLabel("Moje úroveň").selectOption("A2");
  await page.reload();
  await page.getByRole("button", { name: "Nastavení", exact: true }).click();
  await expect(page.getByLabel("Rychlost poslechu")).toHaveValue("0.75");
  await expect(page.getByLabel("Moje úroveň")).toHaveValue("A2");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Přehled", exact: true }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/home-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1080 });
  await page.screenshot({
    path: "test-results/home-desktop.png",
    fullPage: true,
  });
});
test("microphone denial and unsupported speech remain usable", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "SpeechRecognition", { value: undefined });
    Object.defineProperty(window, "webkitSpeechRecognition", {
      value: undefined,
    });
    navigator.mediaDevices.getUserMedia = async () => {
      throw new DOMException("Denied", "NotAllowedError");
    };
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Začít procvičovat", exact: true })
    .click();
  await expect(
    page.getByText("Tento prohlížeč nepodporuje přepis řeči.", {
      exact: false,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Nahrát odpověď", exact: true })
    .click();
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "Mikrofon není dostupný",
  );
  await expect(
    page.getByRole("button", { name: "Uložit a pokračovat" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Zobrazit otázku" }).click();
  await expect(
    page.getByText("Jak pokračuje projekt?", { exact: true }),
  ).toBeVisible();
});
test("records locally without recognition consent and persists completion", async ({
  browser,
}) => {
  const context = await browser.newContext({ permissions: ["microphone"] });
  const page = await context.newPage();
  await page.addInitScript(() => {
    // A synthetic local audio stream exercises the actual browser MediaRecorder.
    navigator.mediaDevices.getUserMedia = async () => {
      const audio = new AudioContext();
      const oscillator = audio.createOscillator();
      const destination = audio.createMediaStreamDestination();
      oscillator.connect(destination);
      oscillator.start();
      const track = destination.stream.getAudioTracks()[0];
      const original = track.stop.bind(track);
      let stopped = false;
      track.stop = () => {
        if (stopped) return;
        stopped = true;
        original();
        oscillator.stop();
        void audio.close();
      };
      return destination.stream;
    };
    const fail = class {
      start() {
        throw new Error("Recognition started without consent");
      }
    };
    Object.defineProperty(window, "SpeechRecognition", { value: fail });
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Začít procvičovat", exact: true })
    .click();
  await expect(page.getByRole("checkbox")).not.toBeChecked();
  await page
    .getByRole("button", { name: "Nahrát odpověď", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Dokončit nahrávání" }),
  ).toBeVisible();
  await page.waitForTimeout(350);
  await page.getByRole("button", { name: "Dokončit nahrávání" }).click();
  await expect(page.locator("audio")).toHaveAttribute("src", /^blob:/);
  await page.getByRole("button", { name: "Uložit a pokračovat" }).click();
  await expect(page.getByText("Dialog 2 / 5", { exact: true })).toBeVisible();
  await page.reload();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Můj pokrok", exact: true })
    .click();
  await expect(page.locator(".stat").first()).toContainText("1 / 50");
  const progress = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("talkie.progress.v1")!),
  );
  expect(progress["business-1"].bestScore).toBeNull();
  expect(progress["business-1"].attempts).toBe(1);
  await context.close();
});
