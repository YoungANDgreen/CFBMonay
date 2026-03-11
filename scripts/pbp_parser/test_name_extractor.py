"""Tests for play-by-play name extractor."""

import pytest
from .name_extractor import extract_players


# ── Rush ──────────────────────────────────────────────────────────────────────

class TestRush:
    def test_basic_rush(self):
        result = extract_players("Rush", "Anthony Woods run for 2 yds to the LAM 45")
        assert result == {"rusher": "Anthony Woods"}

    def test_rush_1st_down(self):
        result = extract_players("Rush", "Jordan Canzeri run for 32 yds to the Tenn 14 for a 1ST down")
        assert result == {"rusher": "Jordan Canzeri"}

    def test_rush_negative_yards(self):
        result = extract_players("Rush", "Sawyer Robertson run for a loss of 3 yds")
        assert result == {"rusher": "Sawyer Robertson"}

    def test_rush_no_gain(self):
        result = extract_players("Rush", "Mark Weisman run for no gain to the Tenn 33")
        assert result == {"rusher": "Mark Weisman"}

    def test_rush_1_yd(self):
        result = extract_players("Rush", "Macon Plewa run for 1 yd to the Tenn 33")
        assert result == {"rusher": "Macon Plewa"}

    def test_rush_name_with_suffix_jr(self):
        result = extract_players("Rush", "Travis Etienne Jr. run for 5 yds to the CLE 40")
        assert result == {"rusher": "Travis Etienne Jr."}

    def test_rush_name_with_suffix_ii(self):
        result = extract_players("Rush", "Bryce Young II run for 3 yds to the ALA 30")
        assert result == {"rusher": "Bryce Young II"}

    def test_rush_name_with_period(self):
        result = extract_players("Rush", "C.J. Beathard run for 4 yds to the Tenn 38")
        assert result == {"rusher": "C.J. Beathard"}

    def test_rush_name_with_hyphen(self):
        result = extract_players("Rush", "LeShun Daniels Jr. run for 7 yds to the Iowa 27")
        assert result == {"rusher": "LeShun Daniels Jr."}


# ── Rushing Touchdown ─────────────────────────────────────────────────────────

class TestRushingTouchdown:
    def test_rush_td_format_a(self):
        """Format: 'Name run for N yds for a TD, (Kicker KICK)'"""
        result = extract_players("Rushing Touchdown", "Jack Layne run for 4 yds for a TD (Cameron Pope KICK)")
        assert result == {"rusher": "Jack Layne"}

    def test_rush_td_format_b(self):
        """Format: 'Name N Yd Run (Kicker Kick)'"""
        result = extract_players("Rushing Touchdown", "Kenneth Farrow 8 Yd Run (Kyle Bullard Kick)")
        assert result == {"rusher": "Kenneth Farrow"}

    def test_rush_td_format_b_two_point(self):
        result = extract_players("Rushing Touchdown", "Paul Perkins 67 Yd Run (Two-Point Run Conversion Failed)")
        assert result == {"rusher": "Paul Perkins"}

    def test_rush_td_format_a_comma(self):
        result = extract_players("Rushing Touchdown", "Mark Weisman run for 1 yd for a TD, (Marshall Koehn KICK)")
        assert result == {"rusher": "Mark Weisman"}

    def test_rush_td_format_b_with_suffix(self):
        result = extract_players("Rushing Touchdown", "Rodrick Williams Jr. 20 Yd Run (Ryan Santoso Kick)")
        assert result == {"rusher": "Rodrick Williams Jr."}

    def test_rush_td_format_b_for_a_td(self):
        """Format: 'Name N Yd Run for a TD (Kicker Kick)'"""
        result = extract_players("Rushing Touchdown", "Melvin Gordon 6 Yd Run for a TD (Rafael Gaglianone Kick)")
        assert result == {"rusher": "Melvin Gordon"}


# ── Pass Reception ────────────────────────────────────────────────────────────

class TestPassReception:
    def test_pass_complete(self):
        result = extract_players("Pass Reception", "Jack Layne pass complete to Mark Hamper")
        assert result == {"passer": "Jack Layne", "receiver": "Mark Hamper"}

    def test_pass_complete_with_yards(self):
        result = extract_players("Pass Reception", "C.J. Beathard pass complete to Kevonte Martin-Manley for 8 yds to the Tenn 31 for a 1ST down")
        assert result == {"passer": "C.J. Beathard", "receiver": "Kevonte Martin-Manley"}

    def test_pass_complete_1st_down(self):
        result = extract_players("Pass Reception", "Jack Layne pass complete to Elisha Cummings for a 1ST down")
        assert result == {"passer": "Jack Layne", "receiver": "Elisha Cummings"}

    def test_pass_complete_loss(self):
        result = extract_players("Pass Reception", "C.J. Beathard pass complete to Damond Powell for a loss of 4 yards to the Iowa 48")
        assert result == {"passer": "C.J. Beathard", "receiver": "Damond Powell"}


