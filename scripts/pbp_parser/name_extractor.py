"""
Extract player names from college football play-by-play text.

Only names are extracted here — all yardage and stats come from structured
CSV columns (yardsGained, ppa, scoring, etc.).
"""

import re
from typing import Optional

# Keywords that should NOT be part of a player name — used to terminate
# the greedy name capture.
_STOP_WORDS = (
    "run", "pass", "sacked", "fumbled", "fumble", "kickoff", "kick",
    "punt", "return", "for", "and", "to", "at", "the",
    "recovered", "intercepted", "blocked", "penalty",
)

def _extract_name(text: str) -> str:
    """
    Extract a player name from the start of a text fragment.

    A name is a sequence of capitalized-word tokens (may include periods,
    hyphens, apostrophes) optionally followed by a suffix (Jr., Sr., II, III, IV).
    Stops at the first lowercase stop-word or digit-starting token.
    """
    tokens = text.split()
    parts = []
    i = 0
    while i < len(tokens):
        tok = tokens[i]
        # Check for suffix
        if tok in ("Jr.", "Sr.", "II", "III", "IV"):
            parts.append(tok)
            i += 1
            break
        # Stop at known keywords (case-insensitive)
        if tok.lower() in _STOP_WORDS:
            break
        # Stop at tokens starting with a digit
        if tok[0].isdigit():
            break
        # A name token must start with an uppercase letter or be an
        # abbreviation like "C.J." or include apostrophes like "Ka'imi"
        if tok[0].isupper() or tok[0] == "'":
            parts.append(tok)
            i += 1
        else:
            break
    return " ".join(parts)


def _extract_name_reverse(text: str) -> str:
    """
    Extract a player name from the END of a text fragment by walking backwards.

    Used for patterns like "... C.J. Beathard fumbled" where the name is at
    the end of the preceding text.
    """
    tokens = text.strip().split()
    parts = []
    i = len(tokens) - 1
    # First collect suffix if present
    if i >= 0 and tokens[i] in ("Jr.", "Sr.", "II", "III", "IV"):
        parts.insert(0, tokens[i])
        i -= 1
    # Collect name tokens walking backwards
    while i >= 0:
        tok = tokens[i]
        # Stop at non-name tokens
        if tok.lower() in _STOP_WORDS:
            break
        if tok[0].isdigit():
            break
        if not (tok[0].isupper() or tok[0] == "'"):
            break
        parts.insert(0, tok)
        i -= 1
    return " ".join(parts)


# ── Skip list ────────────────────────────────────────────────────────────────

SKIP_TYPES = frozenset({
    "Kickoff", "Punt", "Penalty", "Timeout",
    "End Period", "End of Half", "End of Game", "End of Regulation",
    "Blocked Field Goal", "Blocked Punt", "Safety",
    "Uncategorized", "placeholder",
    "Two Point Rush", "Two Point Pass",
})


def _is_team(name: Optional[str]) -> bool:
    """Return True if the name is a TEAM placeholder."""
    if not name:
        return True
    return name.strip().upper() == "TEAM"


def _clean_name(name: Optional[str]) -> Optional[str]:
    """Strip trailing junk from an extracted name."""
    if not name:
        return None
    name = name.strip()
    # Remove trailing comma
    name = name.rstrip(",").strip()
    return name if name else None


# ── Regex patterns ────────────────────────────────────────────────────────────
# These patterns locate the structural keywords. Names are extracted via
# _extract_name() from the text before/after those keywords.

_RE_RUN = re.compile(r"\brun\s+for\s+", re.IGNORECASE)
_RE_YD_RUN = re.compile(r"\d+\s+[Yy]d\s+[Rr]un\b")
_RE_PASS_COMPLETE = re.compile(r"\bpass\s+complete\s+to\s+")
_RE_PASS_FROM = re.compile(r"\d+\s+[Yy]d\s+pass\s+from\s+")
_RE_PASS_INCOMPLETE = re.compile(r"\bpass\s+incomplete")
_RE_SACKED_BY = re.compile(r"\bsacked\s+by\s+")
_RE_PASS_INTERCEPTED = re.compile(r"\bpass\s+intercepted")
_RE_FG = re.compile(r"\d+\s+[Yy](?:d|ard)\s+(?:FG|Field Goal)\b")
_RE_FUMBLED = re.compile(r"\bfumbled")
_RE_RETURN_COMMA = re.compile(r",\s*(\S.+?)\s+return\s+for\s+")
_RE_YD_RETURN = re.compile(r"\d+\s+[Yy]d\s+(?:Kickoff|Punt)\s+Return\b")


