import { expect, test } from "@playwright/test";

test("loads the scene shell and opens the wanted notice detail", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "中国社区 · 通缉令演示" })).toBeVisible();
  await expect(page.getByText("Three.js + TypeScript + Vite + GSAP")).toBeVisible();
  await expect(page.getByText("靠近公告栏查看通缉令")).toBeVisible({ timeout: 20_000 });

  await page.keyboard.press("KeyE");
  const detail = page.getByLabel("通缉令详情");

  await expect(detail).toBeVisible({ timeout: 20_000 });
  await expect(detail.getByAltText("通缉令详情")).toHaveAttribute("src", /tjl.*\.png$/);

  await page.keyboard.press("Escape");
  await expect(detail).toBeHidden();
});
