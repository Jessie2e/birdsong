import cardinalAudio from "../assets/audio/Northern_Cardinal.ogg";
import robinAudio from "../assets/audio/American_Robin.ogg";
import bluejayAudio from "../assets/audio/Blue_Jay.ogg";
import mourningDoveAudio from "../assets/audio/mourningdove.ogg";
import carolinaWrenAudio from "../assets/audio/Carolina_Wren.ogg";
import chickadeeAudio from "../assets/audio/blackcappedchikadee.ogg";

/*
  The five new birds use the original Wikimedia-hosted audio for now.
  We can download/trim these into local files later without changing
  the rest of the game architecture.
*/

const tuftedTitmouseAudio =
  "https://upload.wikimedia.org/wikipedia/commons/8/81/Tufted_Titmouse_call.ogg";

const easternBluebirdAudio =
  "https://upload.wikimedia.org/wikipedia/commons/0/0b/Sialia_sialis_-_Eastern_Bluebird_-_XC79976.ogg";

const nuthatchAudio =
  "https://upload.wikimedia.org/wikipedia/commons/7/75/White-breasted_Nuthatch.ogg";

const houseFinchAudio =
  "https://upload.wikimedia.org/wikipedia/commons/2/23/Carpodacus_mexicanus_vocalizations_-_pone.0027052.s006.oga";

const americanCrowAudio =
  "https://upload.wikimedia.org/wikipedia/commons/f/f3/American_Crow.ogg";

