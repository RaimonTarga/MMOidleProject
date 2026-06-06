use crate::app::{App, ExpectedPreview, SetupField, ALL_SENTINEL};
use crate::model::{BenchMode, OVERLORD_PARTY_SIZE};
use crate::ui::{centered_rect, expected_label};
use ratatui::layout::Rect;
use ratatui::style::{Color, Modifier, Style};
use ratatui::text::{Line, Span};
use ratatui::widgets::{Block, Borders, Clear, List, ListItem, ListState, Paragraph};
use ratatui::Frame;

const LABEL_WIDTH: usize = 13;

fn label(field: SetupField) -> &'static str {
    match field {
        SetupField::Mode => "Mode",
        SetupField::Tiers => "Tiers",
        SetupField::Biome => "Biome",
        SetupField::Class => "Class",
        SetupField::TimeScale => "Time scale",
        SetupField::MaxSeconds => "Max seconds",
        SetupField::Single => "Single",
        SetupField::AllPaths => "All paths",
        SetupField::Sample => "Sample",
        SetupField::Threads => "Threads",
        SetupField::Run => "Run",
    }
}

fn class_display(value: &Option<String>) -> String {
    match value {
        Some(v) => v.strip_suffix("-root").unwrap_or(v).to_string(),
        None => ALL_SENTINEL.to_string(),
    }
}

pub fn draw_setup(f: &mut Frame, area: Rect, app: &App) {
    let s = &app.setup;
    let focused = s.focused();
    let mut lines: Vec<Line> = Vec::new();

    for field in s.fields() {
        let is_focused = field == focused;
        let marker = if is_focused { "› " } else { "  " };
        let lbl = format!("{marker}{:<width$}: ", label(field), width = LABEL_WIDTH);

        let mut spans: Vec<Span> = vec![Span::styled(
            lbl,
            if is_focused {
                Style::default().add_modifier(Modifier::BOLD).fg(Color::Cyan)
            } else {
                Style::default().fg(Color::Gray)
            },
        )];

        match field {
            SetupField::Mode => {
                spans.push(Span::raw(format!("‹ {} ›", s.mode.label())));
                if s.mode == BenchMode::Overlord {
                    spans.push(Span::styled(
                        format!(
                            "   {OVERLORD_PARTY_SIZE}-bot party · every party of every build",
                        ),
                        Style::default().fg(Color::DarkGray),
                    ));
                }
            }
            SetupField::Tiers => {
                for tier in 0u32..5 {
                    let on = s.tiers[tier as usize];
                    let cell = format!("[{}]{} ", if on { 'x' } else { ' ' }, tier);
                    let highlight = is_focused && s.tier_cursor == tier as usize;
                    spans.push(Span::styled(
                        cell,
                        if highlight {
                            Style::default()
                                .bg(Color::DarkGray)
                                .add_modifier(Modifier::BOLD)
                        } else if on {
                            Style::default().fg(Color::Green)
                        } else {
                            Style::default().fg(Color::DarkGray)
                        },
                    ));
                }
            }
            SetupField::Biome => {
                let v = s.biome.clone().unwrap_or_else(|| ALL_SENTINEL.to_string());
                spans.push(Span::raw(format!("‹ {v} ›   (Enter to pick)")));
            }
            SetupField::Class => {
                let v = class_display(&s.class);
                spans.push(Span::raw(format!("‹ {v} ›   (Enter to pick)")));
            }
            SetupField::TimeScale => {
                spans.push(Span::raw(format!("‹ x{} ›", s.time_scale)));
            }
            SetupField::MaxSeconds => {
                spans.push(Span::raw(format!("‹ {}s ›", s.max_seconds)));
            }
            SetupField::Single => {
                spans.push(Span::raw(format!(
                    "[{}] {}",
                    if s.single { 'x' } else { ' ' },
                    if s.single { "one match only" } else { "full matrix" }
                )));
            }
            SetupField::AllPaths => {
                spans.push(Span::raw(format!(
                    "[{}] {}",
                    if s.all_paths { 'x' } else { ' ' },
                    if s.all_paths {
                        "every perk combo (full T3 depth)"
                    } else {
                        "realistic depth (tier-1 cap)"
                    }
                )));
            }
            SetupField::Sample => {
                let n = s.sample_size();
                if n == 0 {
                    spans.push(Span::raw("‹ full ›"));
                    spans.push(Span::styled(
                        "   every distinct-class party".to_string(),
                        Style::default().fg(Color::DarkGray),
                    ));
                } else {
                    spans.push(Span::raw(format!("‹ {n} random ›")));
                    spans.push(Span::styled(
                        "   stratified by class, optimized builds first".to_string(),
                        Style::default().fg(Color::DarkGray),
                    ));
                }
            }
            SetupField::Threads => {
                spans.push(Span::raw(format!("‹ {} ›", s.concurrency)));
                spans.push(Span::styled(
                    "   parallel harness processes (matrix shards)".to_string(),
                    Style::default().fg(Color::DarkGray),
                ));
            }
            SetupField::Run => {
                let runnable = app.can_run();
                let text = if runnable {
                    format!("▶  run {} matches", expected_label(app))
                } else {
                    "▶  (select a tier with matches)".to_string()
                };
                spans.push(Span::styled(
                    text,
                    if runnable {
                        Style::default().fg(Color::Green).add_modifier(Modifier::BOLD)
                    } else {
                        Style::default().fg(Color::DarkGray)
                    },
                ));
            }
        }

        lines.push(Line::from(spans));
        lines.push(Line::from(""));
    }

    lines.push(Line::from(Span::styled(
        format!("Expected matches: {}", expected_label(app)),
        match app.expected_preview {
            ExpectedPreview::Known(0) => Style::default().fg(Color::Red),
            ExpectedPreview::Error => Style::default().fg(Color::Red),
            _ => Style::default().fg(Color::Yellow),
        },
    )));

    if let Some(msg) = &app.fail_message {
        lines.push(Line::from(Span::styled(
            msg.clone(),
            Style::default().fg(Color::Red),
        )));
    }

    let block = Block::default()
        .borders(Borders::ALL)
        .title(" Configure run ");
    f.render_widget(Paragraph::new(lines).block(block), area);
}

pub fn draw_picker_overlay(f: &mut Frame, area: Rect, app: &App) {
    let Some(picker) = &app.setup.picker else {
        return;
    };
    let popup = centered_rect(40, 70, area);
    f.render_widget(Clear, popup);

    let title = match picker.field {
        SetupField::Class => " Select class ",
        _ => " Select biome ",
    };

    let items: Vec<ListItem> = picker
        .options
        .iter()
        .map(|opt| {
            let display = if picker.field == SetupField::Class && opt != ALL_SENTINEL {
                opt.strip_suffix("-root").unwrap_or(opt).to_string()
            } else {
                opt.clone()
            };
            ListItem::new(display)
        })
        .collect();

    let list = List::new(items)
        .block(Block::default().borders(Borders::ALL).title(title))
        .highlight_style(
            Style::default()
                .bg(Color::Cyan)
                .fg(Color::Black)
                .add_modifier(Modifier::BOLD),
        )
        .highlight_symbol("» ");

    let mut state = ListState::default();
    state.select(Some(picker.cursor));
    f.render_stateful_widget(list, popup, &mut state);
}
