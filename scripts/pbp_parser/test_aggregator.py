"""Tests for PlayerAggregator — written BEFORE implementation (TDD)."""

import pytest
from scripts.pbp_parser.aggregator import PlayerAggregator


@pytest.fixture
def agg():
    return PlayerAggregator()


# ── 1. Rush play ────────────────────────────────────────────────────────────

def test_rush_play_records_stats(agg):
    players = {"rusher": "Bijan Robinson"}
    agg.record_play(
        season=2022, game_id="g1", team="Texas",
        play_type="Rush", players=players,
        yards_gained=12, scoring=False, ppa=0.3,
    )
    s = agg.get_player_season_stats("Bijan Robinson", "Texas", 2022)
    assert s["rush_att"] == 1
    assert s["rush_yds"] == 12
    assert s["games"] == 1


# ── 2. Rushing TD ───────────────────────────────────────────────────────────

def test_rushing_td(agg):
    players = {"rusher": "Bijan Robinson"}
    agg.record_play(
        season=2022, game_id="g1", team="Texas",
        play_type="Rushing Touchdown", players=players,
        yards_gained=5, scoring=True, ppa=1.0,
    )
    s = agg.get_player_season_stats("Bijan Robinson", "Texas", 2022)
    assert s["rush_td"] == 1
    assert s["rush_att"] == 1
    assert s["rush_yds"] == 5


# ── 3. Pass completion ─────────────────────────────────────────────────────

def test_pass_completion(agg):
    players = {"passer": "Quinn Ewers", "receiver": "Xavier Worthy"}
    agg.record_play(
        season=2022, game_id="g1", team="Texas",
        play_type="Pass Reception", players=players,
        yards_gained=25, scoring=False, ppa=0.5,
    )
    passer = agg.get_player_season_stats("Quinn Ewers", "Texas", 2022)
    assert passer["pass_comp"] == 1
    assert passer["pass_att"] == 1
    assert passer["pass_yds"] == 25

    receiver = agg.get_player_season_stats("Xavier Worthy", "Texas", 2022)
    assert receiver["receptions"] == 1
    assert receiver["rec_yds"] == 25


# ── 4. Sack — NOT a pass attempt ───────────────────────────────────────────

def test_sack_not_pass_attempt(agg):
    players = {"qb": "Quinn Ewers", "defender": "Will Anderson Jr."}
    agg.record_play(
        season=2022, game_id="g1", team="Texas",
        play_type="Sack", players=players,
        yards_gained=-8, scoring=False, ppa=-1.0,
    )
    qb = agg.get_player_season_stats("Quinn Ewers", "Texas", 2022)
    assert qb["pass_att"] == 0
    assert qb["times_sacked"] == 1

    defender = agg.get_player_season_stats("Will Anderson Jr.", "Texas", 2022)
    assert defender["sacks_recorded"] == 1


# ── 5. Interception ────────────────────────────────────────────────────────

def test_interception(agg):
    players = {"passer": "Quinn Ewers"}
    agg.record_play(
        season=2022, game_id="g1", team="Texas",
        play_type="Interception", players=players,
        yards_gained=0, scoring=False, ppa=-2.0,
    )
    s = agg.get_player_season_stats("Quinn Ewers", "Texas", 2022)
    assert s["pass_att"] == 1
    assert s["pass_int"] == 1


# ── 6. Game counting — same game counts once ───────────────────────────────

def test_game_counting(agg):
    for _ in range(5):
        agg.record_play(
            season=2022, game_id="g1", team="Texas",
            play_type="Rush", players={"rusher": "Bijan Robinson"},
            yards_gained=4, scoring=False, ppa=0.1,
        )
    agg.record_play(
        season=2022, game_id="g2", team="Texas",
        play_type="Rush", players={"rusher": "Bijan Robinson"},
        yards_gained=10, scoring=False, ppa=0.2,
    )
    s = agg.get_player_season_stats("Bijan Robinson", "Texas", 2022)
    assert s["rush_att"] == 6
    assert s["games"] == 2


# ── 7. Field Goal ──────────────────────────────────────────────────────────

