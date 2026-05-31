use crate::app::{App, DetailPane, DetailState};
use crate::model::{GearInfo, JsonlMatch, Outcome, PerkInfo, UpgradeStepInfo};
use crate::ui::rating_color;
use ratatui::layout::{Constraint, Direction, Layout, Rect};
use ratatui::style::{Color, Modifier, Style};
use ratatui::text::{Line, Span};
use ratatui::widgets::{Block, Borders, Paragraph, Wrap};
use ratatui::Frame;

pub fn draw_detail(f: &mut Frame, area: Rect, app: &App) {
    let Some(m) = app.detail_match.as_ref() else {
        let block = Block::default().borders(Borders::ALL).title(" Detail ");
        f.render_widget(Paragraph::new("No selection").block(block), area);
        return;
    };

    match app.detail_pane {
        DetailPane::Overview => draw_overview(f, area, m),
        DetailPane::Build => draw_build_pane(f, area, m),
        DetailPane::Log => draw_log_pane(f, area, app, m),
    }
}

/// Default pane: summary + balance score with full width, plus a hint about the
/// other toggleable panes.
fn draw_overview(f: &mut Frame, area: Rect, m: &JsonlMatch) {
    let chunks = Layout::default()
        .direction(Direction::Vertical)
        .constraints([
            Constraint::Length(5),
            Constraint::Length(11),
            Constraint::Min(0),
        ])
        .split(area);

    draw_summary(f, chunks[0], m);
    draw_balance(f, chunks[1], m);
    draw_pane_hint(f, chunks[2], m);
}

fn draw_pane_hint(f: &mut Frame, area: Rect, m: &JsonlMatch) {
    let build_label = if m.party.is_some() {
        "party comp · builds · gear"
    } else {
        "class path · gear"
    };
    let mut lines = vec![
        Line::from(vec![
            Span::styled(
                "  p  ",
                Style::default()
                    .fg(Color::Black)
                    .bg(Color::Cyan)
                    .add_modifier(Modifier::BOLD),
            ),
            Span::raw(format!("  {build_label}")),
        ]),
        Line::from(vec![
            Span::styled(
                "  c  ",
                Style::default()
                    .fg(Color::Black)
                    .bg(Color::Yellow)
                    .add_modifier(Modifier::BOLD),
            ),
            Span::raw(if m.party.is_some() {
                "  fight log (re-runs the party)".to_string()
            } else {
                "  fight log (re-runs the match)".to_string()
            }),
        ]),
    ];
    if let Some(party) = m.party.as_ref() {
        let comp = party
            .iter()
            .map(|mem| {
                mem.class_root
                    .strip_suffix("-root")
                    .unwrap_or(&mem.class_root)
                    .to_string()
            })
            .collect::<Vec<_>>()
            .join(" + ");
        lines.push(Line::from(""));
        lines.push(Line::from(vec![
            Span::styled("  party  ", Style::default().fg(Color::DarkGray)),
            Span::raw(comp),
        ]));
    }
    let block = Block::default().borders(Borders::ALL).title(" Panes ");
    f.render_widget(Paragraph::new(lines).block(block), area);
}

/// `p` pane: party roster (or solo class path) + gear, given the full screen so
/// every member's build is readable.
fn draw_build_pane(f: &mut Frame, area: Rect, m: &JsonlMatch) {
    let chunks = Layout::default()
        .direction(Direction::Vertical)
        .constraints([Constraint::Length(5), Constraint::Min(0)])
        .split(area);

    draw_summary(f, chunks[0], m);

    let cols = Layout::default()
        .direction(Direction::Horizontal)
        .constraints([Constraint::Percentage(50), Constraint::Percentage(50)])
        .split(chunks[1]);
    match &m.party {
        Some(party) => draw_party(f, cols[0], party),
        None => draw_perks(f, cols[0], &m.perks),
    }
    let gear_title = if m.party.is_some() {
        " Gear (shared loadout) "
    } else {
        " Gear "
    };
    // Bots equip the best non-ultimate gear for their tier, so this is normally
    // populated; an empty list means no craftable gear exists at this tier at all.
    let empty_msg = if m.party.is_some() {
        "(none)\n\nNo craftable (non-ultimate) gear exists at this tier."
    } else {
        "(none)"
    };
    draw_gear(f, cols[1], &m.gear, gear_title, empty_msg);
}

/// `c` pane: the fight log, given the full screen.
fn draw_log_pane(f: &mut Frame, area: Rect, app: &App, m: &JsonlMatch) {
    let chunks = Layout::default()
        .direction(Direction::Vertical)
        .constraints([Constraint::Length(5), Constraint::Min(0)])
        .split(area);

    draw_summary(f, chunks[0], m);
    draw_fight_log(f, chunks[1], app);
}