def extract_players(play_type: str, play_text: str) -> dict:
    """
    Extract player names from a play-by-play text description.

    Args:
        play_type: The type of play (e.g. "Rush", "Pass Reception")
        play_text: The natural language play description

    Returns:
        Dict with keys like 'rusher', 'passer', 'receiver', 'qb', 'defender',
        'kicker', 'fumbler', 'returner'. Empty dict for unparseable/skipped types.
    """
    if not play_text:
        return {}

    play_text = play_text.strip()
    if not play_text:
        return {}

    # Skip types we don't parse
    if play_type in SKIP_TYPES:
        return {}

    # ── Rush / Rushing Touchdown ──────────────────────────────────────────

    if play_type in ("Rush", "Rushing Touchdown"):
        # Try "Name run for ..." first
        m = _RE_RUN.search(play_text)
        if m:
            name = _extract_name(play_text[:m.start()])
            if not name or _is_team(name):
                return {}
            return {"rusher": name}

        # Try "Name N Yd Run ..." (touchdown alt format)
        m = _RE_YD_RUN.search(play_text)
        if m:
            name = _extract_name(play_text[:m.start()])
            if not name or _is_team(name):
                return {}
            return {"rusher": name}

        return {}

    # ── Pass Reception / Passing Touchdown ────────────────────────────────

    if play_type in ("Pass Reception", "Passing Touchdown"):
        # Try "Passer pass complete to Receiver ..."
        m = _RE_PASS_COMPLETE.search(play_text)
        if m:
            passer = _extract_name(play_text[:m.start()])
            after = play_text[m.end():]
            receiver = _extract_name(after)
            if not passer or _is_team(passer):
                return {}
            result = {"passer": passer}
            if receiver and not _is_team(receiver):
                result["receiver"] = receiver
            return result

        # Try "Receiver N Yd pass from Passer ..." (TD format)
        m = _RE_PASS_FROM.search(play_text)
        if m:
            receiver = _extract_name(play_text[:m.start()])
            after = play_text[m.end():]
            passer = _extract_name(after)
            result = {}
            if passer and not _is_team(passer):
                result["passer"] = passer
            if receiver and not _is_team(receiver):
                result["receiver"] = receiver
            return result

        return {}

    # ── Pass Incompletion ─────────────────────────────────────────────────

    if play_type == "Pass Incompletion":
        m = _RE_PASS_INCOMPLETE.search(play_text)
        if m:
            passer = _extract_name(play_text[:m.start()])
            if not passer or _is_team(passer):
                return {}
            return {"passer": passer}
        return {}

    # ── Sack ──────────────────────────────────────────────────────────────

    if play_type == "Sack":
        m = _RE_SACKED_BY.search(play_text)
        if m:
            qb = _extract_name(play_text[:m.start()])
            after = play_text[m.end():]
            defender = _extract_name(after)
            if not qb or _is_team(qb):
                return {}
            result = {"qb": qb}
            if defender and not _is_team(defender):
                result["defender"] = defender
            return result
        return {}

    # ── Interception variants ─────────────────────────────────────────────

    if play_type in ("Interception", "Interception Return Touchdown", "Pass Interception Return"):
        m = _RE_PASS_INTERCEPTED.search(play_text)
        if m:
            passer = _extract_name(play_text[:m.start()])
            if not passer or _is_team(passer):
                return {}
            return {"passer": passer}
        # "Interception Return Touchdown" alt format: "Defender N Yd Interception Return"
        # No passer extractable from this format
        return {}

    # ── Field Goal Good / Missed ──────────────────────────────────────────

    if play_type in ("Field Goal Good", "Field Goal Missed"):
        m = _RE_FG.search(play_text)
        if m:
            kicker = _extract_name(play_text[:m.start()])
            if not kicker or _is_team(kicker):
                return {}
            return {"kicker": kicker}
        return {}

    # ── Fumble Recovery (Own / Opponent) ──────────────────────────────────

    if play_type in ("Fumble Recovery (Opponent)", "Fumble Recovery (Own)"):
        m = _RE_FUMBLED.search(play_text)
        if m:
            # The fumbler name is right before "fumbled"
            before = play_text[:m.start()]
            # Take the last name-like tokens before "fumbled"
            fumbler = _extract_name_reverse(before)
            if not fumbler or _is_team(fumbler):
                return {}
            return {"fumbler": fumbler}
        return {}

    # ── Fumble Return Touchdown ───────────────────────────────────────────
    # Format: "Name N Yd Fumble Return ..." — the name is the returner/defender, not fumbler
    # No fumbler extractable from this format
    if play_type == "Fumble Return Touchdown":
        return {}

    # ── Kickoff Return / Kickoff Return TD / Punt Return TD ───────────────

    if play_type in ("Kickoff Return (Offense)", "Kickoff Return Touchdown", "Punt Return Touchdown"):
        # Try alt format first: "Returner N Yd Kickoff/Punt Return ..."
        m = _RE_YD_RETURN.search(play_text)
        if m:
            returner = _extract_name(play_text[:m.start()])
            if not returner or _is_team(returner):
                return {}
            return {"returner": returner}

        # Try "... , Returner return for ..."
        m = _RE_RETURN_COMMA.search(play_text)
        if m:
            returner = _extract_name(m.group(1).strip())
            if not returner or _is_team(returner):
                return {}
            return {"returner": returner}

        return {}

    # ── Unknown play type → empty dict ────────────────────────────────────
    return {}
