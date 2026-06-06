use crate::app::App;
use crate::model::Outcome;
use ratatui::layout::Rect;
use ratatui::style::{Color, Style};
use ratatui::text::{Line, Span};
use ratatui::widgets::{Block, Borders, Paragraph};
use ratatui::Frame;
use std::collections::BTreeSet;

pub fn draw_filters(f: &mut Frame, area: Rect, app: &App) {
    let mut lines: Vec<Line> = vec![Line::from(Span::styled(
        "FILTERS",
        Style::default().add_modifier(ratatui::style::Modifier::BOLD),
    ))];
    lines.push(Line::from(""));
    lines.push(Line::from("Tier"));

    let mut tiers: BTreeSet<u32> = BTreeSet::new();
    for m in &app.store.all {
        tiers.insert(m.content_tier);
    }
    for tier in tiers {
        let on = app.store.filters.tiers.is_empty() || app.store.filters.tiers.contains(&tier);
        lines.push(Line::from(format!(
            " [{}] {}",
            if on { 'x' } else { ' ' },
            tier
        )));
    }

    lines.push(Line::from(""));
    lines.push(Line::from("Biome"));
    let mut biomes: BTreeSet<String> = BTreeSet::new();
    for m in &app.store.all {
        biomes.insert(m.biome_group.clone());
    }
    for biome in biomes {
        let on =
            app.store.filters.biomes.is_empty() || app.store.filters.biomes.contains(&biome);
        lines.push(Line::from(format!(
            " [{}] {}",
            if on { 'x' } else { ' ' },
            biome
        )));
    }

    lines.push(Line::from(""));
    lines.push(Line::from("Class"));
    let mut classes: BTreeSet<String> = BTreeSet::new();
    for m in &app.store.all {
        classes.insert(m.class_root.clone());
    }
    for class in classes {
        let on = app.store.filters.class_roots.is_empty()
            || app.store.filters.class_roots.contains(&class);
        let short = class.strip_suffix("-root").unwrap_or(&class);
        lines.push(Line::from(format!(
            " [{}] {}",
            if on { 'x' } else { ' ' },
            short
        )));
    }

    lines.push(Line::from(""));
    lines.push(Line::from(vec![
        Span::raw("Outcome  "),
        Span::styled(
            format!("(o: {})", app.outcome_filter_label()),
            Style::default().fg(Color::Cyan),
        ),
    ]));
    for (outcome, label) in [
        (Outcome::Clear, "clear"),
        (Outcome::BotDied, "died"),
        (Outcome::Timeout, "timeout"),
    ] {
        let on = app.store.filters.outcomes.is_empty()
            || app.store.filters.outcomes.contains(&outcome);
        lines.push(Line::from(format!(
            " [{}] {}",
            if on { 'x' } else { ' ' },
            label
        )));
    }

    if !app.store.filters.search.is_empty() {
        lines.push(Line::from(""));
        lines.push(Line::from(Span::styled(
            format!("search: {}", app.store.filters.search),
            Style::default().fg(Color::Cyan),
        )));
    }

    let block = Block::default().borders(Borders::ALL).title(" Filters ");
    let para = Paragraph::new(lines).block(block);
    f.render_widget(para, area);
}
