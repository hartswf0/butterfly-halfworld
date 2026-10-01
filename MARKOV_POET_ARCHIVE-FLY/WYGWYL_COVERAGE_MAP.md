# 🗺 WYGWYL 14-Poem Coverage & Probabilistic Shot Routing Map

This tool uses deep LLM semantic and visual probability matching to route all 135 shots directly to their exact poem lines, providing a complete map of coverage, alternative routes, and visual redundancies.

## 📊 Global Coverage Metrics
- **Global Line Coverage**: `48.8%`
- 🟢 **Fully Covered Stanzas (2+ candidate shots)**: `18 / 41`
- 🟡 **Thin Stanzas (1 candidate shot)**: `4 / 41`
- 🔴 **Gaps / Uncovered Stanzas (0 shots)**: `19 / 41`
- 👥 **Redundancy Clusters**: `26` distinct archetypes across 135 shots

---

## 📋 Stanza-by-Stanza Coverage Matrix

### Suite 01 — OUT OF LIFE

#### 🔴 [01_S1] `GAP` (0 shots)
- **Ground Truth Line**: *"What we've made, we don't want. What we've sold — to the world, to ourselves — doesn't exist."*
- **Target Visual**: `Empty room, modern domestic items, unmade bed, false commodities`
- ⚠️ **NO DIRECT SHOT MATCH IN ARCHIVE — VISUAL GAP**

#### 🔴 [01_S2] `GAP` (0 shots)
- **Ground Truth Line**: *"I look for a way out: through the hallways, within the drawers, and fire escapes."*
- **Target Visual**: `Corridors, hallways, pulling open drawers, metal fire escapes`
- ⚠️ **NO DIRECT SHOT MATCH IN ARCHIVE — VISUAL GAP**

