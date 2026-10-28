import { expect, test } from '@playwright/test';

test.describe('Fiche détaillée', () => {
  test('affiche toutes les sections de Dracaufeu', async ({ page }) => {
    await page.goto('/pokemon/6');
    await expect(page.getByRole('heading', { level: 1, name: 'Dracaufeu' })).toBeVisible();
    await expect(page.getByText('Pokémon Flamme')).toBeVisible();
    const stats = page.locator('#stats');
    await expect(stats.getByRole('row', { name: /Attaque Spé\./ })).toContainText('109');
    await expect(stats).toContainText('534');
    const matchups = page.locator('#matchups');
    await expect(matchups.getByRole('listitem').filter({ hasText: 'Roche' })).toContainText('×4');
    await expect(page.locator('#abilities')).toContainText('Talent caché');
    await expect(page.locator('#info')).toContainText('1,7');
    await expect(page.locator('#evolution').getByRole('link', { name: /Salamèche/ })).toBeVisible();
    await expect(page.locator('#evolution')).toContainText('Niveau 36');
    await expect(page.locator('#forms').getByRole('link')).toHaveCount(4);
    await expect(page.locator('#entries blockquote')).not.toBeEmpty();
  });

  test('évolutions ramifiées d’Évoli avec conditions', async ({ page }) => {
    await page.goto('/pokemon/133');
    const evo = page.locator('#evolution');
    await evo.scrollIntoViewIfNeeded();
    await expect(evo.getByRole('link')).toHaveCount(9);
    await expect(evo).toContainText('Bonheur ≥ 160');
    await expect(evo).toContainText('La nuit');
  });

  test('navigation au clavier entre Pokémon', async ({ page }) => {
    await page.goto('/pokemon/25');
    await expect(page.getByRole('heading', { level: 1, name: 'Pikachu' })).toBeVisible();
    await page.keyboard.press('ArrowRight');
    await expect(page).toHaveURL(/\/pokemon\/26$/);
    await page.keyboard.press('ArrowLeft');
    await expect(page.getByRole('heading', { level: 1, name: 'Pikachu' })).toBeVisible();
    await page.keyboard.press('ArrowLeft');
    await expect(page).toHaveURL(/\/pokemon\/24$/);
  });

  test('bouton du cri présent et utilisable', async ({ page }) => {
    await page.goto('/pokemon/25');
    const play = page.getByRole('button', { name: 'Écouter le cri de Pikachu' });
    await expect(play).toBeVisible();
    await play.click();
    await expect(page.getByRole('button', { name: /Arrêter|Écouter le cri/ })).toBeVisible();
  });

  test('numéro inexistant : page 404', async ({ page }) => {
    await page.goto('/pokemon/99999');
    await expect(page.getByRole('heading', { name: 'Page introuvable' })).toBeVisible();
  });
});

test('balayage tactile vers le Pokémon suivant', async ({ browser }) => {
  const context = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('/pokemon/1');
  await expect(page.getByRole('heading', { level: 1, name: 'Bulbizarre' })).toBeVisible();
  await page.locator('article').evaluate((el) => {
    const touch = (x: number) => new Touch({ identifier: 1, target: el, clientX: x, clientY: 300 });
    el.dispatchEvent(new TouchEvent('touchstart', { touches: [touch(300)], changedTouches: [touch(300)], bubbles: true }));
    el.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [touch(120)], bubbles: true }));
  });
  await expect(page).toHaveURL(/\/pokemon\/2$/);
  await context.close();
});
