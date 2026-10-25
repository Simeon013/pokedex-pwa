import { expect, test } from '@playwright/test';

test.describe('Liste et recherche', () => {
  test('affiche la grille virtualisée en français', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/pokedex$/);
    await expect(page.getByText(/^1\s?025 Pokémon$/)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Voir la fiche de Bulbizarre' })).toBeVisible();
    // Virtualisation : bien moins de cartes dans le DOM que de Pokémon.
    expect(await page.getByRole('listitem').count()).toBeLessThan(120);
  });

  test('recherche avec suggestions puis ouverture de la fiche au clavier', async ({ page }) => {
    await page.goto('/pokedex');
    await page.getByRole('link', { name: 'Voir la fiche de Bulbizarre' }).waitFor();
    await page.keyboard.press('/');
    await expect(page.getByRole('combobox', { name: 'Rechercher un Pokémon' })).toBeFocused();
    await page.keyboard.type('dracau');
    const options = page.getByRole('option');
    await expect(options.first()).toContainText('Dracaufeu');
    await expect(page.getByText('4 Pokémon')).toBeVisible();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/pokemon\/6$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Dracaufeu' })).toBeVisible();
    await expect(page.getByText('Pokémon Flamme')).toBeVisible();
  });

  test('filtre par type et par génération, puis réinitialise', async ({ page }) => {
    await page.goto('/pokedex');
    await page.getByRole('link', { name: 'Voir la fiche de Bulbizarre' }).waitFor();
    await page.getByRole('button', { name: 'Filtres' }).click();
    const dialog = page.getByRole('dialog', { name: 'Filtres et tri' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Dragon' }).click();
    await dialog.getByRole('button', { name: 'Génération 1' }).click();
    await expect(dialog.getByRole('button', { name: 'Afficher 3 résultats' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(page.getByRole('link', { name: 'Voir la fiche de Minidraco' })).toBeVisible();
    await page.getByRole('button', { name: 'Filtres' }).click();
    await page.getByRole('button', { name: 'Tout réinitialiser' }).click();
    await expect(page.getByRole('button', { name: /Afficher 1\s?025 résultats/ })).toBeVisible();
  });

  test('favori depuis la carte, persistant après rechargement', async ({ page }) => {
    await page.goto('/pokedex');
    const fav = page.getByRole('button', { name: 'Ajouter Pikachu aux favoris' });
    await page.getByRole('combobox', { name: 'Rechercher un Pokémon' }).fill('pikachu');
    await page.keyboard.press('Escape');
    await fav.first().click();
    await expect(page.getByRole('button', { name: 'Retirer Pikachu des favoris' }).first()).toHaveAttribute('aria-pressed', 'true');
    await page.reload();
    await page.getByRole('combobox', { name: 'Rechercher un Pokémon' }).fill('pikachu');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Retirer Pikachu des favoris' }).first()).toBeVisible();
  });
});