export const birds = [
  {
    id: "cardinal",
    commonName: "Northern Cardinal",
    scientificName: "Cardinalis cardinalis",
    audio: cardinalAudio,
    mnemonic: "Cheer-cheer-cheer!",
    fact: "Male cardinals get their vivid red color from pigments in the foods they eat.",
    habitat: "Woodland edges, gardens & backyards",
    difficulty: 1,
    colors: {
      body: "#b64f3f",
      head: "#9b3d34",
      wing: "#7c3430",
      beak: "#d9914c",
    },
    toneSequence: [760, 880, 980, 880],
  },

  {
    id: "robin",
    commonName: "American Robin",
    scientificName: "Turdus migratorius",
    audio: robinAudio,
    mnemonic: "Cheer-up, cheerily!",
    fact: "Robins can locate earthworms by sight and by sensing movement in the soil.",
    habitat: "Lawns, parks & open woodland",
    difficulty: 1,
    colors: {
      body: "#66756e",
      head: "#48534f",
      wing: "#53625d",
      beak: "#df8d3b",
    },
    toneSequence: [620, 720, 670, 790],
  },

  {
    id: "bluejay",
    commonName: "Blue Jay",
    scientificName: "Cyanocitta cristata",
    audio: bluejayAudio,
    mnemonic: "Jay! Jay! Jay!",
    fact: "Blue Jays can imitate the calls of hawks.",
    habitat: "Forests, parks & suburban yards",
    difficulty: 1,
    colors: {
      body: "#668b9d",
      head: "#547c90",
      wing: "#416d83",
      beak: "#333b3e",
    },
    toneSequence: [430, 460, 420, 470],
  },

  {
    id: "mourning-dove",
    commonName: "Mourning Dove",
    scientificName: "Zenaida macroura",
    audio: mourningDoveAudio,
    mnemonic: "Coo-OOO-oo-oo",
    fact: "The whistling sound when a Mourning Dove takes off comes from its wings, not its voice.",
    habitat: "Fields, roadsides & backyards",
    difficulty: 1,
    colors: {
      body: "#9a8977",
      head: "#a99a8c",
      wing: "#796d63",
      beak: "#4e4a46",
    },
    toneSequence: [390, 520, 470, 420, 390],
  },

  {
    id: "carolina-wren",
    commonName: "Carolina Wren",
    scientificName: "Thryothorus ludovicianus",
    audio: carolinaWrenAudio,
    mnemonic: "Tea-kettle! Tea-kettle!",
    fact: "For such a tiny bird, the Carolina Wren has an incredibly powerful voice.",
    habitat: "Brush, woodland & gardens",
    difficulty: 2,
    colors: {
      body: "#9a6845",
      head: "#875c40",
      wing: "#734b35",
      beak: "#c9935a",
    },
    toneSequence: [850, 650, 850, 650, 850],
  },

  {
    id: "chickadee",
    commonName: "Black-capped Chickadee",
    scientificName: "Poecile atricapillus",
    mnemonic: "Chicka-dee-dee-dee!",
    audio: chickadeeAudio,
    fact: "The number of 'dee' notes in a chickadee call can signal how serious a threat is.",
    habitat: "Woodland, parks & feeders",
    difficulty: 2,
    colors: {
      body: "#77766f",
      head: "#292b2b",
      wing: "#555d5d",
      beak: "#222323",
    },
    toneSequence: [900, 720, 680, 680, 680],
  },

  {
    id: "titmouse",
    commonName: "Tufted Titmouse",
    scientificName: "Baeolophus bicolor",
    audio: tuftedTitmouseAudio,
    mnemonic: "Peter-peter-peter!",
    fact: "Tufted Titmice are bold feeder visitors and often carry a seed away to open it elsewhere.",
    habitat: "Deciduous woods, parks & feeders",
    difficulty: 2,
    colors: {
      body: "#8b9690",
      head: "#747f79",
      wing: "#66746f",
      beak: "#3d4542",
    },
    toneSequence: [760, 620, 760, 620, 760, 620],
  },

  {
    id: "eastern-bluebird",
    commonName: "Eastern Bluebird",
    scientificName: "Sialia sialis",
    audio: easternBluebirdAudio,
    mnemonic: "Chur-wi! Chur-wi!",
    fact: "Eastern Bluebirds often hunt from a low perch, dropping to the ground to grab insects.",
    habitat: "Open country, fields & nest-box trails",
    difficulty: 2,
    colors: {
      body: "#4f84a0",
      head: "#467894",
      wing: "#386c88",
      beak: "#454842",
    },
    toneSequence: [710, 780, 735, 820],
  },

  {
    id: "nuthatch",
    commonName: "White-breasted Nuthatch",
    scientificName: "Sitta carolinensis",
    audio: nuthatchAudio,
    mnemonic: "Yank! Yank! Yank!",
    fact: "White-breasted Nuthatches can climb headfirst down tree trunks while searching bark for food.",
    habitat: "Mature woodland, parks & feeders",
    difficulty: 2,
    colors: {
      body: "#71858b",
      head: "#30383a",
      wing: "#5d7178",
      beak: "#353b3b",
    },
    toneSequence: [540, 500, 550, 510],
  },

  {
    id: "house-finch",
    commonName: "House Finch",
    scientificName: "Haemorhous mexicanus",
    audio: houseFinchAudio,
    mnemonic: "Cheer-cheer-cheer... zee!",
    fact: "Male House Finches can range from yellow-orange to deep red depending partly on pigments in their diet.",
    habitat: "Towns, farms, yards & feeders",
    difficulty: 3,
    colors: {
      body: "#8a7569",
      head: "#a65448",
      wing: "#6e5e55",
      beak: "#b49a78",
    },
    toneSequence: [760, 840, 910, 830, 960],
  },

  {
    id: "american-crow",
    commonName: "American Crow",
    scientificName: "Corvus brachyrhynchos",
    audio: americanCrowAudio,
    mnemonic: "Caw! Caw! Caw!",
    fact: "American Crows are highly social and can remember individual human faces.",
    habitat: "Woodland edges, towns, fields & roadsides",
    difficulty: 1,
    colors: {
      body: "#343a3b",
      head: "#272c2d",
      wing: "#252b2c",
      beak: "#1f2425",
    },
    toneSequence: [310, 285, 315],
  },
];
