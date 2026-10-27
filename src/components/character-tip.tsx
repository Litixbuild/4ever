import { classColor, factionColor, factionName } from "@/lib/wow";

export type Character = {
  name: string | null;
  spec: string | null;
  race: string | null;
  className: string | null;
  realm: string | null;
  guild: string | null;
  faction: string | null;
};

export function hasCharacter(c: Character): boolean {
  return Boolean(c.name || c.className || c.realm);
}

// A character the way the game's unit tooltip shows one: name in its class color, <Guild>,
// race, spec and class, then ruleset and faction.
export function CharacterTip({
  character,
  fallbackName,
  className = "",
}: {
  character: Character;
  fallbackName: string;
  className?: string;
}) {
  const faction = factionName(character.faction);
  // "Troll Shadow Priest": race, then spec and class, the way players say it.
  const line = [character.race, character.spec, character.className].filter(Boolean).join(" ");
  return (
    <div className={`wow-tip ${className}`} aria-label="Main character">
      <span
        className="tip-title"
        style={{
          color: classColor(character.className) ?? "#fff",
          fontSize: 22,
        }}
      >
        {character.name || fallbackName}
      </span>
      {character.guild ? <span>&lt;{character.guild}&gt;</span> : null}
      {line ? <span>{line}</span> : null}
      {character.realm || faction ? (
        <span className="tip-split">
          <span className="tip-muted">{character.realm ?? ""}</span>
          {faction ? <span style={{ color: factionColor(character.faction) }}>{faction}</span> : null}
        </span>
      ) : null}
    </div>
  );
}
