// A first pass over titles before they go live. Twitch clip titles are written by whoever made the clip,
// so a few are crude. Anything that matches waits for a curator instead of going straight up.
// This is a tripwire, not a judge: a curator still reads every flagged title.

const WORDS = [
  // English swearing, slurs and sexual terms
  "fuck",
  "fucking",
  "fucked",
  "shit",
  "bitch",
  "cunt",
  "dick",
  "cock",
  "pussy",
  "whore",
  "slut",
  "porn",
  "porno",
  "rape",
  "raped",
  "rapist",
  "nude",
  "nudes",
  "sex",
  "sexy",
  "cum",
  "tits",
  "boobs",
  "horny",
  "nigger",
  "nigga",
  "faggot",
  "fag",
  "retard",
  "retarded",
  "tranny",
  "kys",
  "onlyfans",
  // Spanish
  "sexo",
  "puta",
  "puto",
  "verga",
  "polla",
  "coño",
  "pene",
  "follar",
  "maricon",
  "maricón",
  "consentimiento",
  // Russian, as people type it in Latin letters
  "blya",
  "blyat",
  "suka",
  "pizda",
  "nahui",
  "nahuy",
  "huy",
  "pidor",
];

const PATTERN = new RegExp(`(^|[^\\p{L}])(${WORDS.join("|")})(?=$|[^\\p{L}])`, "iu");

// "S.E.X", "s-e-x" and "SE..X..O" are the same word with punctuation between the letters.
function squashDots(text: string): string {
  return text.replace(/(\p{L})[.\-_*·]+(?=\p{L})/gu, "$1");
}

export function titleNeedsReview(title: string): boolean {
  return PATTERN.test(title) || PATTERN.test(squashDots(title));
}