def test_field_goal_made(agg):
    players = {"kicker": "Bert Auburn"}
    agg.record_play(
        season=2022, game_id="g1", team="Texas",
        play_type="Field Goal Good", players=players,
        yards_gained=0, scoring=True, ppa=0.0,
    )
    s = agg.get_player_season_stats("Bert Auburn", "Texas", 2022)
    assert s["fg_made"] == 1
    assert s["fg_att"] == 1


def test_field_goal_missed(agg):
    players = {"kicker": "Bert Auburn"}
    agg.record_play(
        season=2022, game_id="g1", team="Texas",
        play_type="Field Goal Missed", players=players,
        yards_gained=0, scoring=False, ppa=0.0,
    )
    s = agg.get_player_season_stats("Bert Auburn", "Texas", 2022)
    assert s["fg_made"] == 0
    assert s["fg_att"] == 1


# ── 8. Position inference: QB ───────────────────────────────────────────────

def test_position_inference_qb(agg):
    for i in range(6):
        agg.record_play(
            season=2022, game_id="g1", team="Texas",
            play_type="Pass Reception",
            players={"passer": "Quinn Ewers", "receiver": f"WR{i}"},
            yards_gained=10, scoring=False, ppa=0.3,
        )
    entry = agg.get_player_entry("Quinn Ewers", "Texas")
    assert entry["position"] == "QB"


# ── 9. Position inference: RB ───────────────────────────────────────────────

def test_position_inference_rb(agg):
    for i in range(10):
        agg.record_play(
            season=2022, game_id="g1", team="Texas",
            play_type="Rush",
            players={"rusher": "Bijan Robinson"},
            yards_gained=5, scoring=False, ppa=0.2,
        )
    entry = agg.get_player_entry("Bijan Robinson", "Texas")
    assert entry["position"] == "RB"


# ── 10. export_players format ───────────────────────────────────────────────

def test_export_players_format(agg):
    agg.record_play(
        season=2022, game_id="g1", team="Texas",
        play_type="Rush", players={"rusher": "Bijan Robinson"},
        yards_gained=5, scoring=False, ppa=0.2,
    )
    players = agg.export_players()
    assert len(players) == 1
    p = players[0]
    assert "id" in p
    assert p["firstName"] == "Bijan"
    assert p["lastName"] == "Robinson"
    assert p["team"] == "Texas"
    assert p["jersey"] == 0
    assert p["height"] == 0
    assert p["weight"] == 0
    assert p["year"] == ""
    assert p["hometown"] == ""
    assert isinstance(p["id"], int)


# ── 11. export_player_stats FLAT format ─────────────────────────────────────

def test_export_player_stats_flat_format(agg):
    # Record a pass completion (creates passer + receiver)
    agg.record_play(
        season=2022, game_id="g1", team="Texas",
        play_type="Pass Reception",
        players={"passer": "Quinn Ewers", "receiver": "Xavier Worthy"},
        yards_gained=30, scoring=False, ppa=0.5,
    )
    # Record 5 more passes to make Quinn Ewers a QB
    for i in range(5):
        agg.record_play(
            season=2022, game_id="g1", team="Texas",
            play_type="Pass Reception",
            players={"passer": "Quinn Ewers", "receiver": f"WR{i}"},
            yards_gained=10, scoring=False, ppa=0.3,
        )

    stats = agg.export_player_stats()
    qb_stats = [s for s in stats if s["player"] == "Quinn Ewers"][0]

    # Must use "player" NOT "playerName"
    assert "player" in qb_stats
    assert "playerName" not in qb_stats

    # Must have "category"
    assert qb_stats["category"] == "QB"

    # Flat field names must match CachedPlayerSeasonStats
    assert qb_stats["passingYards"] == 80  # 30 + 5*10
    assert qb_stats["passingTDs"] == 0
    assert qb_stats["completions"] == 6
    assert qb_stats["attempts"] == 6
    assert qb_stats["interceptions"] == 0
    assert qb_stats["season"] == 2022
    assert qb_stats["team"] == "Texas"
    assert isinstance(qb_stats["playerId"], int)

    # Receiver stats
    wr_stats = [s for s in stats if s["player"] == "Xavier Worthy"][0]
    assert wr_stats["receptions"] == 1
    assert wr_stats["receivingYards"] == 30