#### 🟢 [01_S3] `COVERED` (68 shots)
- **Ground Truth Line**: *"The vape gathers, inside and out. My vision blurs. I move toward the window — and you only get further away."*
- **Target Visual**: `POET in dim teal room moving toward rain window, dense blue vapor, distant headlights`
- **Assigned Shots**:
  - `[P001]` **`2474f1b5`** (POET_DIM_BEDROOM) — **Probability: `99%`** | *Literal visual match: The POET standing in dim teal bedroom moving toward rain window overlooking black car.*
  - `[P002]` **`7534249f`** (POET_DIM_BEDROOM) — **Probability: `99%`** | *Literal visual match: The POET standing in dim teal bedroom moving toward rain window overlooking black car.*
  - `[P003]` **`0a69c776`** (POET_DIM_BEDROOM) — **Probability: `99%`** | *Literal visual match: The POET standing in dim teal bedroom moving toward rain window overlooking black car.*
  - `[P004]` **`1ea914c8`** (POET_DIM_BEDROOM) — **Probability: `99%`** | *Literal visual match: The POET standing in dim teal bedroom moving toward rain window overlooking black car.*
  - `[P005]` **`9f391a75`** (POET_DIM_BEDROOM) — **Probability: `99%`** | *Literal visual match: The POET standing in dim teal bedroom moving toward rain window overlooking black car.*
  - `[P006]` **`bcc4949f`** (POET_DIM_BEDROOM) — **Probability: `99%`** | *Literal visual match: The POET standing in dim teal bedroom moving toward rain window overlooking black car.*
  - `[P007]` **`90db999f`** (POET_DIM_BEDROOM) — **Probability: `99%`** | *Literal visual match: The POET standing in dim teal bedroom moving toward rain window overlooking black car.*
  - `[P008]` **`a5a18f9d`** (POET_DIM_BEDROOM) — **Probability: `99%`** | *Literal visual match: The POET standing in dim teal bedroom moving toward rain window overlooking black car.*
  - `[P009]` **`5321a933`** (POET_DIM_BEDROOM) — **Probability: `99%`** | *Literal visual match: The POET standing in dim teal bedroom moving toward rain window overlooking black car.*
  - `[P010]` **`e01016b7`** (POET_DIM_BEDROOM) — **Probability: `99%`** | *Literal visual match: The POET standing in dim teal bedroom moving toward rain window overlooking black car.*
  - `[P011]` **`72b8186d`** (POET_DIM_BEDROOM) — **Probability: `99%`** | *Literal visual match: The POET standing in dim teal bedroom moving toward rain window overlooking black car.*
  - `[P012]` **`64024978`** (POET_DIM_BEDROOM) — **Probability: `99%`** | *Literal visual match: The POET standing in dim teal bedroom moving toward rain window overlooking black car.*
  - `[P013]` **`cb195db7`** (POET_DIM_BEDROOM) — **Probability: `99%`** | *Literal visual match: The POET standing in dim teal bedroom moving toward rain window overlooking black car.*
  - `[P014]` **`dc67dc88`** (POET_DIM_BEDROOM) — **Probability: `99%`** | *Literal visual match: The POET standing in dim teal bedroom moving toward rain window overlooking black car.*
  - `[P015]` **`05df5f1b`** (POET_DIM_BEDROOM) — **Probability: `99%`** | *Literal visual match: The POET standing in dim teal bedroom moving toward rain window overlooking black car.*
  - `[P016]` **`7a701277`** (POET_DIM_BEDROOM) — **Probability: `99%`** | *Literal visual match: The POET standing in dim teal bedroom moving toward rain window overlooking black car.*
  - `[P017]` **`8342f352`** (POET_DIM_BEDROOM) — **Probability: `99%`** | *Literal visual match: The POET standing in dim teal bedroom moving toward rain window overlooking black car.*
  - `[P018]` **`c42d545f`** (POET_DIM_BEDROOM) — **Probability: `99%`** | *Literal visual match: The POET standing in dim teal bedroom moving toward rain window overlooking black car.*
  - `[P019]` **`773afeb6`** (POET_DIM_BEDROOM) — **Probability: `99%`** | *Literal visual match: The POET standing in dim teal bedroom moving toward rain window overlooking black car.*
  - `[P021]` **`e4c9215f`** (POET_DIM_BEDROOM) — **Probability: `99%`** | *Literal visual match: The POET standing in dim teal bedroom moving toward rain window overlooking black car.*
  - `[P022]` **`db9c23a4`** (POET_DIM_BEDROOM) — **Probability: `99%`** | *Literal visual match: The POET standing in dim teal bedroom moving toward rain window overlooking black car.*
  - `[P023]` **`c3da8350`** (POET_DIM_BEDROOM) — **Probability: `99%`** | *Literal visual match: The POET standing in dim teal bedroom moving toward rain window overlooking black car.*
  - `[P024]` **`98f0499c`** (POET_DIM_BEDROOM) — **Probability: `99%`** | *Literal visual match: The POET standing in dim teal bedroom moving toward rain window overlooking black car.*
  - `[P025]` **`234d5fdb`** (POET_DIM_BEDROOM) — **Probability: `99%`** | *Literal visual match: The POET standing in dim teal bedroom moving toward rain window overlooking black car.*
  - `[P026]` **`67bef226`** (POET_DIM_BEDROOM) — **Probability: `99%`** | *Literal visual match: The POET standing in dim teal bedroom moving toward rain window overlooking black car.*
  - `[P027]` **`ebe2426d`** (POET_DIM_BEDROOM) — **Probability: `99%`** | *Literal visual match: The POET standing in dim teal bedroom moving toward rain window overlooking black car.*
  - `[P028]` **`67e5b1cb`** (POET_DIM_BEDROOM) — **Probability: `99%`** | *Literal visual match: The POET standing in dim teal bedroom moving toward rain window overlooking black car.*
  - `[P029]` **`349b41ba`** (POET_DIM_BEDROOM) — **Probability: `99%`** | *Literal visual match: The POET standing in dim teal bedroom moving toward rain window overlooking black car.*
  - `[P030]` **`445aad93`** (POET_DIM_BEDROOM) — **Probability: `99%`** | *Literal visual match: The POET standing in dim teal bedroom moving toward rain window overlooking black car.*
  - `[P031]` **`bbcdf587`** (POET_DIM_BEDROOM) — **Probability: `99%`** | *Literal visual match: The POET standing in dim teal bedroom moving toward rain window overlooking black car.*
  - `[P032]` **`4c1980ee`** (POET_DIM_BEDROOM) — **Probability: `99%`** | *Literal visual match: The POET standing in dim teal bedroom moving toward rain window overlooking black car.*
  - `[P033]` **`a1e1a8ae`** (POET_DIM_BEDROOM) — **Probability: `99%`** | *Literal visual match: The POET standing in dim teal bedroom moving toward rain window overlooking black car.*
  - `[P034]` **`a9a29752`** (POET_DIM_BEDROOM) — **Probability: `99%`** | *Literal visual match: The POET standing in dim teal bedroom moving toward rain window overlooking black car.*
  - `[P035]` **`b3ac7019`** (POET_DIM_BEDROOM) — **Probability: `99%`** | *Literal visual match: The POET standing in dim teal bedroom moving toward rain window overlooking black car.*
  - `[P037]` **`4cfa729a`** (POET_DIM_BEDROOM) — **Probability: `99%`** | *Literal visual match: The POET standing in dim teal bedroom moving toward rain window overlooking black car.*
  - `[P040]` **`8e5ebf2d`** (POET_DIM_BEDROOM) — **Probability: `99%`** | *Literal visual match: The POET standing in dim teal bedroom moving toward rain window overlooking black car.*
  - `[P042]` **`3af36c41`** (POET_DIM_BEDROOM) — **Probability: `99%`** | *Literal visual match: The POET standing in dim teal bedroom moving toward rain window overlooking black car.*
  - `[P047]` **`c81cb1b0`** (POET_DIM_BEDROOM) — **Probability: `99%`** | *Literal visual match: The POET standing in dim teal bedroom moving toward rain window overlooking black car.*
  - `[P051]` **`a11b84af`** (POET_DIM_BEDROOM) — **Probability: `99%`** | *Literal visual match: The POET standing in dim teal bedroom moving toward rain window overlooking black car.*
  - `[P052]` **`b072cfc2`** (POET_DIM_BEDROOM) — **Probability: `99%`** | *Literal visual match: The POET standing in dim teal bedroom moving toward rain window overlooking black car.*
  - `[P054]` **`173e50a6`** (POET_DIM_BEDROOM) — **Probability: `99%`** | *Literal visual match: The POET standing in dim teal bedroom moving toward rain window overlooking black car.*
  - `[P056]` **`46782136`** (POET_DIM_BEDROOM) — **Probability: `99%`** | *Literal visual match: The POET standing in dim teal bedroom moving toward rain window overlooking black car.*
  - `[P057]` **`6a9fa071`** (POET_DIM_BEDROOM) — **Probability: `99%`** | *Literal visual match: The POET standing in dim teal bedroom moving toward rain window overlooking black car.*
  - `[P058]` **`5880d3a4`** (POET_DIM_BEDROOM) — **Probability: `99%`** | *Literal visual match: The POET standing in dim teal bedroom moving toward rain window overlooking black car.*
  - `[P063]` **`02eba2a1`** (POET_DIM_BEDROOM) — **Probability: `99%`** | *Literal visual match: The POET standing in dim teal bedroom moving toward rain window overlooking black car.*
  - `[P065]` **`f3088dc0`** (POET_DIM_BEDROOM) — **Probability: `99%`** | *Literal visual match: The POET standing in dim teal bedroom moving toward rain window overlooking black car.*
  - `[P066]` **`84c137db`** (POET_DIM_BEDROOM) — **Probability: `99%`** | *Literal visual match: The POET standing in dim teal bedroom moving toward rain window overlooking black car.*
  - `[P068]` **`6017f123`** (POET_DIM_BEDROOM) — **Probability: `99%`** | *Literal visual match: The POET standing in dim teal bedroom moving toward rain window overlooking black car.*
  - `[P069]` **`5bbf08ef`** (POET_DIM_BEDROOM) — **Probability: `99%`** | *Literal visual match: The POET standing in dim teal bedroom moving toward rain window overlooking black car.*
  - `[P070]` **`ee2b1d79`** (POET_DIM_BEDROOM) — **Probability: `99%`** | *Literal visual match: The POET standing in dim teal bedroom moving toward rain window overlooking black car.*
  - `[P073]` **`0b99d0ac`** (POET_DIM_BEDROOM) — **Probability: `99%`** | *Literal visual match: The POET standing in dim teal bedroom moving toward rain window overlooking black car.*
  - `[P074]` **`9e848953`** (POET_DIM_BEDROOM) — **Probability: `99%`** | *Literal visual match: The POET standing in dim teal bedroom moving toward rain window overlooking black car.*
  - `[P075]` **`ef876320`** (POET_DIM_BEDROOM) — **Probability: `99%`** | *Literal visual match: The POET standing in dim teal bedroom moving toward rain window overlooking black car.*
  - `[P076]` **`8acad7c0`** (POET_DIM_BEDROOM) — **Probability: `99%`** | *Literal visual match: The POET standing in dim teal bedroom moving toward rain window overlooking black car.*
  - `[P083]` **`e05d9393`** (POET_DIM_BEDROOM) — **Probability: `99%`** | *Literal visual match: The POET standing in dim teal bedroom moving toward rain window overlooking black car.*
  - `[P084]` **`08ff0a63`** (POET_DIM_BEDROOM) — **Probability: `99%`** | *Literal visual match: The POET standing in dim teal bedroom moving toward rain window overlooking black car.*
  - `[P085]` **`b71779e4`** (POET_DIM_BEDROOM) — **Probability: `99%`** | *Literal visual match: The POET standing in dim teal bedroom moving toward rain window overlooking black car.*
  - `[P086]` **`c1d4e13c`** (POET_DIM_BEDROOM) — **Probability: `99%`** | *Literal visual match: The POET standing in dim teal bedroom moving toward rain window overlooking black car.*
  - `[P087]` **`5edab801`** (POET_DIM_BEDROOM) — **Probability: `99%`** | *Literal visual match: The POET standing in dim teal bedroom moving toward rain window overlooking black car.*
  - `[P092]` **`845aeac2`** (POET_DIM_BEDROOM) — **Probability: `99%`** | *Literal visual match: The POET standing in dim teal bedroom moving toward rain window overlooking black car.*
  - `[P093]` **`17b996fa`** (POET_DIM_BEDROOM) — **Probability: `99%`** | *Literal visual match: The POET standing in dim teal bedroom moving toward rain window overlooking black car.*
  - `[P094]` **`7dc53bea`** (POET_DIM_BEDROOM) — **Probability: `99%`** | *Literal visual match: The POET standing in dim teal bedroom moving toward rain window overlooking black car.*
  - `[P104]` **`7e0bd7d0`** (POET_DIM_BEDROOM) — **Probability: `99%`** | *Literal visual match: The POET standing in dim teal bedroom moving toward rain window overlooking black car.*
  - `[P120]` **`b7dc3595`** (POET_DIM_BEDROOM) — **Probability: `99%`** | *Literal visual match: The POET standing in dim teal bedroom moving toward rain window overlooking black car.*
  - `[P121]` **`9c7af8fd`** (POET_DIM_BEDROOM) — **Probability: `99%`** | *Literal visual match: The POET standing in dim teal bedroom moving toward rain window overlooking black car.*
  - `[P122]` **`8bc45974`** (POET_DIM_BEDROOM) — **Probability: `99%`** | *Literal visual match: The POET standing in dim teal bedroom moving toward rain window overlooking black car.*
  - `[P123]` **`c0323bcf`** (POET_DIM_BEDROOM) — **Probability: `99%`** | *Literal visual match: The POET standing in dim teal bedroom moving toward rain window overlooking black car.*
  - `[P124]` **`4351bc7a`** (POET_DIM_BEDROOM) — **Probability: `99%`** | *Literal visual match: The POET standing in dim teal bedroom moving toward rain window overlooking black car.*