# ── Passing Touchdown ─────────────────────────────────────────────────────────

class TestPassingTouchdown:
    def test_pass_td_format_a(self):
        """Format: 'Receiver N Yd pass from Passer (Kicker Kick)'"""
        result = extract_players("Passing Touchdown", "Jake Cox 36 Yd pass from Hayden Hatten (Cameron Pope Kick)")
        assert result == {"passer": "Hayden Hatten", "receiver": "Jake Cox"}

    def test_pass_td_format_b(self):
        """Format: 'Passer pass complete to Receiver for N yds for a TD'"""
        result = extract_players("Passing Touchdown", "Rocco Becht pass complete to Jayden Higgins for 21 yds for a TD (Kyle Konrardy KICK)")
        assert result == {"passer": "Rocco Becht", "receiver": "Jayden Higgins"}

    def test_pass_td_format_a_with_suffix(self):
        result = extract_players("Passing Touchdown", "Deontay Greenberry 25 Yd pass from Greg Ward Jr. (Greg Ward Jr. Pass to Deontay Greenberry for Two-Point Conversion)")
        assert result == {"passer": "Greg Ward Jr.", "receiver": "Deontay Greenberry"}

    def test_pass_td_format_b_basic(self):
        result = extract_players("Passing Touchdown", "C.J. Beathard pass complete to Ray Hamilton for 31 yds for a TD, (Marshall Koehn KICK)")
        assert result == {"passer": "C.J. Beathard", "receiver": "Ray Hamilton"}

    def test_pass_td_format_a_for_a_td(self):
        """Format: 'Receiver N Yd pass from Passer for a TD (Kicker Kick)'"""
        result = extract_players("Passing Touchdown", "Ricardo Louis 66 Yd pass from Nick Marshall for a TD (Daniel Carlson Kick)")
        assert result == {"passer": "Nick Marshall", "receiver": "Ricardo Louis"}


# ── Pass Incompletion ─────────────────────────────────────────────────────────

class TestPassIncompletion:
    def test_incomplete_with_target(self):
        result = extract_players("Pass Incompletion", "Jack Layne pass incomplete to Terez Traynor")
        assert result == {"passer": "Jack Layne"}

    def test_incomplete_no_target(self):
        result = extract_players("Pass Incompletion", "Jack Layne pass incomplete")
        assert result == {"passer": "Jack Layne"}

    def test_incomplete_no_passer(self):
        """Edge case: text starts with 'pass incomplete'"""
        result = extract_players("Pass Incompletion", "pass incomplete to Terez Traynor")
        assert result == {}

    def test_incomplete_with_suffix(self):
        result = extract_players("Pass Incompletion", "Greg Ward Jr. pass incomplete to Demarcus Ayers")
        assert result == {"passer": "Greg Ward Jr."}


# ── Sack ──────────────────────────────────────────────────────────────────────

class TestSack:
    def test_sack_basic(self):
        result = extract_players("Sack", "Spencer Rattler sacked by Tomari Fox for a loss of 3 yards to the UNC 8")
        assert result == {"qb": "Spencer Rattler", "defender": "Tomari Fox"}

    def test_sack_two_defenders(self):
        """When two defenders share the sack, extract only the first."""
        result = extract_players("Sack", "Joshua Dobbs sacked by Jaleel Johnson and Quinton Alston for a loss of 3 yards to the Tenn 5")
        assert result == {"qb": "Joshua Dobbs", "defender": "Jaleel Johnson"}

    def test_sack_with_suffix(self):
        result = extract_players("Sack", "Greg Ward Jr. sacked by Rori Blair for a loss of 4 yards to the Pitt 22")
        assert result == {"qb": "Greg Ward Jr.", "defender": "Rori Blair"}

    def test_sack_with_fumble(self):
        result = extract_players("Sack", "Mitch Leidner sacked by Markus Golden for a loss of 5 yards to the Misso 44 Mitch Leidner fumbled, forced by Markus Golden")
        assert result == {"qb": "Mitch Leidner", "defender": "Markus Golden"}


# ── Interception ──────────────────────────────────────────────────────────────

class TestInterception:
    def test_interception_basic(self):
        result = extract_players("Interception", "Gevani McCoy pass intercepted")
        assert result == {"passer": "Gevani McCoy"}

    def test_interception_with_by(self):
        result = extract_players("Interception", "Sam Hartman pass intercepted by Phillip O'Brien Jr., at the PITT9, return for 19 yards to the PITT 28")
        assert result == {"passer": "Sam Hartman"}

    def test_interception_touchback(self):
        result = extract_players("Interception", "Austin Reed pass intercepted, touchback.")
        assert result == {"passer": "Austin Reed"}


