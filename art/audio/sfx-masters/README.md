# Accepted SFX masters

Lossless WAV masters for the accepted sound effects. They are not served to players.
The game ships Ogg Vorbis copies in `client/public/assets/audio/SFX/accepted/`
(the same stem names), which are about 9x smaller.

`client/public/assets/audio/accepted-provenance.json` describes these masters
(durations and sha256 match the WAVs here, not the Ogg copies).

To re-encode after replacing a master:

    ffmpeg -i art/audio/sfx-masters/<stem>.wav -c:a libvorbis -q:a 4 client/public/assets/audio/SFX/accepted/<stem>.ogg