#### 🟢 [01_S4] `COVERED` (3 shots)
- **Ground Truth Line**: *"More haze. What isn't mine, I still can not give."*
- **Target Visual**: `Vapor engulfing room, arm raised in fog, domestic stasis broken`
- **Assigned Shots**:
  - `[P020]` **`a8922cd9`** (BEDROOM_FOG_GESTURE) — **Probability: `99%`** | *Literal visual match: Blue fog billows across bedroom couch as POET raises arm in vocal defiance.*
  - `[P036]` **`5b9ec655`** (BEDROOM_FOG_GESTURE) — **Probability: `99%`** | *Literal visual match: Blue fog billows across bedroom couch as POET raises arm in vocal defiance.*
  - `[P055]` **`706766af`** (BEDROOM_FOG_GESTURE) — **Probability: `99%`** | *Literal visual match: Blue fog billows across bedroom couch as POET raises arm in vocal defiance.*

### Suite 02 — FLASHING LIGHTS

#### 🔴 [02_S1] `GAP` (0 shots)
- **Ground Truth Line**: *"It was the type of silent scream a trapped lover makes to escape: a pending marriage, a concussion, a set of walls caving inward."*
- **Target Visual**: `Caving walls, shadow distortion, silent scream, emotional concussion`
- ⚠️ **NO DIRECT SHOT MATCH IN ARCHIVE — VISUAL GAP**

#### 🔴 [02_S2] `GAP` (0 shots)
- **Ground Truth Line**: *"An emergency call while tossing and turning — the silent call a man makes to the mirror after midnight, to digest a truth."*
- **Target Visual**: `Midnight bathroom mirror reflection, man in shadows, intense stare`
- ⚠️ **NO DIRECT SHOT MATCH IN ARCHIVE — VISUAL GAP**

#### 🟡 [02_S3] `THIN` (1 shots)
- **Ground Truth Line**: *"A truth he could neither alter nor change. What isn't mine, I still can not give."*
- **Target Visual**: `Sprinting down orange subway stairs, desperate transit breach, fleeing stasis`
- **Assigned Shots**:
  - `[P119]` **`6750a5d1`** (SUBWAY_SPRINT_STAIRS) — **Probability: `99%`** | *Direct thematic match: Trapped man sprinting down orange subway stairs to escape matrimonial stasis.*

### Suite 03 — HOW TO BREAK OFF AN ENGAGEMENT

#### 🔴 [03_S1] `GAP` (0 shots)
- **Ground Truth Line**: *"Ode to forever — a tambourine sounds off an empty temple, empty choir stands, empty prayer lines."*
- **Target Visual**: `Empty cathedral choir stands, deserted church pews, acoustic echo`
- ⚠️ **NO DIRECT SHOT MATCH IN ARCHIVE — VISUAL GAP**