class TestInterceptionReturnTouchdown:
    def test_int_return_td_format_a(self):
        """Format: 'Defender N Yd Interception Return (Kicker Kick)' — no passer available"""
        result = extract_players("Interception Return Touchdown", "Steve Miller 41 Yd Interception Return (Sean Nuernberger Kick)")
        assert result == {}

    def test_int_return_td_format_b(self):
        """Format: 'Passer pass intercepted for a TD Defender return for N yds for a TD'"""
        result = extract_players("Interception Return Touchdown", "Trevor Knight pass intercepted for a TD Ben Boulware return for 47 yds for a TD, (Ammon Lakip KICK)")
        assert result == {"passer": "Trevor Knight"}

    def test_int_return_td_format_b_by(self):
        result = extract_players("Interception Return Touchdown", "D'Eriq King pass intercepted by Jaron Bryant return for 44 yds for a TD (Jimmy Camacho KICK)")
        assert result == {"passer": "D'Eriq King"}


class TestPassInterceptionReturn:
    def test_pass_int_return_basic(self):
        result = extract_players("Pass Interception Return", "Joshua Dobbs pass intercepted Desmond King return for 37 yds to the Tenn 31")
        assert result == {"passer": "Joshua Dobbs"}

    def test_pass_int_return_touchback(self):
        result = extract_players("Pass Interception Return", "Maty Mauk pass intercepted, touchback. Briean Boddy-Calhoun return for no gain")
        assert result == {"passer": "Maty Mauk"}


# ── Field Goal ────────────────────────────────────────────────────────────────

class TestFieldGoal:
    def test_fg_good_format_a(self):
        """Format: 'Name N yd FG GOOD'"""
        result = extract_players("Field Goal Good", "Mitch Jeter 26 yd FG GOOD")
        assert result == {"kicker": "Mitch Jeter"}

    def test_fg_good_format_b(self):
        """Format: 'Name N Yd Field Goal'"""
        result = extract_players("Field Goal Good", "Logan Ward 52 Yd Field Goal")
        assert result == {"kicker": "Logan Ward"}

    def test_fg_missed_format_a(self):
        result = extract_players("Field Goal Missed", "Daniel Carlson 44 yd FG MISSED")
        assert result == {"kicker": "Daniel Carlson"}

    def test_fg_missed_format_b(self):
        result = extract_players("Field Goal Missed", "Michael Badgley 51 Yard Field Goal Missed")
        assert result == {"kicker": "Michael Badgley"}

    def test_fg_kicker_with_apostrophe(self):
        result = extract_players("Field Goal Good", "Ka'imi Fairbairn 27 yd FG GOOD")
        assert result == {"kicker": "Ka'imi Fairbairn"}


# ── Fumble ────────────────────────────────────────────────────────────────────

class TestFumble:
    def test_fumble_opponent(self):
        result = extract_players("Fumble Recovery (Opponent)", "Sawyer Robertson fumbled, recovered by TXST Kaleb Culp")
        assert result == {"fumbler": "Sawyer Robertson"}

    def test_fumble_from_run(self):
        result = extract_players("Fumble Recovery (Opponent)", "C.J. Beathard run for a loss of 3 yards to the 50 yard line C.J. Beathard fumbled, recovered by Tenn Brian Randolph , re")
        assert result == {"fumbler": "C.J. Beathard"}

    def test_fumble_own(self):
        result = extract_players("Fumble Recovery (Own)", "Mitch Leidner run for a loss of 7 yards to the Minn 37 Mitch Leidner fumbled, recovered by Minn KJ Maye")
        assert result == {"fumbler": "Mitch Leidner"}

    def test_fumble_from_pass(self):
        result = extract_players("Fumble Recovery (Opponent)", "Jameis Winston pass complete to Dalvin Cook for 15 yds Dalvin Cook fumbled, forced by Johnny Ragin III, recovered by Ore")
        assert result == {"fumbler": "Dalvin Cook"}

    def test_fumble_return_td(self):
        """Fumble Return Touchdown format: 'Name N Yd Fumble Return (Kicker Kick)' — no fumbler available"""
        result = extract_players("Fumble Return Touchdown", "Allen Covington 67 Yd Fumble Return (Jeremiah Detmer Kick)")
        assert result == {}

    def test_fumble_from_sack(self):
        result = extract_players("Fumble Recovery (Own)", "Bryce Petty sacked by Shilique Calhoun and Joel Heath for a loss of 13 yards to the Bayl 11 Bryce Petty fumbled, recover")
        assert result == {"fumbler": "Bryce Petty"}


