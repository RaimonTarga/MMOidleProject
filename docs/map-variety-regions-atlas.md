# Sparse World Atlas

Review aid for the runtime-authored T1–T4 atlas. This is not a second data source; canonical
coordinates live under `shared/src/world/map/`.

Each three-character token is `tier + biome + kind`. A trailing `D` means dungeon, `CLR` is the
Clearing, `S2`/`S3`/`S4` are sanctuaries, and `...` is void. Biome initials are:
`M` Mountain, `C` Cave, `F` Forest, `P` Plains, `S` Swamp, `J` Jungle, `D` Desert, `U` Tundra,
`R` Trench, `V` Volcanic, and `G` Graveyard/Wasteland.

```text
02 ... ... 1MD 1M  1C  1CD ... ... 2F  2F  2F  2F  2FD ...
03 ... 1M  1M  1C  1C  1C  1FD 2C  2F  2P  2P  2P  2P  2PD
04 ... 1M  1M  1C  1C  1F  1F  2C  S2  2P  2S  2M  2M  2M
05 ... 1P  1P  CLR 1F  1F  1F  2C  2C  2S  2S  2J  2M  ...
06 ... 1P  1P  1S  1S  1S  ... ... 2C  2S  2D  2J  2M  2MD
07 ... ... 1P  1S  1S  1SD ... 2CD 2C  2S  2D  2J  2J  2J
08 ... ... 1PD 1S  ... ... ... ... 2SD 2S  2D  2D  2JD ...
09 ... 4MD 4M  4U  4U  4UD ... ... ... 2D  2DD ... ... ...
10 4JD 4M  4M  4U  4U  4U  4DD ... ... 3V  3V  3V  ... ...
11 4J  4J  4M  4M  4D  4D  4D  ... 3J  S3  3S  3V  3V  3VD
12 4J  4J  4J  S4  4R  4D  4D  3J  3J  3S  3S  3S  3S  3V
13 4V  4V  4G  4R  4R  4R  ... 3J  3U  3U  3D  3D  3S  3SD
14 4V  4V  4G  4G  4R  4R  4RD 3J  3U  3C  3C  3D  3D  ...
15 4VD 4V  4V  4G  4G  4G  4GD 3JD 3U  3M  3C  3C  3D  3DD
16 ... ... ... ... ... ... ... ... 3U  3M  3M  3C  3C  3CD
17 ... ... ... ... ... ... ... ... 3UD 3M  3M  3MD ... ...
```

The four regions form a clockwise spiral: T1 northwest, T2 northeast, T3 southeast, and T4
southwest. T4 reconnects directly to T1. These contacts are ordinary cardinal edges—there are no
border objects, gate nodes, or blocked terrain cells.

Each biome is grown as a connected, irregular territory from its own dungeon. Dungeons remain on
outer edge/corner cells but always touch their matching biome; connectivity-preserving boundary
swaps soften long horizontal and vertical bands. Blank cells render as thematic void.