#### 🔴 [03_S2] `GAP` (0 shots)
- **Ground Truth Line**: *"And abandoned baptism pools. It flies in through the rose window — still whole."*
- **Target Visual**: `Dry baptismal basin, sunlight through circular rose window, solitary flight`
- ⚠️ **NO DIRECT SHOT MATCH IN ARCHIVE — VISUAL GAP**

#### 🟢 [03_S3] `COVERED` (4 shots)
- **Ground Truth Line**: *"A broken promise. Glistening red fluid submersion and shorelines of release."*
- **Target Visual**: `Man with glowing heart ribbon on dusk beach, submerged head in bubbling crimson tide`
- **Assigned Shots**:
  - `[P064]` **`0b025dc2`** (RED_FLUID_SUBMERSION) — **Probability: `87%`** | *Direct match: POET with wet skin submerged in glistening red liquid pool for sensory emotional surrender.*
  - `[P088]` **`d847a1b8`** (BEACH_HEART_RIBBON) — **Probability: `99%`** | *Literal visual match: Man on twilight beach releasing radiant glowing red heart ribbons into the sea breeze.*
  - `[P132]` **`447a4780`** (BEACH_HEART_RIBBON) — **Probability: `99%`** | *Literal visual match: Man on twilight beach releasing radiant glowing red heart ribbons into the sea breeze.*
  - `[P135]` **`882db957`** (BEACH_HEART_RIBBON) — **Probability: `99%`** | *Literal visual match: Man on twilight beach releasing radiant glowing red heart ribbons into the sea breeze.*

### Suite 04 — NEVERMORE

#### 🔴 [04_S1] `GAP` (0 shots)
- **Ground Truth Line**: *"What if I followed this trail, to where the broken pieces have washed ashore — and the ashes of expired wildfires cover sands."*
- **Target Visual**: `Dark beach covered in black wildfire ash, washed-up ocean debris`
- ⚠️ **NO DIRECT SHOT MATCH IN ARCHIVE — VISUAL GAP**

#### 🟡 [04_S2] `THIN` (1 shots)
- **Ground Truth Line**: *"The waves calm to folded whispers; the winds mute the trees. The right level of silence, to find a throbbing heart."*
- **Target Visual**: `Folded ocean whispers, muted trees, POET standing outside gothic cathedral with circling ravens`
- **Assigned Shots**:
  - `[P111]` **`63d387a4`** (POET_CATHEDRAL_CROWS) — **Probability: `97%`** | *Literal visual match: POET standing outside gothic cathedral in cracked churchyard as dark ravens circle.*

#### 🟢 [04_S3] `COVERED` (4 shots)
- **Ground Truth Line**: *"It used to be mine. I lift it with care: nevermore."*
- **Target Visual**: `White authorial typography 'Poems by Mark Anthony Thomas' over dark rain-slicked asphalt`
- **Assigned Shots**:
  - `[P048]` **`84592d51`** (POEMS_TITLE_CARD) — **Probability: `92%`** | *Literal match: Minimalist 'Poems by Mark Anthony Thomas' authorial typography over rain-slicked asphalt.*
  - `[P049]` **`9d16432c`** (POEMS_TITLE_CARD) — **Probability: `92%`** | *Literal match: Minimalist 'Poems by Mark Anthony Thomas' authorial typography over rain-slicked asphalt.*
  - `[P050]` **`e3e52e35`** (POEMS_TITLE_CARD) — **Probability: `92%`** | *Literal match: Minimalist 'Poems by Mark Anthony Thomas' authorial typography over rain-slicked asphalt.*
  - `[P053]` **`8478f997`** (POEMS_TITLE_CARD) — **Probability: `92%`** | *Literal match: Minimalist 'Poems by Mark Anthony Thomas' authorial typography over rain-slicked asphalt.*

### Suite 05 — BLOODLINES

#### 🔴 [05_S1] `GAP` (0 shots)
- **Ground Truth Line**: *"Now go, they tell me. To ask if I can inherit the earth — to ask if I can name my own stars. Even galaxies, if I may."*
- **Target Visual**: `Deep galactic cosmos, interstellar equator, celestial scale`
- ⚠️ **NO DIRECT SHOT MATCH IN ARCHIVE — VISUAL GAP**

#### 🟢 [05_S2] `COVERED` (4 shots)
- **Ground Truth Line**: *"Coming of age in the shared rooms of humid basements as bedrooms; mattress pads where Southern pine could comfort my spine."*
- **Target Visual**: `Translucent profile with glowing cervical spine, vertebrae glowing amber and red`
- **Assigned Shots**:
  - `[P079]` **`34051c38`** (SKELETAL_PROFILE) — **Probability: `99%`** | *Literal visual match: Profile view showing glowing cervical spine and ribcage pulsating with amber heat.*
  - `[P080]` **`516f88fd`** (SKELETAL_PROFILE) — **Probability: `99%`** | *Literal visual match: Profile view showing glowing cervical spine and ribcage pulsating with amber heat.*
  - `[P081]` **`80b32fdf`** (SKELETAL_PROFILE) — **Probability: `99%`** | *Literal visual match: Profile view showing glowing cervical spine and ribcage pulsating with amber heat.*
  - `[P082]` **`f91d5823`** (SKELETAL_PROFILE) — **Probability: `99%`** | *Literal visual match: Profile view showing glowing cervical spine and ribcage pulsating with amber heat.*

#### 🟢 [05_S3] `COVERED` (2 shots)
- **Ground Truth Line**: *"It didn't. To dream was to prevail."*
- **Target Visual**: `Frontal open stance with beating red heart and glowing white ribcage, brothers embracing with butterflies`
- **Assigned Shots**:
  - `[P077]` **`764b035a`** (BEATING_HEART_SKELETON) — **Probability: `85%`** | *Literal visual match: Athletic POET with arms open exposing glowing white skeletal ribcage and beating red heart.*
  - `[P078]` **`b8d2065c`** (BEATING_HEART_SKELETON) — **Probability: `85%`** | *Literal visual match: Athletic POET with arms open exposing glowing white skeletal ribcage and beating red heart.*

### Suite 06 — RESURRECTING ATLANTIS

#### 🔴 [06_S1] `GAP` (0 shots)
- **Ground Truth Line**: *"Poets, who eased generations down yellow brick roads — and plucked our souls out of their secret places."*
- **Target Visual**: `Cosmic golden roads, celestial comets guiding souls`
- ⚠️ **NO DIRECT SHOT MATCH IN ARCHIVE — VISUAL GAP**