fn draw_party(f: &mut Frame, area: Rect, party: &[crate::model::PartyMemberInfo]) {
    let outer = Block::default()
        .borders(Borders::ALL)
        .title(format!(" Party ({}) ", party.len()));
    let inner = outer.inner(area);
    f.render_widget(outer, area);

    if party.is_empty() {
        f.render_widget(Paragraph::new("(none)"), inner);
        return;
    }

    let rows = Layout::default()
        .direction(Direction::Vertical)
        .constraints(
            party
                .iter()
                .map(|_| Constraint::Ratio(1, party.len() as u32))
                .collect::<Vec<_>>(),
        )
        .split(inner);

    for (member, slot) in party.iter().zip(rows.iter()) {
        let cls = member
            .class_root
            .strip_suffix("-root")
            .unwrap_or(&member.class_root);
        let path = member
            .perks
            .iter()
            .map(|p| p.name.clone())
            .collect::<Vec<_>>()
            .join(" → ");
        let block = Block::default()
            .borders(Borders::ALL)
            .border_style(Style::default().fg(Color::Cyan))
            .title(Span::styled(
                format!(" {cls} "),
                Style::default().fg(Color::Cyan).add_modifier(Modifier::BOLD),
            ));
        let body = Paragraph::new(if path.is_empty() {
            cls.to_string()
        } else {
            path
        })
        .wrap(Wrap { trim: true })
        .style(Style::default().fg(Color::Gray))
        .block(block);
        f.render_widget(body, *slot);
    }
}

fn draw_balance(f: &mut Frame, area: Rect, m: &JsonlMatch) {
    let block = Block::default()
        .borders(Borders::ALL)
        .title(" Balance score ");
    let Some(b) = m.balance.as_ref() else {
        f.render_widget(Paragraph::new("no score").block(block), area);
        return;
    };

    let kind = if b.is_overlord { "overlord" } else { "boss" };
    let axis = |label: &str, danger: f64, weight: f64, note: String| {
        Line::from(vec![
            Span::raw(format!("  {label:<10} ")),
            Span::styled(
                format!("{danger:.2}"),
                Style::default().fg(danger_color(danger)),
            ),
            Span::raw(format!(" x{weight:.2} = {:.3}   ", danger * weight)),
            Span::styled(note, Style::default().fg(Color::DarkGray)),
        ])
    };

    let mut lines = vec![
        Line::from(vec![
            Span::styled(
                b.rating.label().to_uppercase(),
                Style::default()
                    .fg(rating_color(b.rating))
                    .add_modifier(Modifier::BOLD),
            ),
            Span::raw(format!(
                "   difficulty {:.3}   ·   {kind} target {:.0}–{:.0}s",
                b.difficulty, b.target_min_secs, b.target_max_secs
            )),
        ]),
        axis(
            "survival",
            b.survival_danger,
            b.weights.survival,
            format!("end HP {:.0}%", b.hp_fraction * 100.0),
        ),
        axis(
            "punish",
            b.punish_danger,
            b.weights.punish,
            format!("took {:.2}x maxHP (ref 1.75x)", b.dmg_ratio),
        ),
        axis(
            "attrition",
            b.attrition_danger,
            b.weights.attrition,
            format!("{:.0}s vs {:.0}s cap", b.seconds, b.target_max_secs),
        ),
        Line::from(format!(
            "  = {:.3} composite  →  {}",
            b.difficulty,
            b.rating.label()
        )),
    ];
    if b.outcome_gated {
        lines.push(Line::from(Span::styled(
            format!(
                "  outcome {} → forced TOO HARD (gate)",
                m.outcome.label()
            ),
            Style::default().fg(Color::Red),
        )));
    } else {
        lines.push(Line::from(Span::styled(
            "  bands  <.15 Too Easy · <.35 Easy · <.60 Balanced · <.85 Struggled · ≥.85 Can't Do",
            Style::default().fg(Color::DarkGray),
        )));
    }

    f.render_widget(Paragraph::new(lines).block(block), area);
}

fn danger_color(danger: f64) -> Color {
    if danger >= 0.85 {
        Color::Red
    } else if danger >= 0.6 {
        Color::Yellow
    } else if danger >= 0.35 {
        Color::Green
    } else {
        Color::Cyan
    }
}

fn outcome_color(outcome: Outcome) -> Color {
    match outcome {
        Outcome::BotDied => Color::Red,
        Outcome::Timeout => Color::Yellow,
        Outcome::Clear => Color::Green,
    }
}

