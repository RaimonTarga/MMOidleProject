mod app;
mod model;
mod runner;
mod store;
mod ui;

use app::{App, RunPhase, SetupAction, ViewMode};
use anyhow::Result;
use crossterm::event::{self, Event, KeyCode, KeyEventKind};
use ratatui::backend::CrosstermBackend;
use ratatui::Terminal;
use std::io::{self, stdout};
use std::time::Duration;
use tokio::runtime::Runtime;

fn main() -> Result<()> {
    let rt = Runtime::new()?;
    let mut app = App::new();

    enable_raw_mode()?;
    let mut terminal = Terminal::new(CrosstermBackend::new(stdout()))?;
    terminal.clear()?;

    let tick_rate = Duration::from_millis(250);
    let mut last_tick = std::time::Instant::now();
    let mut should_quit = false;

    while !should_quit {
        app.drain_runner();
        app.drain_dry_run();
        app.drain_detail();
        if app.dry_run_due() {
            app.begin_dry_run(&rt);
        }
        app.clamp_selection();

        terminal.draw(|f| ui::draw(f, &mut app))?;

        let timeout = tick_rate
            .checked_sub(last_tick.elapsed())
            .unwrap_or(Duration::ZERO);
        if event::poll(timeout)? {
            if let Event::Key(key) = event::read()? {
                if key.kind == KeyEventKind::Press {
                    should_quit = handle_key(&mut app, key.code, &rt);
                }
            }
        }
        if last_tick.elapsed() >= tick_rate {
            last_tick = std::time::Instant::now();
        }
    }

    disable_raw_mode()?;
    terminal.show_cursor()?;
    Ok(())
}

fn handle_key(app: &mut App, code: KeyCode, rt: &Runtime) -> bool {
    if app.phase == RunPhase::Idle {
        return handle_setup_key(app, code, rt);
    }
    handle_results_key(app, code, rt)
}

fn handle_setup_key(app: &mut App, code: KeyCode, rt: &Runtime) -> bool {
    if app.setup.picker.is_some() {
        match code {
            KeyCode::Up | KeyCode::Char('k') => app.picker_move(-1),
            KeyCode::Down | KeyCode::Char('j') => app.picker_move(1),
            KeyCode::Enter => app.picker_confirm(),
            KeyCode::Esc => app.picker_cancel(),
            _ => {}
        }
        return false;
    }

    match code {
        KeyCode::Char('q') | KeyCode::Esc => return true,
        KeyCode::Up | KeyCode::Char('k') => app.setup_move_field(-1),
        KeyCode::Down | KeyCode::Char('j') => app.setup_move_field(1),
        KeyCode::Left | KeyCode::Char('h') => app.setup_adjust(-1),
        KeyCode::Right | KeyCode::Char('l') => app.setup_adjust(1),
        KeyCode::Char(' ') => app.setup_toggle(),
        KeyCode::Enter => {
            if app.setup_activate() == SetupAction::Run {
                if app.can_run() {
                    let _ = rt.block_on(app.start_run());
                } else {
                    app.fail_message =
                        Some("Select at least one tier with matches before running.".into());
                }
            }
        }
        _ => {}
    }
    false
}

fn handle_results_key(app: &mut App, code: KeyCode, rt: &Runtime) -> bool {
    match code {
        KeyCode::Char('q') => return true,
        KeyCode::Esc => {
            if app.view == ViewMode::Detail {
                app.close_detail();
            } else if app.phase != RunPhase::Running {
                app.back_to_setup();
            }
        }
        KeyCode::Char('c') => {
            if app.view == ViewMode::Detail {
                app.toggle_log_pane(rt);
            } else if app.phase != RunPhase::Running {
                app.back_to_setup();
            }
        }
        KeyCode::Char('p') => {
            if app.view == ViewMode::Detail {
                app.toggle_build_pane();
            }
        }
        KeyCode::Char('m') => {
            if app.view != ViewMode::Detail {
                app.view = match app.view {
                    ViewMode::Rollup => ViewMode::MatchTable,
                    _ => ViewMode::Rollup,
                };
                app.clamp_selection();
            }
        }
        KeyCode::Char('h') => {
            if app.view != ViewMode::Detail {
                app.view = if app.view == ViewMode::Histogram {
                    ViewMode::MatchTable
                } else {
                    ViewMode::Histogram
                };
                app.selected = 0;
                app.clamp_selection();
            }
        }
        KeyCode::Char('s') => app.cycle_sort(),
        KeyCode::Char('/') => app.cycle_search(),
        KeyCode::Char('o') => {
            if app.view != ViewMode::Detail {
                app.cycle_outcome_filter();
            }
        }
        KeyCode::Enter => {
            if app.view != ViewMode::Detail && app.phase != RunPhase::Running {
                app.open_detail();
            }
        }
        KeyCode::Up | KeyCode::Char('k') => {
            if app.view == ViewMode::Detail {
                if let app::DetailState::Loaded(_) = &app.detail {
                    app.log_scroll = app.log_scroll.saturating_sub(1);
                }
            } else if app.selected > 0 {
                app.selected -= 1;
            }
        }
        KeyCode::Down | KeyCode::Char('j') => {
            if app.view == ViewMode::Detail {
                app.log_scroll = app.log_scroll.saturating_add(1);
            } else {
                app.selected += 1;
                app.clamp_selection();
            }
        }
        _ => {}
    }
    false
}

fn enable_raw_mode() -> Result<()> {
    crossterm::terminal::enable_raw_mode()?;
    crossterm::execute!(
        io::stdout(),
        crossterm::terminal::EnterAlternateScreen,
        crossterm::event::DisableMouseCapture
    )?;
    Ok(())
}

fn disable_raw_mode() -> Result<()> {
    crossterm::execute!(
        io::stdout(),
        crossterm::event::DisableMouseCapture,
        crossterm::terminal::LeaveAlternateScreen
    )?;
    crossterm::terminal::disable_raw_mode()?;
    Ok(())
}