# ── 12. Passing TD records stats for passer and receiver ────────────────────

def test_passing_td(agg):
    players = {"passer": "Quinn Ewers", "receiver": "Xavier Worthy"}
    agg.record_play(
        season=2022, game_id="g1", team="Texas",
        play_type="Passing Touchdown", players=players,
        yards_gained=40, scoring=True, ppa=2.0,
    )
    passer = agg.get_player_season_stats("Quinn Ewers", "Texas", 2022)
    assert passer["pass_td"] == 1
    assert passer["pass_comp"] == 1
    assert passer["pass_att"] == 1
    assert passer["pass_yds"] == 40

    receiver = agg.get_player_season_stats("Xavier Worthy", "Texas", 2022)
    assert receiver["rec_td"] == 1
    assert receiver["receptions"] == 1
    assert receiver["rec_yds"] == 40


# ── 13. Pass incompletion ──────────────────────────────────────────────────

def test_pass_incompletion(agg):
    players = {"passer": "Quinn Ewers"}
    agg.record_play(
        season=2022, game_id="g1", team="Texas",
        play_type="Pass Incompletion", players=players,
        yards_gained=0, scoring=False, ppa=-0.2,
    )
    s = agg.get_player_season_stats("Quinn Ewers", "Texas", 2022)
    assert s["pass_att"] == 1
    assert s["pass_comp"] == 0


# ── 14. Position inference: K ───────────────────────────────────────────────

def test_position_inference_kicker(agg):
    agg.record_play(
        season=2022, game_id="g1", team="Texas",
        play_type="Field Goal Good", players={"kicker": "Bert Auburn"},
        yards_gained=0, scoring=True, ppa=0.0,
    )
    entry = agg.get_player_entry("Bert Auburn", "Texas")
    assert entry["position"] == "K"


# ── 15. Position inference: DEF ─────────────────────────────────────────────

def test_position_inference_def(agg):
    agg.record_play(
        season=2022, game_id="g1", team="Alabama",
        play_type="Sack", players={"qb": "SomeQB", "defender": "Will Anderson Jr."},
        yards_gained=-8, scoring=False, ppa=-1.0,
    )
    entry = agg.get_player_entry("Will Anderson Jr.", "Alabama")
    assert entry["position"] == "DEF"


# ── 16. Position inference: WR (more receptions than rushes) ────────────────

def test_position_inference_wr(agg):
    for i in range(5):
        agg.record_play(
            season=2022, game_id="g1", team="Texas",
            play_type="Pass Reception",
            players={"passer": f"QB{i}", "receiver": "Xavier Worthy"},
            yards_gained=15, scoring=False, ppa=0.4,
        )
    agg.record_play(
        season=2022, game_id="g1", team="Texas",
        play_type="Rush", players={"rusher": "Xavier Worthy"},
        yards_gained=3, scoring=False, ppa=0.1,
    )
    entry = agg.get_player_entry("Xavier Worthy", "Texas")
    assert entry["position"] == "WR"


# ── 17. Fumble play ────────────────────────────────────────────────────────

def test_fumble_records_fumble(agg):
    players = {"fumbler": "Bijan Robinson"}
    agg.record_play(
        season=2022, game_id="g1", team="Texas",
        play_type="Fumble Recovery (Own)", players=players,
        yards_gained=0, scoring=False, ppa=-1.0,
    )
    s = agg.get_player_season_stats("Bijan Robinson", "Texas", 2022)
    assert s["fumbles"] == 1


# ── 18. Return play ────────────────────────────────────────────────────────

def test_return_play(agg):
    players = {"returner": "Devin Hester"}
    agg.record_play(
        season=2022, game_id="g1", team="Florida",
        play_type="Kickoff Return (Offense)", players=players,
        yards_gained=45, scoring=False, ppa=0.5,
    )
    s = agg.get_player_season_stats("Devin Hester", "Florida", 2022)
    assert s["ret_yds"] == 45
    assert s["returns"] == 1