#### 🟢 [06_S2] `COVERED` (9 shots)
- **Ground Truth Line**: *"To follow comets to the capital city of our collective consciousness. Resurrecting Atlantis."*
- **Target Visual**: `Stepped pyramid of CRT television screens broadcasting ocean water in volumetric haze, island metropolis mirror`
- **Assigned Shots**:
  - `[P125]` **`84c43938`** (CRT_TV_PYRAMID_ATLANTIS) — **Probability: `99%`** | *Literal visual match: Stepped pyramid of vintage CRT monitors broadcasting ocean water archive in volumetric light beams.*
  - `[P126]` **`b38a6302`** (CRT_TV_PYRAMID_ATLANTIS) — **Probability: `99%`** | *Literal visual match: Stepped pyramid of vintage CRT monitors broadcasting ocean water archive in volumetric light beams.*
  - `[P127]` **`464b4dcc`** (CRT_TV_PYRAMID_ATLANTIS) — **Probability: `99%`** | *Literal visual match: Stepped pyramid of vintage CRT monitors broadcasting ocean water archive in volumetric light beams.*
  - `[P128]` **`d06fff56`** (CRT_TV_PYRAMID_ATLANTIS) — **Probability: `99%`** | *Literal visual match: Stepped pyramid of vintage CRT monitors broadcasting ocean water archive in volumetric light beams.*
  - `[P129]` **`60ea25fc`** (CRT_TV_PYRAMID_ATLANTIS) — **Probability: `99%`** | *Literal visual match: Stepped pyramid of vintage CRT monitors broadcasting ocean water archive in volumetric light beams.*
  - `[P130]` **`c2a64680`** (CRT_TV_PYRAMID_ATLANTIS) — **Probability: `99%`** | *Literal visual match: Stepped pyramid of vintage CRT monitors broadcasting ocean water archive in volumetric light beams.*
  - `[P131]` **`35855d8a`** (MIRRORED_ISLAND_METROPOLIS) — **Probability: `92%`** | *Literal visual match: Monochrome island city towers reflected in glassy lake under stormy volumetric light rays.*
  - `[P133]` **`10440c21`** (MIRRORED_ISLAND_METROPOLIS) — **Probability: `92%`** | *Literal visual match: Monochrome island city towers reflected in glassy lake under stormy volumetric light rays.*
  - `[P134]` **`92cc2431`** (MIRRORED_ISLAND_METROPOLIS) — **Probability: `92%`** | *Literal visual match: Monochrome island city towers reflected in glassy lake under stormy volumetric light rays.*

#### 🟢 [06_S3] `COVERED` (3 shots)
- **Ground Truth Line**: *"Here we are all one — the pact we've made here with nature, abandoned and hoped for the best, back on life."*
- **Target Visual**: `Circle of matriarchs in white garments with floating water bubbles and rose bouquets`
- **Assigned Shots**:
  - `[P097]` **`2b779f89`** (ANCESTRAL_COMMUNION_ROSES) — **Probability: `99%`** | *Literal visual match: Congregation of Black matriarchs in white garments with floating water orbs and roses.*
  - `[P098]` **`9708bfad`** (ANCESTRAL_COMMUNION_ROSES) — **Probability: `99%`** | *Literal visual match: Congregation of Black matriarchs in white garments with floating water orbs and roses.*
  - `[P099]` **`068f796b`** (ANCESTRAL_COMMUNION_ROSES) — **Probability: `99%`** | *Literal visual match: Congregation of Black matriarchs in white garments with floating water orbs and roses.*

### Suite 07 — DJ TURN ME UP

#### 🔴 [07_S1] `GAP` (0 shots)
- **Ground Truth Line**: *"DJ, turn me up, please. Eyes wide shut, chin nested at the arch of the weight of these spoken words."*
- **Target Visual**: `Spoken word microphone, acoustic soundstage booth, eyes shut in intense focus`
- ⚠️ **NO DIRECT SHOT MATCH IN ARCHIVE — VISUAL GAP**

#### 🟢 [07_S2] `COVERED` (2 shots)
- **Ground Truth Line**: *"I have a love story to tell — of ghosts, whispering unfolded dilutions, birthed in purity, and dying in the vineyards of sun-soaked evergreen fields, unnourished."*
- **Target Visual**: `Young Black boy in red hoodie gazing thoughtfully through rain-drenched diner window`
- **Assigned Shots**:
  - `[P062]` **`e9c18d8d`** (BOY_AT_RAIN_WINDOW) — **Probability: `99%`** | *Literal visual match: Young boy in red hoodie gazing out rain-streaked roadside diner window at overcast highway.*
  - `[P067]` **`0183fedb`** (BOY_AT_RAIN_WINDOW) — **Probability: `99%`** | *Literal visual match: Young boy in red hoodie gazing out rain-streaked roadside diner window at overcast highway.*

### Suite 08 — NEWLY SINGLE

#### 🔴 [08_S1] `GAP` (0 shots)
- **Ground Truth Line**: *"Pulsing, and head throbbing from the music — and empty, on a crowded floor of sweated perfumes and temptations."*
- **Target Visual**: `Crowded nightclub dance floor, neon strobe reflections, head throbbing bass`
- ⚠️ **NO DIRECT SHOT MATCH IN ARCHIVE — VISUAL GAP**

#### 🟢 [08_S2] `COVERED` (5 shots)
- **Ground Truth Line**: *"The soul escapes my body, and leaves him on the dance floor — just flesh and bones. Rejection and heartache hit different, with no feelings afloat."*
- **Target Visual**: `Face pressed against speeding passenger train window, chromatic city lights streaking past`
- **Assigned Shots**:
  - `[P112]` **`8daa2ef0`** (TRAIN_WINDOW_REFRACTION) — **Probability: `80%`** | *Literal visual match: POET pressed against speeding train window with chromatic city streaks rushing past.*
  - `[P113]` **`13fee118`** (TRAIN_WINDOW_REFRACTION) — **Probability: `80%`** | *Literal visual match: POET pressed against speeding train window with chromatic city streaks rushing past.*
  - `[P114]` **`4d3fc262`** (TRAIN_WINDOW_REFRACTION) — **Probability: `80%`** | *Literal visual match: POET pressed against speeding train window with chromatic city streaks rushing past.*
  - `[P116]` **`7b30f724`** (TRAIN_WINDOW_REFRACTION) — **Probability: `80%`** | *Literal visual match: POET pressed against speeding train window with chromatic city streaks rushing past.*
  - `[P118]` **`c52c52ca`** (TRAIN_WINDOW_REFRACTION) — **Probability: `80%`** | *Literal visual match: POET pressed against speeding train window with chromatic city streaks rushing past.*