fn draw_summary(f: &mut Frame, area: Rect, m: &JsonlMatch) {
    let secs = m.sim_duration_ms / 1000.0;
    let lines = vec![
        Line::from(Span::styled(
            m.build_id.clone(),
            Style::default().add_modifier(Modifier::BOLD),
        )),
        {
            let mut spans = vec![
                Span::raw(format!("{} T{}  ·  ", m.biome_group, m.content_tier)),
                Span::styled(
                    m.outcome.label(),
                    Style::default()
                        .fg(outcome_color(m.outcome))
                        .add_modifier(Modifier::BOLD),
                ),
                Span::raw(format!(
                    "  ·  {secs:.1}s ({} ticks x{})  ·  mobs {}",
                    m.ticks, m.time_scale, m.initial_mob_count
                )),
            ];
            if let (Some(deaths), Some(party)) = (m.party_deaths, m.party.as_ref()) {
                spans.push(Span::styled(
                    format!("  ·  deaths {}/{}", deaths, party.len()),
                    Style::default().fg(if deaths > 0 {
                        Color::Red
                    } else {
                        Color::Green
                    }),
                ));
            }
            Line::from(spans)
        },
        Line::from(format!(
            "dealt {:.0} (dps {:.1}) · taken {:.0} (in {:.1}) · hp {:.0}/{:.0} ({:.0}%)",
            m.damage_dealt,
            m.dps,
            m.damage_taken,
            m.incoming_dps,
            m.bot_hp_end,
            m.max_hp,
            m.hp_fraction * 100.0
        )),
    ];
    let block = Block::default()
        .borders(Borders::ALL)
        .title(" Build / Result ");
    f.render_widget(Paragraph::new(lines).block(block), area);
}

fn tier_label(tier: u32) -> &'static str {
    match tier {
        0 => "root",
        1 => "variant",
        2 => "range",
        3 => "path",
        _ => "node",
    }
}

fn draw_perks(f: &mut Frame, area: Rect, perks: &[PerkInfo]) {
    let outer = Block::default()
        .borders(Borders::ALL)
        .title(" Class Path ");
    let inner = outer.inner(area);
    f.render_widget(outer, area);

    if perks.is_empty() {
        f.render_widget(Paragraph::new("(none)"), inner);
        return;
    }

    let rows = Layout::default()
        .direction(Direction::Vertical)
        .constraints(
            perks
                .iter()
                .map(|_| Constraint::Ratio(1, perks.len() as u32))
                .collect::<Vec<_>>(),
        )
        .split(inner);

    for (perk, slot) in perks.iter().zip(rows.iter()) {
        let title = format!(" {} · {} ", perk.name, tier_label(perk.tier));
        let block = Block::default()
            .borders(Borders::ALL)
            .border_style(Style::default().fg(Color::Cyan))
            .title(Span::styled(
                title,
                Style::default()
                    .fg(Color::Cyan)
                    .add_modifier(Modifier::BOLD),
            ));
        let body = Paragraph::new(perk.description.clone())
            .wrap(Wrap { trim: true })
            .style(Style::default().fg(Color::Gray))
            .block(block);
        f.render_widget(body, *slot);
    }
}

fn fmt_num(v: f64) -> String {
    if (v.fract()).abs() < f64::EPSILON {
        format!("{}", v as i64)
    } else {
        let s = format!("{v:.2}");
        s.trim_end_matches('0').trim_end_matches('.').to_string()
    }
}

fn fmt_signed(v: f64) -> String {
    if v >= 0.0 {
        format!("+{}", fmt_num(v))
    } else {
        fmt_num(v)
    }
}

fn fmt_stats(stats: &std::collections::HashMap<String, f64>) -> String {
    let mut keys: Vec<&String> = stats.keys().collect();
    keys.sort();
    keys.iter()
        .map(|k| format!("{} {}", k, fmt_signed(stats[*k])))
        .collect::<Vec<_>>()
        .join(", ")
}

fn fmt_cost(cost: &std::collections::HashMap<String, f64>) -> String {
    let mut keys: Vec<&String> = cost.keys().collect();
    keys.sort();
    keys.iter()
        .map(|k| format!("{} {}", fmt_num(cost[*k]), k))
        .collect::<Vec<_>>()
        .join(", ")
}

