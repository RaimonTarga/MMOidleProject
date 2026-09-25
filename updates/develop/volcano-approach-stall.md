# Volcano approach stall fix

- **Fixed:** with Avoid Hazards on, auto-combat could get stuck circling the edge of a
  lava pool. It kept trying to reach an enemy standing in the lava and never hit
  anything, sometimes for over ten minutes. Now it gives up on that enemy after 15
  seconds and moves on to others, as intended.
