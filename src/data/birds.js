import redShoulderedHawkAudio from "../assets/audio/Red_shouldered_Hawk.ogg";
import yellowRumpedWarblerAudio from "../assets/audio/Yellow_rumped_Warbler.ogg";
import easternPhoebeAudio from "../assets/audio/Eastern_Phoebe.ogg";
import redWingedBlackbirdAudio from "../assets/audio/Red_winged_Blackbird.ogg";
import americanGoldfinchAudio from "../assets/audio/American_Goldfinch.ogg";
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

// First Birdsong expansion. Keeping the source recordings intact for now;
// these can be replaced with trimmed/local clips later without changing bird IDs.
const redBelliedWoodpeckerAudio =
  "https://upload.wikimedia.org/wikipedia/commons/0/01/Melanerpes_carolinus_-_Red-bellied_Woodpecker_-_XC71728.ogg";

const barredOwlAudio =
  "https://upload.wikimedia.org/wikipedia/commons/4/4a/Barred_Owl_%28Strix_varia%29_%28W1CDR0000351_BD27%29.ogg";

const easternTowheeAudio =
  "https://upload.wikimedia.org/wikipedia/commons/f/f7/Pipilo_erythrophthalmus_-_Eastern_Towhee_-_XC81298.ogg";

const killdeerAudio =
  "https://upload.wikimedia.org/wikipedia/commons/9/97/Charadrius_vociferus.ogg";

const northernMockingbirdAudio =
  "https://upload.wikimedia.org/wikipedia/commons/3/3c/Mimus_polyglottos_Northern_Mockingbird.ogg";