fn upgrade_line(step: &UpgradeStepInfo) -> Line<'static> {
    let mut parts: Vec<String> = Vec::new();
    if !step.stats.is_empty() {
        parts.push(fmt_stats(&step.stats));
    }
    if !step.mechanic_effects.is_empty() {
        parts.push(fmt_stats(&step.mechanic_effects));
    }
    let gains = if parts.is_empty() {
        "—".to_string()
    } else {
        parts.join(", ")
    };
    let cost = if step.cost.is_empty() {
        String::new()
    } else {
        format!("  [{}]", fmt_cost(&step.cost))
    };
    Line::from(vec![
        Span::styled(
            format!("  +{} ", step.level),
            Style::default()
                .fg(Color::Yellow)
                .add_modifier(Modifier::BOLD),
        ),
        Span::styled(
            format!("(bLv{}) ", step.required_biome_level),
            Style::default().fg(Color::DarkGray),
        ),
        Span::raw(gains),
        Span::styled(cost, Style::default().fg(Color::Magenta)),
    ])
}

fn draw_gear(f: &mut Frame, area: Rect, gear: &[GearInfo], title: &str, empty_msg: &str) {
    let outer = Block::default()
        .borders(Borders::ALL)
        .title(title.to_string());
    let inner = outer.inner(area);
    f.render_widget(outer, area);

    if gear.is_empty() {
        let para = Paragraph::new(empty_msg)
            .style(Style::default().fg(Color::DarkGray))
            .wrap(Wrap { trim: true });
        f.render_widget(para, inner);
        return;
    }

    let rows = Layout::default()
        .direction(Direction::Vertical)
        .constraints(
            gear.iter()
                .map(|_| Constraint::Ratio(1, gear.len() as u32))
                .collect::<Vec<_>>(),
        )
        .split(inner);

    for (item, slot) in gear.iter().zip(rows.iter()) {
        let plus = if item.upgrade_level > 0 {
            format!(" +{}", item.upgrade_level)
        } else {
            String::new()
        };
        let title = format!(
            " {} · {}{} (T{}) ",
            item.slot, item.name, plus, item.tier
        );
        let block = Block::default()
            .borders(Borders::ALL)
            .border_style(Style::default().fg(Color::Green))
            .title(Span::styled(
                title,
                Style::default()
                    .fg(Color::Green)
                    .add_modifier(Modifier::BOLD),
            ));

        let mut lines: Vec<Line> = Vec::new();
        let base = fmt_stats(&item.stats);
        if !base.is_empty() {
            lines.push(Line::from(vec![
                Span::styled("stats: ", Style::default().fg(Color::DarkGray)),
                Span::raw(base),
            ]));
        }
        if !item.mechanic_effects.is_empty() {
            lines.push(Line::from(vec![
                Span::styled("mech:  ", Style::default().fg(Color::DarkGray)),
                Span::raw(fmt_stats(&item.mechanic_effects)),
            ]));
        }
        if item.upgrades.is_empty() {
            lines.push(Line::from(Span::styled(
                "no upgrade path",
                Style::default().fg(Color::DarkGray),
            )));
        } else {
            lines.push(Line::from(Span::styled(
                "upgrades:",
                Style::default().add_modifier(Modifier::BOLD),
            )));
            for step in &item.upgrades {
                lines.push(upgrade_line(step));
            }
        }

        let body = Paragraph::new(lines).wrap(Wrap { trim: true }).block(block);
        f.render_widget(body, *slot);
    }
}

fn draw_fight_log(f: &mut Frame, area: Rect, app: &App) {
    let title = " Fight log (representative re-run) ";
    match &app.detail {
        DetailState::LoadingLog => {
            let block = Block::default().borders(Borders::ALL).title(title);
            let para = Paragraph::new("loading fight (re-running)…")
                .style(Style::default().fg(Color::Yellow));
            f.render_widget(para.block(block), area);
        }
        DetailState::LogError(msg) => {
            let block = Block::default().borders(Borders::ALL).title(title);
            let para = Paragraph::new(msg.clone()).style(Style::default().fg(Color::Red));
            f.render_widget(para.block(block), area);
        }
        DetailState::Loaded(lines) => {
            let visible = area.height.saturating_sub(2) as usize;
            let log_lines: Vec<Line> = lines
                .iter()
                .skip(app.log_scroll)
                .take(visible)
                .map(|l| {
                    let secs = l.time_ms / 1000.0;
                    let detail = l
                        .detail
                        .as_ref()
                        .map(|d| format!("   {d}"))
                        .unwrap_or_default();
                    Line::from(format!("  {secs:5.1}s  {}{}", l.headline, detail))
                })
                .collect();
            let block = Block::default().borders(Borders::ALL).title(format!(
                "{title} [scroll j/k · {} lines]",
                lines.len()
            ));
            f.render_widget(Paragraph::new(log_lines).block(block), area);
        }
        DetailState::None => {
            let block = Block::default().borders(Borders::ALL).title(title);
            f.render_widget(Paragraph::new("(press c to load)").block(block), area);
        }
    }
}
