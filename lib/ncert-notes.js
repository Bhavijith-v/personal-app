/* Class notes that ship with the app. Each is Markdown: "## " starts a section,
   {{fig:name}} places an illustration from lib/ncert-figs.js.
   You can edit any of them in the app (your copy is kept in your own data and
   "Reset" brings this one back) and add more by pasting or uploading Markdown.
   Public study material only. */
window.NCERT_NOTES = [
  {
    id: 'n6geo',
    c: '6',
    s: 'geo',
    t: 'Geography: short notes',
    md: String.raw`## 🌙 Moon Faces & Movement
{{fig:moon}}
**Cycle:** 🌑 New → 🌒 Waxing crescent → 🌓 First quarter → 🌔 Waxing gibbous → 🌕 Full → 🌖 Waning gibbous → 🌗 Last quarter → 🌘 Waning crescent
- ⏱️ Phase cycle (synodic) is **29.5 days**. Orbit around Earth (sidereal) is **27.3 days**.
- 🔒 Rotation period equals revolution period, so we always see the same face (**~59% visible**).
- 🌑 Solar eclipse happens at **New Moon**. 🌕 Lunar eclipse happens at **Full Moon**.
- 🌊 Spring tide at New and Full Moon. Neap tide at the quarters.
- 📏 Distance is ~3.84 lakh km. **Perigee** is nearest and **apogee** is farthest.
{{fig:tides}}

## 🪐 Solar System
{{fig:planets}}
| # | Planet | AU | Rotation | Revolution | Moons | Key fact |
|---|---|---|---|---|---|---|
| 1 | Mercury | 0.39 | 59 d | 88 d | 0 | Smallest, fastest |
| 2 | Venus | 0.72 | 243 d (retrograde) | 225 d | 0 | Hottest, brightest |
| 3 | Earth | 1 | 24 h | 365¼ d | 1 | Only life |
| 4 | Mars | 1.52 | 24 h 37 m | 687 d | 2 | Red planet; Phobos and Deimos |
| 5 | Jupiter | 5.2 | ~10 h | 11.9 y | 95+ | Largest; shortest day |
| 6 | Saturn | 9.6 | ~10.7 h | 29.5 y | 270+ | Rings; lighter than water |
| 7 | Uranus | 19.2 | 17 h (retrograde) | 84 y | 28 | Rolls on its side (tilt ~98°) |
| 8 | Neptune | 30 | 16 h | 165 y | 16 | Farthest, windiest |

> 🧠 **My Very Educated Mother Just Served Us Noodles**: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune.

- 🧠 First 4 are **terrestrial** (rocky). Last 4 are **Jovian** (gas and ice giants).
- 🔄 Venus and Uranus spin **east to west**.
- 🌟 Dwarf planets: Ceres, Pluto, Eris, Haumea, Makemake.
- 📐 Size order: Jupiter > Saturn > Uranus > Neptune > Earth > Venus > Mars > Mercury.

## 🛡️ Belts
- ☄️ **Asteroid belt**: between Mars and Jupiter (Ceres is here).
- 🧊 **Kuiper belt**: beyond Neptune, 30–50 AU (Pluto; short-period comets).
- ☁️ **Oort cloud**: farthest shell (long-period comets).
- ☢️ **Van Allen belts**: radiation belts around Earth (inner and outer).

## ☄️ Asteroid vs Meteor
{{fig:meteor}}
| Term | Meaning |
|---|---|
| Asteroid | Rocky body orbiting the Sun, large (Ceres ~940 km) |
| Meteoroid | Small rock or dust in space |
| Meteor | Streak of light when it burns in the atmosphere ("shooting star") |
| Meteorite | Piece that reaches the ground |
| Comet | Ice and dust, tail points away from the Sun |

- **Asteroid types:** C (carbonaceous, ~75%), S (stony), M (metallic). Near-Earth families are Apollo, Aten and Amor. Trojans share Jupiter's orbit.
- **Meteorite types:** Stony (aerolite), Iron (siderite), Stony-iron (siderolite).

## 📐 Key Latitudes & Meridians
- **0°** Equator, **23½°N** Tropic of Cancer, **23½°S** Tropic of Capricorn
- **66½°N** Arctic Circle, **66½°S** Antarctic Circle, **90°** Poles
- 1° latitude ≈ 111 km.
- **0°** Prime Meridian (Greenwich), **180°** International Date Line (IDL), **82½°E** IST meridian

## 🔥 Heat Zones
{{fig:zones}}
- 🔴 **Torrid**: 23½°N to 23½°S. Sun overhead at least once a year.
- 🟢 **Temperate**: 23½° to 66½° in each hemisphere.
- 🔵 **Frigid**: 66½° to 90°.

## 🌐 Countries on Lines
- **Equator (13):** São Tomé & Príncipe, Gabon, Congo, DR Congo, Uganda, Kenya, Somalia, Maldives (sea), Indonesia, Kiribati, Ecuador, Colombia, Brazil.
- **Tropic of Cancer:** Mexico, Bahamas, W. Sahara, Mauritania, Mali, Algeria, Niger, Libya, Chad, Egypt, Saudi Arabia, UAE, Oman, India, Bangladesh, Myanmar, China, Taiwan.
  - 🇮🇳 **8 Indian states:** Gujarat, Rajasthan, MP, Chhattisgarh, Jharkhand, West Bengal, Tripura, Mizoram.
- **Tropic of Capricorn (10):** Namibia, Botswana, South Africa, Mozambique, Madagascar, Australia, Chile, Argentina, Paraguay, Brazil.
- **Prime Meridian (8):** UK, France, Spain, Algeria, Mali, Burkina Faso, Togo, Ghana.
- **Arctic Circle:** Norway, Sweden, Finland, Russia, USA (Alaska), Canada, Greenland (Denmark), Iceland (Grimsey).
- **82½°E (IST), 5 states:** UP (Mirzapur), MP, Chhattisgarh, Odisha, Andhra Pradesh.

## ⏰ Time Calculations
{{fig:time}}
- 🌍 Earth turns 360° in 24 h, so **15° = 1 hour** and **1° = 4 minutes**.
- ➡️ **East is ahead** (add time). ⬅️ **West is behind** (subtract).
- 🇮🇳 **IST = GMT + 5:30**, because 82½ × 4 = 330 min.
- ✏️ **Formula:** Time difference = longitude difference × 4 min.
- **Ex 1:** London 12:00 noon → India **5:30 PM**.
- **Ex 2:** New York (75°W) is GMT − 5. India 12:00 noon → NY **1:30 AM**.
- 🗺️ India spans 68°E to 97°E, about 2 hours of sun-time difference. Standard time keeps it uniform.
- 📅 **IDL:** crossing it going **west → add a day**; going **east → subtract a day**.
- 🌐 24 time zones, each 15° wide.

## 🌍 Orbital Plane & Illumination
- **Orbital plane:** the plane of Earth's orbit around the Sun.
- Axis is tilted **23½° from the vertical** (66½° to the orbital plane) and stays parallel to itself.
- **Circle of illumination:** the great circle that separates day from night.
- ☀️ Perihelion is ~3 Jan (nearest, 147 m km). Aphelion is ~4 Jul (farthest, 152 m km).
- 🔄 Rotation gives day and night, plus the Coriolis effect. Revolution gives seasons.

## 🍂 Seasons
{{fig:seasons}}
| Date | Event | Sun overhead |
|---|---|---|
| 21 Mar | Spring equinox | Equator |
| 21 Jun | **Summer solstice (N)**, longest day | Tropic of Cancer |
| 23 Sep | Autumn equinox | Equator |
| 22 Dec | **Winter solstice (N)**, shortest day | Tropic of Capricorn |
- 🔁 Seasons are reversed in the Southern Hemisphere.
- 🌅 At equinox, day = night everywhere, and the circle of illumination passes through the poles.
- 🌞 At the June solstice, the Arctic Circle has 24 h of daylight (midnight sun).

## 🌊 Domains & Water
{{fig:water}}
- 4 domains: Lithosphere, Hydrosphere, Atmosphere, Biosphere.
- **71% water and 29% land.**
- Southern Hemisphere is ~81% water. Northern is ~61%.
- Of all water, ~97% is ocean (salty) and ~3% is fresh.
- Of fresh water, ~69% is ice, ~30% is groundwater, and ~0.3% is surface water.

## 🗺️ Continents & Oceans
- **Continents:** Asia > Africa > N. America > S. America > Antarctica > Europe > Australia.
- **Oceans:** Pacific > Atlantic > Indian > Southern > Arctic.
- Pacific has the Mariana Trench (~11 km) and Ring of Fire. Indian Ocean is the only one named after a country.
- **Highest peaks:** Everest (Asia), Aconcagua (S. Am), Denali (N. Am), Kilimanjaro (Africa), Elbrus (Europe), Vinson (Antarctica), Kosciuszko (Australia).

## 🌬️ Atmosphere Layers
{{fig:atmos}}
| Layer | Height | Key point |
|---|---|---|
| Troposphere | 0–13 km (18 at equator, 8 at poles) | Weather; temp falls 6.5°C/km |
| Stratosphere | to ~50 km | **Ozone** (15–35 km); jets fly here |
| Mesosphere | to ~80 km | Coldest (−90°C); meteors burn |
| Thermosphere | to ~600 km | Ionosphere (radio waves); aurora; hot |
| Exosphere | above | Merges into space |
- Boundaries: Tropopause, Stratopause, Mesopause. 🧠 *TSMTE*.
- Gases: N₂ 78%, O₂ 21%, Ar 0.93%, CO₂ ~0.04%.

## ⛰️ Mountain Types
{{fig:mtns}}
- **Fold:** Himalaya, Alps, Rockies, Andes (young). Aravalli, Urals, Appalachians (old).
- **Block/fault:** Vosges, Black Forest, Sierra Nevada, Satpura.
- **Volcanic:** Fuji, Kilimanjaro, Etna, Vesuvius, Mauna Loa.
- **Residual:** Nilgiri, Western Ghats, Vindhya (worn-down plateaus).

## 🇮🇳 India: Extent
{{fig:india}}
- **Mainland latitude:** 8°4'N to 37°6'N. **Longitude:** 68°7'E to 97°25'E.
- 📍 **South:** Kanyakumari (mainland); Indira Point (Great Nicobar) is the extreme south. **North:** Indira Col. **East:** Kibithu. **West:** Guhar Moti.
- N–S ~3,214 km, E–W ~2,933 km.
- Area is 32.8 lakh km² (7th largest, 2.4% of world).
- Land border ~15,200 km. Coastline ~7,516 km.
- 7 land neighbours: Pakistan, Afghanistan, China, Nepal, Bhutan, Bangladesh, Myanmar. The longest border is with Bangladesh.

## 🏛️ 28 States & Capitals
AP-Amaravati • Arunachal-Itanagar • Assam-Dispur • Bihar-Patna • Chhattisgarh-Raipur • Goa-Panaji • Gujarat-Gandhinagar • Haryana-Chandigarh • HP-Shimla • Jharkhand-Ranchi • Karnataka-Bengaluru • Kerala-Thiruvananthapuram • MP-Bhopal • Maharashtra-Mumbai • Manipur-Imphal • Meghalaya-Shillong • Mizoram-Aizawl • Nagaland-Kohima • Odisha-Bhubaneswar • Punjab-Chandigarh • Rajasthan-Jaipur • Sikkim-Gangtok • TN-Chennai • Telangana-Hyderabad • Tripura-Agartala • UP-Lucknow • Uttarakhand-Dehradun • WB-Kolkata

**8 UTs:** Andaman & Nicobar-Sri Vijaya Puram (ex Port Blair) • Chandigarh • DNH & Daman Diu-Daman • Delhi-New Delhi • J&K-Srinagar (summer)/Jammu (winter) • Ladakh-Leh • Lakshadweep-Kavaratti • Puducherry

## 🏔️ Important Ranges & Peaks
- **Himalaya, Karakoram, Pir Panjal, Zanskar, Ladakh.** Eastern hills (Purvanchal): Patkai, Naga, Manipur, Mizo.
- **Peninsular:** Aravalli (Guru Shikhar 1,722 m), Vindhya, Satpura (Dhupgarh), Western Ghats (Anamudi 2,695 m, highest in peninsular India), Eastern Ghats (Mahendragiri), Nilgiri (Doddabetta), Cardamom.
- **Kanchenjunga** (8,586 m) is the highest in India. **Nanda Devi** is the highest entirely inside India. K2 is in PoK.

## 🧭 Physical Divisions of India
{{fig:himalaya}}
1. **Northern mountains**, 2. **Northern plains**, 3. **Peninsular plateau**, 4. **Thar desert**, 5. **Coastal plains**, 6. **Islands**

**Himalaya (south to north):**
- **Shiwalik** (Outer, youngest), **Himachal** (Lesser), **Himadri** (Greater, highest), **Trans-Himalaya** (Karakoram, Ladakh, Zanskar).
- **Regional:** Punjab (Indus–Satluj), Kumaon (Satluj–Kali), Nepal (Kali–Tista), Assam (Tista–Dihang).

**Northern plains:** Bhabar (pebbles) → Terai (marsh) → Bhangar (old alluvium) → Khadar (new alluvium).

**Plateau:** Central Highlands (Malwa, Bundelkhand, Baghelkhand), Deccan, Chota Nagpur, Meghalaya.

**Coasts:** West is Konkan, Kannad, Malabar. East is Northern Circars, Coromandel, Utkal.

**Islands:** Andaman & Nicobar are separated by the **Ten Degree Channel**. Lakshadweep is coral.
`
  },
  {
    id: 'n7geo',
    c: '7',
    s: 'geo',
    t: 'Geography: Our Environment (short notes)',
    md: String.raw`Short notes for NCERT Class 7 *Our Environment*, plus extras UPSC asks. 🌱

## 🌿 Biotic / Abiotic / Ecosystem
- 🐾 **Biotic**: living (plants, animals, microbes). 🪨 **Abiotic**: non-living (air, water, soil, light, temperature).
- **Ecosystem** = biotic + abiotic parts interacting. It can be natural (forest, pond) or human-made (garden, aquarium).
- Roles: **Producers** (plants), **Consumers** (herbivores, carnivores, omnivores), **Decomposers** (fungi, bacteria).
- Environment has three types: natural, human-made and human.

## 🌋 Earth's Interior
{{fig:interior}}
| Layer | Depth | Notes |
|---|---|---|
| **Crust** | 5–70 km (oceanic ~5, continental ~35) | ~1% of volume. Sial (continents) and sima (ocean floor) |
| **Mantle** | to 2,900 km | ~84% of volume. Silicate rock; upper part is the **asthenosphere** (magma source) |
| **Core** | 2,900–6,371 km | ~15% of volume. Outer core is liquid. Inner core is solid. **Nife** (nickel and iron) |

- Crust by weight: O 46.6%, Si 27.7%, Al 8.1%, Fe 5%, then Ca, Na, K, Mg.
- Whole Earth: Fe 32%, O 30%, Si 15%, Mg 14%.
- Discontinuities: **Moho** (crust–mantle), **Gutenberg** (mantle–core), **Lehmann** (outer–inner core).
- Core temperature is ~5,000°C or more. Radius is 6,371 km.

## 🪨 Rock Cycle
{{fig:rocks}}
- **Igneous** (from cooled magma):
  - Intrusive: granite, gabbro, diorite.
  - Extrusive: basalt, rhyolite, andesite, pumice, obsidian.
- **Sedimentary** (layers, fossils):
  - Mechanical: sandstone, conglomerate, shale.
  - Chemical: limestone, gypsum, rock salt.
  - Organic: coal, peat, coral limestone.
- **Metamorphic** (heat and pressure):
  - limestone → **marble**
  - shale → **slate** → schist
  - sandstone → **quartzite**
  - granite → **gneiss**
  - coal → graphite
- **Cycle:** igneous → weathering → sedimentary → heat/pressure → metamorphic → melting → magma. 🔄

## 🌋 Volcano
{{fig:volcano}}
- **Terms:** vent, crater, magma (below) vs lava (above), caldera, fissure.
- **Types:** active, dormant, extinct.
  - Active: Mauna Loa, Etna, Stromboli ("Lighthouse of the Mediterranean"), **Barren Island** (India's only active volcano).
  - Dormant: Fuji, Narcondam, Kilimanjaro.
- **Shapes:** shield, composite, cinder cone.
- 🔥 **Ring of Fire** (Pacific) holds ~75% of volcanoes. **Ojos del Salado** is the highest active volcano.

## 🌐 Earthquake
{{fig:quake}}
- **Focus** (hypocentre) is the origin point. **Epicentre** is the point directly above it on the surface.
- **Waves:**
  - P (primary): fastest, travels through solid, liquid and gas.
  - S (secondary): solids only.
  - L (surface): slowest and most destructive.
- **Seismograph** records them. **Richter** scale measures magnitude. **Mercalli** scale measures intensity.
- 🕳️ Shadow zone: S-waves do not pass the liquid outer core, which proves it is liquid.
- 🌊 **Tsunami**: giant sea waves from undersea quakes.
- 🇮🇳 India has seismic zones II–V. **V** is the highest risk (NE, Kashmir, Kutch, Andaman).

## 🏞️ River Landforms
{{fig:river}}
- **Upper course** (erosion): V-valley, gorge, canyon, waterfall, rapids, potholes.
- **Middle:** meanders, alluvial fans.
- **Lower** (deposition): floodplain, **levees**, **oxbow lake**, **delta**.

## 🌊 Sea Work
{{fig:coast}}
- Erosion order: **cave → arch → stack → stump**. Also sea cliff and wave-cut platform.
- Deposition: beach, spit, bar, lagoon.

## 🧊 Ice Work
- **Erosion:** U-shaped valley, cirque, arête, horn (pyramidal peak), hanging valley, fjord.
- **Deposition:** moraines (terminal, lateral, medial, ground), drumlin, esker, kame, outwash plain, erratics.

> 🧠 River valleys are **V**-shaped; glacier valleys are **U**-shaped.

## 🌬️ Wind Work
- **Erosion:** deflation, abrasion, mushroom rocks, yardang, ventifact.
- **Deposition:** sand dunes (barchan crescent-shaped, seif longitudinal), **loess** (fertile dust, China).
- Desert floors: erg (sand), reg (gravel), hamada (rock).

## 🌡️ Atmosphere & Temperature
- Composition: N₂ 78%, O₂ 21%, Ar 0.93%, CO₂ 0.04%, plus water vapour and dust.
- **Insolation**: incoming solar radiation.
- **Albedo**: reflectivity (~35% reflected, 14% absorbed by atmosphere, 51% by surface).
- **Terrestrial radiation**: Earth re-radiates long-wave heat.
- Heat transfer: **conduction** (contact), **convection** (vertical), **advection** (horizontal, e.g. Loo).
- **Lapse rate**: 6.5°C per km. **Inversion**: temperature rises with height.
- **Isotherm**: line joining equal temperature. **Greenhouse effect**: CO₂, CH₄ trap heat.
- ☀️ Insolation varies with latitude, day length, altitude and cloud cover.

## 🧭 Air Pressure & Winds
{{fig:winds}}
- Pressure: **1013.25 mb** at sea level. **Barometer** measures it. It falls with height. **Isobar** joins equal pressure.
- **Belts:** Equatorial low (**doldrums**), subtropical high (30°, **horse latitudes**), subpolar low (60°), polar high.
- **Winds:**
  - **Trade winds** (0–30°): NE in the north, SE in the south.
  - **Westerlies** (30–60°): "roaring forties, furious fifties, shrieking sixties" in the south.
  - **Polar easterlies**.
- Winds deflect right in the north and left in the south (**Coriolis**).
- **Local:** Loo (India), Chinook ("snow eater"), Foehn (Alps), Mistral, Harmattan ("doctor").
- Land and sea breeze, **monsoon** and jet streams.

## 🌧️ Rainfall Types
{{fig:rain}}
- **Convectional**: daily, equatorial.
- **Orographic/relief**: windward slope gets rain. Leeward is **rain shadow**.
- **Cyclonic/frontal**: where air masses meet.
- 📍 Mawsynram (Meghalaya) is the wettest place.

## 🏞️ Lakes
- **Tectonic**: Caspian (largest), Baikal (deepest), Tanganyika, Dead Sea.
- **Glacial**: Great Lakes, Finger Lakes. Superior is the largest freshwater by area.
- **Volcanic crater**: Crater Lake. Lonar (Maharashtra) is an impact crater.
- **Oxbow**: river-cut meander lake.
- **Lagoon**: Chilika (largest brackish lagoon in Asia), Pulicat, Vembanad.
- **Salt**: Great Salt Lake, Dead Sea (lowest point on land), Sambhar (largest inland saline lake in India).
- **Artificial**: Gobind Sagar, Hirakud.
- 🇮🇳 Wular is the largest freshwater lake in India. Titicaca is the highest navigable lake.

## 💧 Water in Numbers
- Total water ~1,386 million km³. **Oceans ~97%**, **fresh ~2.5–3%**.
- Fresh water: **glaciers/ice ~69%**, **groundwater ~30%**, surface and other ~1%. Lakes are about 0.25% and rivers about 0.006% of fresh water.
- Ocean area: Pacific ~46%, Atlantic ~23%, Indian ~20%, Southern and Arctic are the rest.
- Average ocean salinity is **35‰** (35 g per litre). Dead Sea is about 340‰.

## 🌙 Tides
{{fig:tides}}
- 🌊 High tide twice a day. Successive high tides are about **12 h 26 m** apart.
- **Spring tide**: New and Full Moon (Sun, Moon and Earth in line), highest range.
- **Neap tide**: quarter moons (right angles), lowest range.
- **Bay of Fundy** has the highest tides. Southampton has a double tide. A tidal bore is a wave moving up an estuary.
- Tides help navigation, fishing, and power generation.

## 🌀 Ocean Currents
{{fig:currents}}
- Caused by prevailing winds, Coriolis, temperature, salinity and coasts. Gyres circulate **clockwise in the north, anticlockwise in the south**.
- 🔴 **Warm:** Gulf Stream, North Atlantic Drift, Kuroshio, Brazil, Agulhas, East Australian.
- 🔵 **Cold:** Labrador, Oyashio, California, Canary, **Humboldt (Peru)**, Benguela, West Australian, Falkland.
- 🌫️ Fog and rich fishing grounds appear where warm and cold currents meet (Grand Banks).
- 🏜️ Cold currents help create coastal deserts (Atacama, Namib).
- Indian Ocean currents **reverse with the monsoon**.
- 🧂 The **Sargasso Sea** has no coast, only currents.

## 🌳 Forests of the World
| Type | Latitude/Region | Trees & facts |
|---|---|---|
| **Tropical evergreen** | Equatorial: Amazon, Congo, Indonesia | Very wet; mahogany, ebony, rosewood; densest |
| **Tropical deciduous** (monsoon) | India, Myanmar, N. Australia | Teak, sal, sandalwood; shed leaves in dry season |
| **Temperate evergreen** | East coasts, 30–50°: SE USA, S China, Japan | Oak, pine, eucalyptus |
| **Temperate deciduous** | 40–60°: NW Europe, NE USA, Japan | Oak, ash, beech, maple |
| **Mediterranean** | West coasts, 30–40°: California, Chile, S. Africa, SW Australia | Dry summer, wet winter; citrus, olive, grapes. "Orchard of the world" |
| **Coniferous (taiga)** | 50–70°N: Siberia, Canada, Scandinavia | Pine, spruce, fir; softwood for paper and matchsticks |
| **Tundra** | Arctic | Moss, lichen; reindeer |

## 🌾 Grasslands
- **Tropical:** Savanna (Africa), Campos (Brazil), Llanos (Venezuela/Colombia).
- **Temperate:** Prairies (N. America), Pampas (Argentina/Uruguay), Steppes (Eurasia), Veldt (S. Africa), Downs (Australia), Canterbury (NZ), Pusta (Hungary).

## 🌿 Amazon Basin
- Amazon is ~6,400 km. It has the **largest basin and volume** of any river, and originates in the **Andes (Peru)**, draining into the Atlantic. It crosses mostly Brazil.
- Equatorial climate. Dense *selva*, huge biodiversity: jaguar, anaconda, piranha, macaw, river dolphin.
- Tributaries: Negro, Madeira. At Manaus, the "Meeting of Waters".
- Threats: deforestation (cattle, soy).

## 🇮🇳 Ganga–Brahmaputra Basin
- **Ganga**: ~2,525 km. Bhagirathi and Alaknanda meet at **Devprayag**. Left tributaries: Ghaghara, Gandak, Kosi. Right: Yamuna, Son.
  - Largest river basin in India. Forms the **Sundarbans delta** (largest delta, Bengal tiger).
- **Brahmaputra**: Tsangpo (Tibet) → Siang/Dihang (Arunachal) → Brahmaputra (Assam) → Jamuna (Bangladesh). Tributaries: Lohit, Dibang, Subansiri, Teesta.
  - **Majuli** is the largest river island.
- Fertile alluvium, dense population, floods. Namami Gange is the cleaning mission.

## 🏜️ Sahara
- Largest hot desert (~9 m km²), across 11 or more North African countries.
- Rain under 25 cm. Day ~50°C, nights near freezing.
- **Causes:** subtropical high-pressure belt and trade winds.
- Features: ergs (dunes), hamada, **oases** (dates), Nile cuts through. Harmattan is the wind. Tuareg and Bedouin people.
- Resources: oil, gas, phosphates. The **Sahel** lies south of it.

## ❄️ Cold Desert: Ladakh
- Lies in the **rain shadow of the Himalaya**, at 3,000+ m, with under 10–15 cm rain.
- Winters drop to −30°C or lower. Dras is among the coldest inhabited places.
- Wildlife: snow leopard, yak, Changthangi (Pashmina) goat, Bactrian camel (Nubra).
- Geography: Indus river, Pangong Tso, Zoji La, Khardung La. Hemis National Park.
- People are Ladakhis and Changpa nomads. Crops: barley, apricot.
- Ladakh became a UT in **2019**. Spiti and Lahaul (HP) form the Cold Desert Biosphere Reserve.
`
  }
];
