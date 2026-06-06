mod detail;
mod filters;
mod histogram;
mod setup;
mod table;

use crate::app::{App, ExpectedPreview, RunPhase, ViewMode};
use crate::model::BalanceRating;
use ratatui::layout::{Constraint, Direction, Layout, Rect};
use ratatui::style::{Color, Modifier, Style};
use ratatui::widgets::{Block, Borders, Paragraph};
use ratatui::Frame;

/// Blue → cyan → green → yellow → red gradient from easiest to hardest.
pub fn rating_color(rating: BalanceRating) -> Color {
    match rating {
        BalanceRating::TooEasy => Color::Blue,
        BalanceRating::Easy => Color::Cyan,
        BalanceRating::Balanced => Color::Green,
        BalanceRating::Hard => Color::Yellow,
        BalanceRating::TooHard => Color::Red,
    }
}

pub fn draw(f: &mut Frame, app: &mut App) {
    let area = f.area();
    let chunks = Layout::default()
        .direction(Direction::Vertical)
        .constraints([
            Constraint::Length(3),
            Constraint::Min(0),
            Constraint::Length(2),
        ])
        .split(area);

    draw_header(f, chunks[0], app);

    if app.phase == RunPhase::Idle {
        setup::draw_setup(f, chunks[1], app);
    } else if app.view == ViewMode::Detail {
        detail::draw_detail(f, chunks[1], app);
    } else {
        let inner = Layout::default()
            .direction(Direction::Horizontal)
            .constraints([Constraint::Length(28), Constraint::Min(0)])
            .split(chunks[1]);
        filters::draw_filters(f, inner[0], app);
        match app.view {
            ViewMode::Histogram => histogram::draw_histogram(f, inner[1], app),
            ViewMode::Rollup => table::draw_rollup_table(f, inner[1], app),
            _ => table::draw_match_table(f, inner[1], app),
        }
    }

    draw_footer(f, chunks[2], app);

    // Picker overlay sits above everything on the setup screen.
    if app.phase == RunPhase::Idle {
        setup::draw_picker_overlay(f, area, app);
    }
}

pub fn expected_label(app: &App) -> String {
    match app.expected_preview {
        ExpectedPreview::Computing => "computing…".to_string(),
        ExpectedPreview::Known(n) => n.to_string(),
        ExpectedPreview::Error => "error".to_string(),
    }
}

fn draw_header(f: &mut Frame, area: Rect, app: &App) {
    let line = if app.phase == RunPhase::Idle {
        format!(
            "Configure run · expected matches: {} · scale x{} · Enter on “Run ▶” to launch",
            expected_label(app),
            app.setup.time_scale
        )
    } else {
        let (clears, deaths, timeouts) = app.store.tallies();
        let spinner = match app.phase {
            RunPhase::Running => "⟳ ",
            _ => "",
        };
        let phase_label = match app.phase {
            RunPhase::Running => "Running",
            RunPhase::Done => "Done",
            RunPhase::Failed => "Failed",
            RunPhase::Idle => "Idle",
        };
        let progress = if app.expected > 0 {
            format!("{}/{}", app.collected, app.expected)
        } else {
            app.collected.to_string()
        };
        let wall = match (app.started_at, app.finished_at) {
            (Some(start), Some(end)) => {
                format!(" · wall {:.1}s", end.duration_since(start).as_secs_f64())
            }
            _ => String::new(),
        };
        let err = app
            .fail_message
            .as_ref()
            .map(|m| format!(" · ERR: {m}"))
            .unwrap_or_default();
        format!(
            "{spinner}{phase_label} balance bench · {progress} matches · clears {clears} · deaths {deaths} · timeouts {timeouts} · scale x{}{wall}{err}",
            app.setup.time_scale
        )
    };
    let block = Block::default()
        .borders(Borders::ALL)
        .title(" Balance Bench TUI ");
    let para = Paragraph::new(line).block(block);
    f.render_widget(para, area);
}

fn draw_footer(f: &mut Frame, area: Rect, app: &App) {
    let help = if app.phase == RunPhase::Idle {
        if app.setup.picker.is_some() {
            "up/down move  Enter select  esc cancel"
        } else {
            "up/down field  left/right adjust  space toggle  Enter activate/run  q quit"
        }
    } else if app.view == ViewMode::Detail {
        "esc back  p party/build  c fight log  j/k scroll log"
    } else {
        "q quit  c configure  m match/rollup  / search  o outcome  h histogram  Enter detail  s sort  esc setup"
    };
    let parse_err = if app.store.parse_errors > 0 {
        format!(" · parse errs {}", app.store.parse_errors)
    } else {
        String::new()
    };
    let para = Paragraph::new(format!("{help}{parse_err}")).style(Style::default().fg(Color::DarkGray));
    f.render_widget(para, area);
}

/// Centered rect `pct_x` × `pct_y` of `area`, for popups.
pub fn centered_rect(pct_x: u16, pct_y: u16, area: Rect) -> Rect {
    let vertical = Layout::default()
        .direction(Direction::Vertical)
        .constraints([
            Constraint::Percentage((100 - pct_y) / 2),
            Constraint::Percentage(pct_y),
            Constraint::Percentage((100 - pct_y) / 2),
        ])
        .split(area);
    Layout::default()
        .direction(Direction::Horizontal)
        .constraints([
            Constraint::Percentage((100 - pct_x) / 2),
            Constraint::Percentage(pct_x),
            Constraint::Percentage((100 - pct_x) / 2),
        ])
        .split(vertical[1])[1]
}

pub fn selected_style(selected: bool) -> Style {
    if selected {
        Style::default()
            .bg(Color::DarkGray)
            .add_modifier(Modifier::BOLD)
    } else {
        Style::default()
    }
}

pub fn short_build(id: &str, max: usize) -> String {
    if id.len() <= max {
        id.to_string()
    } else {
        format!("{}…", &id[..max.saturating_sub(1)])
    }
}