const carolinaChickadeeAudio =
  "https://upload.wikimedia.org/wikipedia/commons/e/e4/Carolina_Chickadee.ogg";

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

  {
    id: "red-bellied-woodpecker",
    commonName: "Red-bellied Woodpecker",
    scientificName: "Melanerpes carolinus",
    audio: redBelliedWoodpeckerAudio,
    mnemonic: "Churr! Churr! Churr!",
    fact: "Despite the name, the red on a Red-bellied Woodpecker's belly can be surprisingly hard to see; the bright red crown is usually much more obvious.",
    habitat: "Woodlands, parks & wooded neighborhoods",
    difficulty: 2,
    colors: {
      body: "#b8b2a7",
      head: "#b74d42",
      wing: "#343938",
      beak: "#4c504c",
    },
    toneSequence: [610, 570, 615],
  },

  {
    id: "barred-owl",
    commonName: "Barred Owl",
    scientificName: "Strix varia",
    audio: barredOwlAudio,
    mnemonic: "Who cooks for you? Who cooks for you-all?",
    fact: "Barred Owls are named for the dark bars across their pale plumage and are famous for their rhythmic hooting song.",
    habitat: "Mature forests, wooded swamps & river bottoms",
    difficulty: 1,
    colors: {
      body: "#9a8066",
      head: "#8a725c",
      wing: "#725e4d",
      beak: "#c7a35d",
    },
    toneSequence: [420, 470, 390, 420, 520, 470, 390],
  },

  {
    id: "killdeer",
    commonName: "Killdeer",
    scientificName: "Charadrius vociferus",
    audio: killdeerAudio,
    mnemonic: "Kill-deer! Kill-deer!",
    fact: "Killdeer often nest right on open gravel or bare ground and may perform a dramatic broken-wing display to lure predators away from their eggs.",
    habitat: "Fields, shorelines, parking lots & open ground",
    difficulty: 1,
    colors: {
      body: "#bca889",
      head: "#9a8065",
      wing: "#8b735c",
      beak: "#343735",
    },
    toneSequence: [820, 690, 820, 690],
  },

  {
    id: "eastern-towhee",
    commonName: "Eastern Towhee",
    scientificName: "Pipilo erythrophthalmus",
    audio: easternTowheeAudio,
    mnemonic: "Drink your teeeeea!",
    fact: "Eastern Towhees spend much of their time scratching through leaf litter with both feet to uncover seeds and insects.",
    habitat: "Brushy edges, thickets & woodland understory",
    difficulty: 2,
    colors: {
      body: "#343838",
      head: "#242828",
      wing: "#a8583f",
      beak: "#494b45",
    },
    toneSequence: [650, 790, 900, 930, 960],
  },

  {
    id: "northern-mockingbird",
    commonName: "Northern Mockingbird",
    scientificName: "Mimus polyglottos",
    audio: northernMockingbirdAudio,
    mnemonic: "A whole playlist — repeated in little phrases",
    fact: "Northern Mockingbirds can learn and imitate many different sounds, including the songs of other bird species.",
    habitat: "Open neighborhoods, parks, hedges & woodland edges",
    difficulty: 3,
    colors: {
      body: "#8f9692",
      head: "#818985",
      wing: "#535b59",
      beak: "#353a39",
    },
    toneSequence: [720, 850, 760, 920, 690, 830],
  },

  {
    id: "carolina-chickadee",
    commonName: "Carolina Chickadee",
    scientificName: "Poecile carolinensis",
    audio: carolinaChickadeeAudio,
    mnemonic: "Chick-a-dee-dee-dee!",
    fact: "Carolina Chickadees are close relatives of Black-capped Chickadees, and their ranges meet in a narrow zone where the two can be especially tricky to tell apart.",
    habitat: "Woodlands, parks, yards & feeders",
    difficulty: 3,
    colors: {
      body: "#85837c",
      head: "#292c2c",
      wing: "#5d6462",
      beak: "#222525",
    },
    toneSequence: [900, 740, 690, 690, 690],
  },

  {
      "id": "red-shouldered-hawk",
      "commonName": "Red-shouldered Hawk",
      "scientificName": "Buteo lineatus",
      "audio": redShoulderedHawkAudio,
      "mnemonic": "Kee-aah! Kee-aah!",
      "fact": "Red-shouldered Hawks live in wooded habitats, including forests along rivers and swamps.",
      "habitat": "Woodlands, river bottoms & wooded neighborhoods",
      "difficulty": 2,
      "colors": {
          "body": "#b58b65",
          "head": "#80644e",
          "wing": "#705b4c",
          "beak": "#d2a349"
      },
      "toneSequence": [
          920,
          650,
          920,
          650
      ]
  },

  {
      "id": "yellow-rumped-warbler",
      "commonName": "Yellow-rumped Warbler",
      "scientificName": "Setophaga coronata",
      "audio": yellowRumpedWarblerAudio,
      "mnemonic": "A sweet warble with a quicker finish",
      "fact": "Yellow-rumped Warblers can digest the waxy coating of bayberries, helping them find food through winter.",
      "habitat": "Woodland edges, conifer forests & winter berry patches",
      "difficulty": 3,
      "colors": {
          "body": "#8d9696",
          "head": "#687376",
          "wing": "#424d52",
          "beak": "#343b3b"
      },
      "toneSequence": [
          820,
          850,
          870,
          890,
          900
      ]
  },

  {
      "id": "eastern-phoebe",
      "commonName": "Eastern Phoebe",
      "scientificName": "Sayornis phoebe",
      "audio": easternPhoebeAudio,
      "mnemonic": "Fee-bee! Fee-brr!",
      "fact": "Eastern Phoebes often bob their tails and build nests beneath bridges, porches, and other sheltered ledges.",
      "habitat": "Open woodland, stream edges, bridges & porches",
      "difficulty": 1,
      "colors": {
          "body": "#817b69",
          "head": "#4c5149",
          "wing": "#5e6052",
          "beak": "#303832"
      },
      "toneSequence": [
          780,
          600,
          780,
          670
      ]
  },

  {
      "id": "red-winged-blackbird",
      "commonName": "Red-winged Blackbird",
      "scientificName": "Agelaius phoeniceus",
      "audio": redWingedBlackbirdAudio,
      "mnemonic": "Conk-la-reeee!",
      "fact": "Male Red-winged Blackbirds often show off their red shoulder patches while singing from a high perch.",
      "habitat": "Marshes, wet meadows, pond edges & fields",
      "difficulty": 1,
      "colors": {
          "body": "#303736",
          "head": "#242b2c",
          "wing": "#202727",
          "beak": "#303736"
      },
      "toneSequence": [
          480,
          680,
          880,
          880
      ]
  },

  {
      "id": "american-goldfinch",
      "commonName": "American Goldfinch",
      "scientificName": "Spinus tristis",
      "audio": americanGoldfinchAudio,
      "mnemonic": "Po-ta-to-chip!",
      "fact": "American Goldfinches nest later in summer, when thistles and other plants have gone to seed.",
      "habitat": "Weedy fields, gardens, open woodland & feeders",
      "difficulty": 2,
      "colors": {
          "body": "#e6c64d",
          "head": "#e8c943",
          "wing": "#343d3a",
          "beak": "#dba765"
      },
      "toneSequence": [
          790,
          860,
          820,
          900
      ]
  },
];