### Suite 09 — YET, HEARD

#### 🔴 [09_S1] `GAP` (0 shots)
- **Ground Truth Line**: *"Before I go, we look at the moon the way we used to see it. We talk for years, travel through time — we grow old together, I believe."*
- **Target Visual**: `Moonlit time-travel harbor, looking at the moon together`
- ⚠️ **NO DIRECT SHOT MATCH IN ARCHIVE — VISUAL GAP**

#### 🟢 [09_S2] `COVERED` (6 shots)
- **Ground Truth Line**: *"Before I go, I call on my mother — in tears, speaking of an abyss she's never known."*
- **Target Visual**: `Industrial rooftop ledge watching massive white steam plumes rising from the alley`
- **Assigned Shots**:
  - `[P038]` **`8aff03e4`** (ROOFTOP_STEAM_ALLEY) — **Probability: `99%`** | *Literal visual match: POET seated on brick roof ledge watching massive plumes of white exhaust steam rise.*
  - `[P041]` **`d1dfc1d0`** (ROOFTOP_STEAM_ALLEY) — **Probability: `99%`** | *Literal visual match: POET seated on brick roof ledge watching massive plumes of white exhaust steam rise.*
  - `[P043]` **`eb298ed7`** (ROOFTOP_STEAM_ALLEY) — **Probability: `99%`** | *Literal visual match: POET seated on brick roof ledge watching massive plumes of white exhaust steam rise.*
  - `[P044]` **`af9410b7`** (ROOFTOP_STEAM_ALLEY) — **Probability: `87%`** | *Literal visual match: POET seated on brick roof ledge watching massive plumes of white exhaust steam rise.*
  - `[P045]` **`cc6917c6`** (ROOFTOP_STEAM_ALLEY) — **Probability: `87%`** | *Literal visual match: POET seated on brick roof ledge watching massive plumes of white exhaust steam rise.*
  - `[P046]` **`6e80b1bd`** (ROOFTOP_STEAM_ALLEY) — **Probability: `87%`** | *Literal visual match: POET seated on brick roof ledge watching massive plumes of white exhaust steam rise.*

#### 🟡 [09_S3] `THIN` (1 shots)
- **Ground Truth Line**: *"Before I go, I call on my father... We stroll, father and son, hearted and shaken. Someone borrowed, and someone blue — yet, broken. Yet, heard."*
- **Target Visual**: `Leaping off the rooftop ledge into the steam, inverting into aerodynamic skydiving glide through sunlit clouds`
- **Assigned Shots**:
  - `[P039]` **`d5abc940`** (ROOFTOP_STEAM_LEAP) — **Probability: `99%`** | *Literal visual match: POET leaping off industrial roof ledge into steam, inverting into skydiving glide toward camera.*

### Suite 10 — MAGIC RIDE

#### 🔴 [10_S1] `GAP` (0 shots)
- **Ground Truth Line**: *"I wasn't looking for a ride, but here you are — blissful, and oddly sensitive. I rub my aggressions into your steel coverings, and hop on."*
- **Target Visual**: `Steel motorcycle frame, mounting the machine, sleek reflective bodywork`
- ⚠️ **NO DIRECT SHOT MATCH IN ARCHIVE — VISUAL GAP**

#### 🟢 [10_S2] `COVERED` (4 shots)
- **Ground Truth Line**: *"Loneliness is having everything with no one to tell — being everywhere, with no one to love. I let the noise block the noise."*
- **Target Visual**: `Speeding along twilight coastal boulevard, palm trees streaking in golden motion blur`
- **Assigned Shots**:
  - `[P106]` **`653ecfbe`** (COASTAL_MAGIC_RIDE) — **Probability: `99%`** | *Literal visual match: Coastal palm highway with horizontal golden light streaks smearing in relativistic speed.*
  - `[P107]` **`fc64e987`** (COASTAL_MAGIC_RIDE) — **Probability: `99%`** | *Literal visual match: Coastal palm highway with horizontal golden light streaks smearing in relativistic speed.*
  - `[P109]` **`474a21a0`** (COASTAL_MAGIC_RIDE) — **Probability: `99%`** | *Literal visual match: Coastal palm highway with horizontal golden light streaks smearing in relativistic speed.*
  - `[P110]` **`eaea9d0a`** (COASTAL_MAGIC_RIDE) — **Probability: `99%`** | *Literal visual match: Coastal palm highway with horizontal golden light streaks smearing in relativistic speed.*

#### 🔴 [10_S3] `GAP` (0 shots)
- **Ground Truth Line**: *"The way I ride: eyes turn, heads twist — and prove the magic still exists. The moon settles, and I can see a morning ahead for me."*
- **Target Visual**: `Dawn breaking over the highway, horizontal light trails dissolving into morning sunlight`
- ⚠️ **NO DIRECT SHOT MATCH IN ARCHIVE — VISUAL GAP**

### Suite 11 — NEW DAY

#### 🔴 [11_S1] `GAP` (0 shots)
- **Ground Truth Line**: *"Fog covers the seas and hugs the tree-covered hills, floating through the morning as it exhales its introduction. This world is at peace."*
- **Target Visual**: `Morning sea fog rolling across forested hills, peaceful dawn atmosphere`
- ⚠️ **NO DIRECT SHOT MATCH IN ARCHIVE — VISUAL GAP**

#### 🟢 [11_S2] `COVERED` (2 shots)
- **Ground Truth Line**: *"In the awakening of dawn, in fresh muted colors: we can rebuild this temple. It's a new day — a catharsis for me to say."*
- **Target Visual**: `Ancient stone apothecary library flooded waist-deep in blooming yellow chrysanthemums, POET wading`
- **Assigned Shots**:
  - `[P105]` **`badaf97b`** (APOTHECARY_YELLOW_FLOWERS) — **Probability: `99%`** | *Literal visual match: POET wading waist-deep through thousands of yellow chrysanthemums inside stone apothecary.*
  - `[P108]` **`8a9e7a1e`** (RUINED_COLONNADE_PILGRIM) — **Probability: `99%`** | *Literal visual match: Cloaked pilgrim walking through tall golden grass in ruined sunlit cathedral cloister.*

