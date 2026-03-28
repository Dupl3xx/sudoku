# Sudoku – Build Guide

## Přehled

Sudoku je iOS aplikace postavená na **Expo / React Native**.
Builduje se v cloudu přes **EAS** (Expo Application Services) – není potřeba Mac.

---

## Rychlý start

### 1. EAS build (cloud, doporučeno)

```bash
cd D:/weby/ipa/Sudoku
eas login        # přihlásit se Expo účtem (dupl3xx)
eas build --platform ios --profile preview --non-interactive
```

EAS builduje na svém macOS serveru.
Odkaz ke stažení IPA se zobrazí v terminálu i na:
👉 https://expo.dev/accounts/dupl3xx/projects/sudoku-ondrej/builds

### 2. Re-signing + nasazení

Po stažení URL podepsaného IPA spusť:

```bash
python sign_and_deploy.py "https://expo-...amazonaws.com/builds/xxx.ipa"
```

Skript:
- Stáhne IPA z EAS
- Znovu podepíše přes **ipasign.pro** (cert.p12 + .mobileprovision z D:/iPhone/2026/)
- Uloží jako `docs/Sudoku.ipa`

### 3. Nasazení na GitHub Pages

```bash
git add docs/Sudoku.ipa
git commit -m "Update IPA v1.x.x"
git push
```

Instalační stránka: **https://dupl3xx.github.io/sudoku/**

---

## Detailní postup pro EAS managed credentials

Při prvním buildu EAS vyzve k registraci zařízení nebo vytvoření provisioning profilu.
Pokud chceš přidat zařízení:

```bash
eas device:create
```

Pak znovu spusť build.

---

## Přidání nového jazyku

1. Vytvoř `src/i18n/locales/XX.ts` (zkopíruj `en.ts`, přelož)
2. Přidej do `src/i18n/index.ts`
3. Přidej do `SUPPORTED_LANGUAGES`

---

## Aktualizace verze

Uprav v `app.json`:
```json
"version": "1.1.0",
"ios": { "buildNumber": "2" }
```

---

## Informace o certifikátu

| | |
|---|---|
| **Developer** | Ondrej Levy |
| **Team ID** | RW4Q5ZGHM2 |
| **Bundle ID** | com.google.ios.youtube.RW4Q5ZGHM2 |
| **Profile UUID** | 21f42260-62dd-4dd7-8363-3fbb9373c832 |
| **Platnost** | do 2027-02-18 |
| **Registrovaná zařízení** | 8 |

---

## Funkce aplikace

- ✅ 3 obtížnosti (Lehká / Střední / Těžká)
- ✅ Denní výzva (seed podle data, stejná pro všechny)
- ✅ Tužkové poznámky (pencil marks / kandidáti)
- ✅ Nápovědy (konfigurovatelný počet)
- ✅ Zpět (undo, až 50 kroků)
- ✅ Automatická kontrola chyb + zvýraznění
- ✅ Zvýraznění stejných čísel + příbuzných buněk
- ✅ Haptická odezva
- ✅ Statistiky s rekordními časy a sériemi
- ✅ 7 jazyků (cs, en, sk, de, fr, es, pl)
- ✅ Tmavý / světlý / automatický režim
- ✅ Pokračování rozpracované hry
- ✅ Pracuje offline
