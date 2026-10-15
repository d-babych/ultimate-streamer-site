# R5-ключі: кандидати «не перекладати» (чернетка)

Список ключів, чиї значення зараз мають у `comment` позначку `Intentionally not translated` (правило R5 з [`task-lozalization.md`](../task-lozalization.md)). Це означає: у `uk`, `pt-BR`, `es-419` значення на етапі 3.2 копіюється англійським один-в-один.

> **Платформа: iOS.** Ключі в списку — це ключі iOS-каталогів `Streamer/Localization/*.xcstrings` (колонка «Таблиця» — назва каталогу). Загальні правила, у тому числі категорії R5 для інших платформ, див. у [`localization-guidelines.md`](localization-guidelines.md).

Згруповано за причиною.

## 1. Технічні одиниці й формати (не мають природного перекладу)

| Ключ | Значення | Таблиця |
|---|---|---|
| `setup.timer.format.mmss` | `MM:SS` | StreamSetup |
| `setup.timer.format.hhmmss` | `HH:MM:SS` | StreamSetup |
| `setup.frameRate.30.title` / `.segment` | `30 fps` / `30 FPS` | StreamSetup |
| `setup.frameRate.60.title` / `.segment` | `60 fps` / `60 FPS` | StreamSetup |
| `setup.resolution.4k.title` / `.segment` | `4K: 3840x2160` / `4K` | StreamSetup |
| `setup.resolution.fullHD.title` / `.segment` | `Full HD: 1920x1080` / `FHD 1080p` | StreamSetup |
| `setup.resolution.hd.title` / `.segment` | `HD: 1280x720` / `HD 720p` | StreamSetup |
| `setup.resolution.vga.title` | `VGA: 640x480` | StreamSetup |
| `setup.resolution.sd.segment` | `SD 480p` | StreamSetup |
| `pickers.replay.size.kb %lld` | `%lld kB` | Pickers |
| `pickers.replay.speed.050/075/150.button` | `0.50x` / `0.75x` / `1.5x` | Pickers |
| `stream.health.rtmp` / `.video` / `.youtube` / `.device %@` | health-діагностика (RTMP queue, bitRate…) | Stream |
| `remote.keyboard.health.rtmp` / `.youtube` | дублікат health-діагностики для Remote-екрана | Remote |

**Обґрунтування:** формати часу, fps, роздільність і health-діагностика — технічні написи, які й в англомовному оригіналі не є природною мовою. Перекладати нема чого.

## 2. Назви продуктів/протоколів (власні назви)

| Ключ | Значення | Таблиця |
|---|---|---|
| `stream.network.wifi` | `Wi-Fi` | Stream |
| `stream.network.ethernet` | `Ethernet` | Stream |
| `setup.destination.youtube.segment` | `YouTube` | StreamSetup |
| `setup.destination.rtmp.segment` | `RTMP` | StreamSetup |

**Обґрунтування:** бренди й назви протоколів, не перекладаються за конвенцією.

## 3. Спортивна термінологія / скорочення

| Ключ | Значення | Таблиця |
|---|---|---|
| `setup.bestOf.summary %lld` | `Best of %lld` | StreamSetup |
| `setup.scoringSystem.football.segment` | `TD/FG` (touchdown/field goal) | StreamSetup |

**Обґрунтування:** усталені англомовні спортивні терміни/абревіатури, які використовуються без перекладу в спортивних трансляціях будь-якою мовою.

## 4. Назви рівнів підписки (бренд тарифу)

| Ключ | Значення | Таблиця |
|---|---|---|
| `paywall.tier.pro` | `Pro` | Paywall |
| `paywall.tier.pro.segment` | `PRO` | Paywall |
| `paywall.tier.premium` | `Premium` | Paywall |
| `paywall.tier.premium.segment` | `PREMIUM` | Paywall |
| `paywall.tier.free` | `Free` | Paywall |

**Обґрунтування:** назви тарифів — частина бренду продукту (як «iPhone Pro»), лишаються англійською в усіх мовах. Рішення: `paywall.tier.free` теж додано до R5 для симетрії з Pro/Premium.

## 5. Продукт і легальний текст

| Ключ | Значення | Таблиця |
|---|---|---|
| `home.title` | `Streamer` | Home |
| `home.legal.openSource` | Блок ліцензій (HaishinKit, іконки) | Home |

**Обґрунтування:** назва застосунку й юридично точний ліцензійний текст (авторські права, назви бібліотек, URL) — перекладати ризиковано і не потрібно.

## 6. Вирішено: назви ефектів фільтрів перекладаються (не R5)

`filters.name.lomo` і `filters.name.sepia` **прибрано з R5**, перекладаються нарівні з рештою 9 назв ефектів. Рішення: `uk` — практична транслітерація («Сепія», «Ломо»); `pt-BR`/`es-419` — фактично той самий англійський варіант («Sepia», «Lomo»), бо слово збігається з мовою.

## 7. Вирішено: абревіатури Offense/Serve/Possession перекладаються (виняток із R1)

`Contest.PossessionType.buttonName` (OFS/SRV/POS) раніше підпадав під R1 як «абревіатура оверлея», але фактично використовується лише як підпис кнопки перемикання володіння на екрані стріму та Remote-екрані (`StreamViewController`, `RemoteKeyboardViewController`) — у відеооверлей (`ScoreBugPresenter+*`) ця абревіатура не потрапляє. Тому переклад не порушує оригінальне рішення «не перекладати табло/оверлеї»: локалізується лише елемент керування застосунком, не бачений глядачем стріму. Реалізовано: `Contest.PossessionType.buttonName` (модель) → `localizedButtonName` (`Contest.PossessionType+Presentation.swift`), 3 нові ключі в `Stream.xcstrings` (`stream.possession.offense/serve/possession.abbreviation`), одразу заповнені всіма чотирма мовами:

| | Offense | Serve | Possession |
|---|---|---|---|
| en | OFS | SRV | POS |
| uk | АТК | ПОД | ВОЛ |
| pt-BR | ATQ | SAQ | POS |
| es-419 | ATA | SAQ | POS |

[`task-lozalization.md`](../task-lozalization.md) (R1) оновлено — див. нижче.

## Підсумок: що затверджено
1. **Група 1–5 (37 ключів, з `paywall.tier.free`)** — затверджено.
2. **`filters.name.lomo` / `filters.name.sepia`** — прибрано з R5, перекладаються (група 6).
3. **OFS/SRV/POS** — переклад реалізовано в коді й каталозі (група 7), у R5 ніколи не входив.