# ── Kickoff / Punt Return ────────────────────────────────────────────────────

class TestReturns:
    def test_kickoff_return_offense(self):
        """Format: 'Kicker kickoff for N yds , Returner return for N yds'"""
        result = extract_players("Kickoff Return (Offense)", "Adam Griffith kickoff for 64 yds , Curtis Samuel return for 13 yds to the OhSt 14")
        assert result == {"returner": "Curtis Samuel"}

    def test_kickoff_return_td_format_a(self):
        """Format: 'Kicker kickoff for N yds , Returner return for N yds for a TD'"""
        result = extract_players("Kickoff Return Touchdown", "Kyle Brindza kickoff for 65 yds , Leonard Fournette return for 100 yds for a TD (Trent Domingue KICK)")
        assert result == {"returner": "Leonard Fournette"}

    def test_kickoff_return_td_format_b(self):
        """Format: 'Returner N Yd Kickoff Return (Kicker Kick)'"""
        result = extract_players("Kickoff Return Touchdown", "Deandre Reaves 93 Yd Kickoff Return (Justin Haig Kick)")
        assert result == {"returner": "Deandre Reaves"}

    def test_punt_return_td(self):
        """Format: 'Returner N Yd Punt Return (Kicker Kick)'"""
        result = extract_players("Punt Return Touchdown", "Desmon White 76 Yd Punt Return (Cole Bunce Kick)")
        assert result == {"returner": "Desmon White"}

    def test_kickoff_return_td_format_c(self):
        """Format: 'K. Halvorsen kick for N yds,T. Keith return for N yds for a TD'"""
        result = extract_players("Kickoff Return Touchdown", "K. Halvorsen kick for 58 yds,T. Keith return for 93 yds for a TD (J. Cannon KICK)")
        assert result == {"returner": "T. Keith"}


# ── TEAM / Empty / Skip ──────────────────────────────────────────────────────

class TestEdgeCases:
    def test_team_placeholder(self):
        result = extract_players("Rush", "TEAM run for 0 yds")
        assert result == {}

    def test_team_mixed_case(self):
        result = extract_players("Rush", "Team run for 0 yds")
        assert result == {}

    def test_team_pass_incomplete(self):
        result = extract_players("Pass Incompletion", "TEAM pass incomplete")
        assert result == {}

    def test_empty_text(self):
        result = extract_players("Rush", "")
        assert result == {}

    def test_none_text(self):
        result = extract_players("Rush", None)
        assert result == {}

    def test_skip_kickoff(self):
        result = extract_players("Kickoff", "Aaron Medley kickoff for 65 yds for a touchback")
        assert result == {}

    def test_skip_punt(self):
        result = extract_players("Punt", "Connor Kornbrath punt for 39 yds , Cameron Sutton returns for 12 yds to the Tenn 25")
        assert result == {}

    def test_skip_penalty(self):
        result = extract_players("Penalty", "PITTSBURGH Penalty, Unnecessary Roughness (-15 Yards) to the Houst 32")
        assert result == {}

    def test_skip_timeout(self):
        result = extract_players("Timeout", "Timeout IOWA, clock 05:19")
        assert result == {}

    def test_skip_end_period(self):
        result = extract_players("End Period", "End of 3rd Quarter")
        assert result == {}

    def test_skip_end_of_half(self):
        result = extract_players("End of Half", "End of 2nd Quarter")
        assert result == {}

    def test_skip_end_of_game(self):
        result = extract_players("End of Game", "End of 4th Quarter")
        assert result == {}

    def test_skip_end_of_regulation(self):
        result = extract_players("End of Regulation", "End of 4th Quarter")
        assert result == {}

    def test_skip_blocked_fg(self):
        result = extract_players("Blocked Field Goal", "Chris Callahan 43 yd FG BLOCKED blocked by RJ Williamson")
        assert result == {}

    def test_skip_blocked_punt(self):
        result = extract_players("Blocked Punt", "TEAM punt blocked by Dallas Lloyd")
        assert result == {}

    def test_skip_safety(self):
        result = extract_players("Safety", "Team Safety")
        assert result == {}

    def test_skip_uncategorized(self):
        result = extract_players("Uncategorized", "some random text")
        assert result == {}

    def test_skip_placeholder(self):
        result = extract_players("placeholder", "some text")
        assert result == {}

    def test_unknown_play_type(self):
        result = extract_players("Two Point Pass", "some text")
        assert result == {}

    def test_fumble_team_placeholder(self):
        result = extract_players("Fumble Recovery (Own)", "TEAM run for a loss of 2 yards to the CMich 12 TEAM fumbled, recovered by WKent Anthony Wales")
        assert result == {}
