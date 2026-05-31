use crate::app::App;
use crate::store::{
    class_in_party_performance, class_performance, party_performance, perf_baseline, perf_flag,
    GroupPerf, PerfFlag,
};
use crate::ui::{selected_style, short_build};
use ratatui::layout::Rect;
use ratatui::style::{Color, Modifier, Style};
use ratatui::text::{Line, Span};
use ratatui::widgets::{Block, Borders, Paragraph};
use ratatui::Frame;

/// Diverging-bar width. Odd so there is an exact center column for the mean axis.
const BAR_W: usize = 31;
/// Fixed label column so bars line up across every group.
const LABEL_W: usize = 16;

fn flag_color(flag: PerfFlag) -> Color {
    match flag {
        PerfFlag::Overpowered => Color::Red,
        PerfFlag::Underpowered => Color::Blue,
        PerfFlag::Fair => Color::Green,
    }
}

fn flag_label(flag: PerfFlag) -> &'static str {
    match flag {
        PerfFlag::Overpowered => "OP nerf",
        PerfFlag::Underpowered => "UP buff",
        PerfFlag::Fair => "",
    }
}

/// A bar that grows right of the center axis when a group is above the baseline
/// (overpowered) and left of it when below (underpowered). The further from
/// center, the bigger the outlier.
fn bar_spans(dev: f64, max_dev: f64, color: Color) -> Vec<Span<'static>> {
    let half = BAR_W / 2;
    let len = (((dev.abs() / max_dev) * half as f64).round() as usize).min(half);
    let (left, right) = if dev >= 0.0 { (0usize, len) } else { (len, 0usize) };

    let left_str: String = std::iter::repeat(' ')
        .take(half - left)
        .chain(std::iter::repeat('█').take(left))
        .collect();
    let right_str: String = std::iter::repeat('█')
        .take(right)
        .chain(std::iter::repeat(' ').take(half - right))
        .collect();

    vec![
        Span::styled(left_str, Style::default().fg(color)),
        Span::styled("│".to_string(), Style::default().fg(Color::DarkGray)),
        Span::styled(right_str, Style::default().fg(color)),
    ]
}

/// One titled block of bars (a class set, party-comp set, …). `selected` adds a
/// cosmetic highlight to that row; pass `None` for an informational section.
fn section_lines(
    title: &str,
    subtitle: &str,
    groups: &[GroupPerf],
    selected: Option<usize>,
) -> Vec<Line<'static>> {
    let mut lines: Vec<Line<'static>> = Vec::new();
    lines.push(Line::from(Span::styled(
        title.to_string(),
        Style::default().fg(Color::White).add_modifier(Modifier::BOLD),
    )));
    if groups.is_empty() {
        lines.push(Line::from(Span::styled(
            "  (no matching data)".to_string(),
            Style::default().fg(Color::DarkGray),
        )));
        return lines;
    }

    let (mean, std) = perf_baseline(groups);
    let max_dev = groups
        .iter()
        .filter(|g| g.n > 0)
        .map(|g| (g.mean_power - mean).abs())
        .fold(0.0_f64, f64::max)
        .max(1e-6);

    lines.push(Line::from(Span::styled(
        format!("  {subtitle}   baseline {:.0}%", mean * 100.0),
        Style::default().fg(Color::DarkGray),
    )));

    for (i, g) in groups.iter().enumerate() {
        let label = short_build(&g.label, LABEL_W);

        // Seeded class with no sampled parties — show it so the roster is always
        // complete, but with no bar and excluded from the outlier math above.
        if g.n == 0 {
            lines.push(Line::from(vec![
                Span::styled(
                    format!("{label:<LABEL_W$} "),
                    selected_style(selected == Some(i)).fg(Color::DarkGray),
                ),
                Span::styled(
                    "— no sampled parties —".to_string(),
                    Style::default().fg(Color::DarkGray),
                ),
            ]));
            continue;
        }

        let flag = perf_flag(g.mean_power, mean, std);
        let color = flag_color(flag);
        let delta = (g.mean_power - mean) * 100.0;

        let label_span = Span::styled(
            format!("{label:<LABEL_W$} "),
            selected_style(selected == Some(i)).fg(color),
        );

        let stats = Span::styled(
            format!(
                " {:>5.1}%  Δ{:+5.1}  clr{:>3.0}%  hp{:>3.0}%  n{:<5} {}",
                g.mean_power * 100.0,
                delta,
                g.clear_rate * 100.0,
                g.avg_hp * 100.0,
                g.n,
                flag_label(flag),
            ),
            Style::default().fg(color),
        );

        let mut spans = vec![label_span];
        spans.extend(bar_spans(g.mean_power - mean, max_dev, color));
        spans.push(stats);
        lines.push(Line::from(spans));
    }
    lines
}

pub fn draw_histogram(f: &mut Frame, area: Rect, app: &App) {
    let rows_data: Vec<_> = app
        .filtered_match_refs()
        .into_iter()
        .map(|i| app.store.all[i].clone())
        .collect();

    // Overlord runs carry a resolved party roster; solo boss runs do not.
    let is_party = rows_data.iter().any(|m| m.party.is_some());

    let mut lines: Vec<Line<'static>> = vec![
        Line::from(Span::styled(
            "Relative power vs the run's baseline — bars right = overpowered, left = underpowered."
                .to_string(),
            Style::default().fg(Color::Gray),
        )),
        Line::from(Span::styled(
            "Flagged outliers (±1σ) are the classes/comps most in need of tuning.".to_string(),
            Style::default().fg(Color::DarkGray),
        )),
        Line::from(""),
    ];

    if is_party {
        let comps = party_performance(&rows_data);
        lines.extend(section_lines(
            "PARTY COMPS",
            "which 4-class teams steamroll their content",
            &comps,
            Some(app.selected),
        ));
        lines.push(Line::from(""));
        let classes = class_in_party_performance(&rows_data);
        lines.extend(section_lines(
            "CLASS IN PARTY",
            "avg power of every party that includes this class",
            &classes,
            None,
        ));
    } else {
        let classes = class_performance(&rows_data);
        lines.extend(section_lines(
            "CLASS POWER",
            "how each class fares relative to the others",
            &classes,
            Some(app.selected),
        ));
    }

    let title = if is_party {
        " Histogram · party balance "
    } else {
        " Histogram · class balance "
    };
    let block = Block::default().borders(Borders::ALL).title(title);
    let para = Paragraph::new(lines).block(block);
    f.render_widget(para, area);
}