#### 🟡 [11_S3] `THIN` (1 shots)
- **Ground Truth Line**: *"With laps around infinity pools of edgeless dreams... that we too can walk on water."*
- **Target Visual**: `Saffron-robed monks on ancient stone temple steps in prismatic sunlight, cloaked pilgrim in ruined colonnade`
- **Assigned Shots**:
  - `[P096]` **`48a7a55a`** (SAFFRON_SANCTUARY_MONKS) — **Probability: `99%`** | *Literal visual match: Saffron-robed Buddhist monks on ancient stone temple steps in prismatic sunlight.*

### Suite 12 — REUNION

#### 🟢 [12_S1] `COVERED` (3 shots)
- **Ground Truth Line**: *"Decades later, there is less time for words, and more space for laughter — hugs with no reason, and loud voices, so our hearts can be overheard."*
- **Target Visual**: `Two kin women sharing radiant joy and laughter over a phone in golden chandelier bokeh`
- **Assigned Shots**:
  - `[P100]` **`37235c7f`** (TWO_KIN_WOMEN) — **Probability: `99%`** | *Literal visual match: Two kin women laughing over phone in golden chandelier bokeh light.*
  - `[P101]` **`02185971`** (TWO_KIN_WOMEN) — **Probability: `99%`** | *Literal visual match: Two kin women laughing over phone in golden chandelier bokeh light.*
  - `[P102]` **`6ac81cae`** (TWO_KIN_WOMEN) — **Probability: `99%`** | *Literal visual match: Two kin women laughing over phone in golden chandelier bokeh light.*

#### 🔴 [12_S2] `GAP` (0 shots)
- **Ground Truth Line**: *"Reflecting on legacies, and creeds once told — of elders, now past. Or will we make time, in the sands of burning hourglasses?"*
- **Target Visual**: `Burning hourglass sands, ancestral memories, sacred lineage gathering`
- ⚠️ **NO DIRECT SHOT MATCH IN ARCHIVE — VISUAL GAP**

#### 🟢 [12_S3] `COVERED` (3 shots)
- **Ground Truth Line**: *"Before our winds part ways — to a next lifetime. This is brotherhood."*
- **Target Visual**: `Two embracing youths with bioluminescent butterflies fluttering around their temples`
- **Assigned Shots**:
  - `[P090]` **`1cdf9a75`** (EMBRACING_YOUTHS_BUTTERFLIES) — **Probability: `99%`** | *Literal visual match: Two young Black brothers resting foreheads together surrounded by bioluminescent butterflies.*
  - `[P091]` **`5c7f1747`** (EMBRACING_YOUTHS_BUTTERFLIES) — **Probability: `99%`** | *Literal visual match: Two young Black brothers resting foreheads together surrounded by bioluminescent butterflies.*
  - `[P095]` **`0107df88`** (EMBRACING_YOUTHS_BUTTERFLIES) — **Probability: `99%`** | *Literal visual match: Two young Black brothers resting foreheads together surrounded by bioluminescent butterflies.*

### Suite 13 — HOW TO WIN MY HEART

#### 🔴 [13_S1] `GAP` (0 shots)
- **Ground Truth Line**: *"Find me at the harbor, at the small tables, watching. The couples orbit each other the way Jupiter keeps its moons — close, and counted."*
- **Target Visual**: `Small cafe tables at harbor edge, watching couples strolling in orbit`
- ⚠️ **NO DIRECT SHOT MATCH IN ARCHIVE — VISUAL GAP**

#### 🔴 [13_S2] `GAP` (0 shots)
- **Ground Truth Line**: *"Life has burned all my love stories — victory-less seasons. So I harvest the flowers instead — scarlet poppies, purple blossoms — and they become my power."*
- **Target Visual**: `Harvesting vibrant scarlet poppies, personal floral empowerment`
- ⚠️ **NO DIRECT SHOT MATCH IN ARCHIVE — VISUAL GAP**

#### 🟢 [13_S3] `COVERED` (3 shots)
- **Ground Truth Line**: *"Then, a distant window. She says: you'll see me. Capture the eyes. Refocus. Step back. Say hello. Don't make me leave. I escaped here for a reason."*
- **Target Visual**: `Stepped multi-exposure motion trail in tracksuit with clear plastic sleeves, capturing eyes in window`
- **Assigned Shots**:
  - `[P071]` **`222c8cca`** (TEMPORAL_ECHO_TRAIL) — **Probability: `97%`** | *Literal visual match: Man in tracksuit with clear plastic sleeves walking with stepped multi-exposure echo trail.*
  - `[P072]` **`53666716`** (TEMPORAL_ECHO_TRAIL) — **Probability: `97%`** | *Literal visual match: Man in tracksuit with clear plastic sleeves walking with stepped multi-exposure echo trail.*
  - `[P089]` **`2255ec6b`** (TEMPORAL_ECHO_TRAIL) — **Probability: `97%`** | *Literal visual match: Man in tracksuit with clear plastic sleeves walking with stepped multi-exposure echo trail.*

### Suite 14 — HOT MINUTE

#### 🟢 [14_S1] `COVERED` (2 shots)
- **Ground Truth Line**: *"A hot minute. The haze gathers on the water — and everything I built here learns to be weather: the city, the temple, the harbor."*
- **Target Visual**: `Haze gathering over water, high-rise balcony overlooking city engulfed in billowing red flare smoke`
- **Assigned Shots**:
  - `[P103]` **`ce4762b5`** (ROOFTOP_CRIMSON_FLARES) — **Probability: `99%`** | *Literal visual match: High-rise balcony overlooking European city engulfed in billowing red stadium flare smoke.*
  - `[P117]` **`afa81d04`** (TRAIN_WINDOW_REFRACTION) — **Probability: `84%`** | *General thematic association.*

