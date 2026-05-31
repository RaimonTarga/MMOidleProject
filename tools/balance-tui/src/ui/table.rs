use crate::app::{App, RunPhase, SortMode};
use crate::store::{aggregate_by_build, match_row_flag, rollup_flag, summarize_party};
use crate::ui::{rating_color, short_build};
use ratatui::layout::{Constraint, Rect};
use ratatui::style::{Color, Modifier, Style};
use crate::model::{JsonlMatch, Outcome};
use ratatui::widgets::{Block, Borders, Cell, Paragraph, Row, Table};
use ratatui::Frame;

/// Label for the build column: a build id (solo) or a party makeup (overlord).
fn build_cell_text(m: &JsonlMatch) -> String {
    match &m.party {
        Some(party) => summarize_party(party),
        None => short_build(&m.build_id, 18),
    }
}

fn filtered_owned(app: &App) -> Vec<crate::model::JsonlMatch> {
    app.filtered_match_refs()
        .into_iter()
        .map(|i| app.store.all[i].clone())
        .collect()
}

fn outcome_color(outcome: Outcome) -> Color {
    match outcome {
        Outcome::BotDied => Color::Red,
        Outcome::Timeout => Color::Yellow,
        Outcome::Clear => Color::Reset,
    }
}

fn row_highlight() -> Style {
    Style::default()
        .bg(Color::DarkGray)
        .add_modifier(Modifier::BOLD)
}

pub fn draw_match_table(f: &mut Frame, area: Rect, app: &mut App) {
    let rows_data = app.display_matches();
    let sort = app.sort;
    let phase = app.phase;
    let selected = app.selected;

    let header = Row::new(vec![
        "build", "class", "biome", "T", "outcome", "balance", "dps", "hp%", "time",
    ])
    .style(Style::default().add_modifier(Modifier::BOLD));

    let table_rows: Vec<Row> = rows_data
        .iter()
        .map(|m| {
            let flag = match_row_flag(m).map(|c| format!(" {c}")).unwrap_or_default();
            let secs = m.sim_duration_ms / 1000.0;
            let outcome_cell = Cell::from(format!("{}{}", m.outcome.label(), flag))
                .style(Style::default().fg(outcome_color(m.outcome)));
            let balance_cell = match &m.balance {
                Some(b) => Cell::from(b.rating.label())
                    .style(Style::default().fg(rating_color(b.rating))),
                None => Cell::from("—"),
            };
            Row::new(vec![
                Cell::from(build_cell_text(m)),
                Cell::from(
                    m.class_root
                        .strip_suffix("-root")
                        .unwrap_or(&m.class_root)
                        .to_string(),
                ),
                Cell::from(m.biome_group.clone()),
                Cell::from(m.content_tier.to_string()),
                outcome_cell,
                balance_cell,
                Cell::from(format!("{:.0}", m.dps)),
                Cell::from(format!("{:.0}%", m.hp_fraction * 100.0)),
                Cell::from(format!("{secs:.1}s")),
            ])
        })
        .collect();

    let title = format!(" MATCHES  sort: {sort:?} ");
    let table = Table::new(
        table_rows,
        [
            Constraint::Percentage(24),
            Constraint::Percentage(11),
            Constraint::Percentage(11),
            Constraint::Length(3),
            Constraint::Length(9),
            Constraint::Length(9),
            Constraint::Length(6),
            Constraint::Length(5),
            Constraint::Length(7),
        ],
    )
    .header(header)
    .row_highlight_style(row_highlight())
    .block(Block::default().borders(Borders::ALL).title(title));

    let sel = if rows_data.is_empty() {
        None
    } else {
        Some(selected.min(rows_data.len() - 1))
    };
    app.match_table_state.select(sel);
    f.render_stateful_widget(table, area, &mut app.match_table_state);

    if phase == RunPhase::Running {
        let hint_area = Rect {
            y: area.y + area.height.saturating_sub(2),
            height: 1,
            ..area
        };
        let hint = Paragraph::new(" collecting results…")
            .style(Style::default().fg(Color::DarkGray));
        f.render_widget(hint, hint_area);
    }
}

pub fn draw_rollup_table(f: &mut Frame, area: Rect, app: &mut App) {
    let rows_data = filtered_owned(app);
    let mut rollups = aggregate_by_build(&rows_data);
    match app.sort {
        SortMode::ClearRate => rollups.sort_by(|a, b| {
            let ca = a.clears as f64 / a.matches.max(1) as f64;
            let cb = b.clears as f64 / b.matches.max(1) as f64;
            cb.partial_cmp(&ca).unwrap_or(std::cmp::Ordering::Equal)
        }),
        SortMode::HpFraction => rollups.sort_by(|a, b| {
            b.avg_hp_fraction
                .partial_cmp(&a.avg_hp_fraction)
                .unwrap_or(std::cmp::Ordering::Equal)
        }),
        SortMode::Dps | SortMode::BuildId | SortMode::Balance => {
            rollups.sort_by(|a, b| a.build_id.cmp(&b.build_id))
        }
    }
    let selected = app.selected;

    let header = Row::new(vec![
        "build", "class", "runs", "clear%", "avg hp%", "died", "to", "flag",
    ])
    .style(Style::default().add_modifier(Modifier::BOLD));

    let table_rows: Vec<Row> = rollups
        .iter()
        .map(|r| {
            let clear_pct = (r.clears as f64 / r.matches.max(1) as f64) * 100.0;
            let flag = rollup_flag(r).unwrap_or("");
            Row::new(vec![
                short_build(&r.build_id, 18),
                r.class_root
                    .strip_suffix("-root")
                    .unwrap_or(&r.class_root)
                    .to_string(),
                r.matches.to_string(),
                format!("{clear_pct:.0}%"),
                format!("{:.0}%", r.avg_hp_fraction * 100.0),
                r.deaths.to_string(),
                r.timeouts.to_string(),
                flag.to_string(),
            ])
        })
        .collect();

    let table = Table::new(
        table_rows,
        [
            Constraint::Percentage(30),
            Constraint::Percentage(12),
            Constraint::Length(5),
            Constraint::Length(7),
            Constraint::Length(8),
            Constraint::Length(5),
            Constraint::Length(4),
            Constraint::Length(10),
        ],
    )
    .header(header)
    .row_highlight_style(row_highlight())
    .block(
        Block::default()
            .borders(Borders::ALL)
            .title(" BUILD ROLLUP "),
    );

    let sel = if rollups.is_empty() {
        None
    } else {
        Some(selected.min(rollups.len() - 1))
    };
    app.rollup_table_state.select(sel);
    f.render_stateful_widget(table, area, &mut app.rollup_table_state);
}