#### 🟢 [14_S2] `COVERED` (3 shots)
- **Ground Truth Line**: *"All black again. But no walls this time. A life flashes the way a reel does: the window, the tambourine, the field, the stars, the ride, the temple."*
- **Target Visual**: `Crimson plasma shroud swirling around shadowed stylist on urban night corner`
- **Assigned Shots**:
  - `[P059]` **`63fd3f15`** (SHADOWED_STYLIST_PLASMA) — **Probability: `96%`** | *Visual match: Stylist surrounded by crimson plasma mist reflecting internal emergency distress.*
  - `[P060]` **`60c4c35f`** (SHADOWED_STYLIST_PLASMA) — **Probability: `96%`** | *Visual match: Stylist surrounded by crimson plasma mist reflecting internal emergency distress.*
  - `[P061]` **`4ed309f2`** (SHADOWED_STYLIST_PLASMA) — **Probability: `96%`** | *Visual match: Stylist surrounded by crimson plasma mist reflecting internal emergency distress.*

#### 🔴 [14_S3] `GAP` (0 shots)
- **Ground Truth Line**: *"Our dance together is a victory. An old door, from a vintage somewhere. It opens on a slow party — this time, I choose the door."*
- **Target Visual**: `Opening an old vintage wooden door, calmly stepping into the warm gathering`
- ⚠️ **NO DIRECT SHOT MATCH IN ARCHIVE — VISUAL GAP**

---

## 🔄 Shot Routing & Alternative Destinations

| Shot ID | Archetype | Primary Suite | Prob | Secondary / Alternative Routes | Redundancy |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `2474f1b5` | POET_DIM_BEDROOM | **01 OUT OF LIFE** | **99%** | 14 (60%) | Cluster of 68 |
| `7534249f` | POET_DIM_BEDROOM | **01 OUT OF LIFE** | **99%** | 14 (60%) | Cluster of 68 |
| `0a69c776` | POET_DIM_BEDROOM | **01 OUT OF LIFE** | **99%** | 14 (60%) | Cluster of 68 |
| `1ea914c8` | POET_DIM_BEDROOM | **01 OUT OF LIFE** | **99%** | 14 (60%) | Cluster of 68 |
| `9f391a75` | POET_DIM_BEDROOM | **01 OUT OF LIFE** | **99%** | 14 (72%), 06 (36%) | Cluster of 68 |
| `bcc4949f` | POET_DIM_BEDROOM | **01 OUT OF LIFE** | **99%** | 14 (60%) | Cluster of 68 |
| `90db999f` | POET_DIM_BEDROOM | **01 OUT OF LIFE** | **99%** | 14 (60%) | Cluster of 68 |
| `a5a18f9d` | POET_DIM_BEDROOM | **01 OUT OF LIFE** | **99%** | 14 (60%), 08 (36%), 09 (36%) | Cluster of 68 |
| `5321a933` | POET_DIM_BEDROOM | **01 OUT OF LIFE** | **99%** | 14 (84%), 12 (36%) | Cluster of 68 |
| `e01016b7` | POET_DIM_BEDROOM | **01 OUT OF LIFE** | **99%** | 09 (72%), 14 (72%), 12 (36%) | Cluster of 68 |
| `72b8186d` | POET_DIM_BEDROOM | **01 OUT OF LIFE** | **99%** | 14 (60%), 08 (36%), 09 (36%) | Cluster of 68 |
| `64024978` | POET_DIM_BEDROOM | **01 OUT OF LIFE** | **99%** | 14 (60%), 08 (36%) | Cluster of 68 |
| `cb195db7` | POET_DIM_BEDROOM | **01 OUT OF LIFE** | **99%** | 14 (60%) | Cluster of 68 |
| `dc67dc88` | POET_DIM_BEDROOM | **01 OUT OF LIFE** | **99%** | 14 (60%) | Cluster of 68 |
| `05df5f1b` | POET_DIM_BEDROOM | **01 OUT OF LIFE** | **99%** | 09 (72%), 14 (72%), 12 (36%) | Cluster of 68 |
| `7a701277` | POET_DIM_BEDROOM | **01 OUT OF LIFE** | **99%** | 09 (72%), 14 (72%), 12 (36%) | Cluster of 68 |
| `8342f352` | POET_DIM_BEDROOM | **01 OUT OF LIFE** | **99%** | 09 (72%), 14 (72%), 12 (36%) | Cluster of 68 |
| `c42d545f` | POET_DIM_BEDROOM | **01 OUT OF LIFE** | **99%** | 09 (72%), 14 (72%), 12 (36%) | Cluster of 68 |
| `773afeb6` | POET_DIM_BEDROOM | **01 OUT OF LIFE** | **99%** | 14 (84%), 12 (36%) | Cluster of 68 |
| `a8922cd9` | BEDROOM_FOG_GESTURE | **01 OUT OF LIFE** | **99%** | 04 (36%) | Cluster of 3 |
| `e4c9215f` | POET_DIM_BEDROOM | **01 OUT OF LIFE** | **99%** | 14 (84%), 12 (36%) | Cluster of 68 |
| `db9c23a4` | POET_DIM_BEDROOM | **01 OUT OF LIFE** | **99%** | 14 (96%), 09 (60%), 04 (36%) | Cluster of 68 |
| `c3da8350` | POET_DIM_BEDROOM | **01 OUT OF LIFE** | **99%** | 14 (96%), 06 (60%), 09 (48%) | Cluster of 68 |
| `98f0499c` | POET_DIM_BEDROOM | **01 OUT OF LIFE** | **99%** | 14 (60%), 08 (36%), 09 (36%) | Cluster of 68 |
| `234d5fdb` | POET_DIM_BEDROOM | **01 OUT OF LIFE** | **99%** | 14 (60%), 08 (36%), 09 (36%) | Cluster of 68 |
| `67bef226` | POET_DIM_BEDROOM | **01 OUT OF LIFE** | **99%** | 14 (72%), 09 (36%), 10 (36%) | Cluster of 68 |
| `ebe2426d` | POET_DIM_BEDROOM | **01 OUT OF LIFE** | **99%** | 14 (60%) | Cluster of 68 |
| `67e5b1cb` | POET_DIM_BEDROOM | **01 OUT OF LIFE** | **99%** | 14 (72%), 09 (48%), 10 (36%) | Cluster of 68 |
| `349b41ba` | POET_DIM_BEDROOM | **01 OUT OF LIFE** | **99%** | 14 (60%) | Cluster of 68 |
| `445aad93` | POET_DIM_BEDROOM | **01 OUT OF LIFE** | **99%** | 14 (60%) | Cluster of 68 |