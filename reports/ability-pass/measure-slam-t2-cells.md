# Slam at T2: every cell (weapon × class × boss, 10 seeds each)

Source: `../reports/ability-pass/measure-slam-t2.jsonl`. Columns as in `measure-slam-t2.md`; Δ is against the Sweep control in the same cell.

## Per weapon × class (pooled over the five bosses)

| weapon | class | n | Sweep dps | win | Slam dps | Δ | win | Slam 600 ms dps | Δ | win | 1.2× / 600 ms dps | Δ | win |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| axe | Striker | 50 | 73.6 | 46% | 72.3 | −1.8% | 48% | 82.4 | +11.9% | 52% | 73.6 | 0.0% | 42% |
| axe | Squire | 50 | 62.5 | 46% | 66.0 | +5.5% | 50% | 74.2 | +18.6% | 62% | 65.4 | +4.6% | 44% |
| axe | Slinger | 50 | 77.6 | 52% | 76.7 | −1.1% | 58% | 88.2 | +13.7% | 64% | 79.9 | +3.0% | 50% |
| axe | Spirit | 50 | 85.4 | 68% | 84.4 | −1.2% | 72% | 94.8 | +11.0% | 76% | 84.7 | −0.9% | 72% |
| axe | Apprentice | 50 | 85.5 | 60% | 92.6 | +8.3% | 60% | 100.2 | +17.2% | 60% | 91.6 | +7.2% | 60% |
| axe | Conduit | 50 | 61.9 | 70% | 75.3 | +21.6% | 76% | 78.4 | +26.5% | 78% | 69.7 | +12.5% | 76% |
| broadsword | Striker | 50 | 63.8 | 46% | 68.5 | +7.4% | 44% | 80.6 | +26.3% | 56% | 67.9 | +6.4% | 44% |
| broadsword | Squire | 50 | 58.7 | 42% | 68.2 | +16.2% | 60% | 79.3 | +35.2% | 62% | 64.9 | +10.6% | 40% |
| broadsword | Slinger | 50 | 70.5 | 50% | 76.5 | +8.4% | 54% | 85.0 | +20.4% | 52% | 74.2 | +5.1% | 52% |
| broadsword | Spirit | 50 | 74.4 | 66% | 83.6 | +12.3% | 68% | 95.4 | +28.1% | 74% | 80.3 | +7.9% | 66% |
| broadsword | Apprentice | 50 | 81.9 | 60% | 94.5 | +15.3% | 60% | 107.1 | +30.7% | 60% | 92.0 | +12.3% | 60% |
| broadsword | Conduit | 50 | 51.3 | 58% | 72.5 | +41.2% | 76% | 75.9 | +47.9% | 76% | 62.0 | +20.8% | 72% |
| dagger | Striker | 50 | 74.4 | 100% | 72.3 | −2.8% | 90% | 80.7 | +8.5% | 100% | 73.8 | −0.8% | 96% |
| dagger | Squire | 50 | 64.7 | 96% | 72.0 | +11.3% | 86% | 79.4 | +22.7% | 100% | 69.8 | +7.9% | 98% |
| dagger | Slinger | 50 | 97.8 | 100% | 92.9 | −4.9% | 100% | 106.5 | +8.9% | 100% | 98.2 | +0.5% | 100% |
| dagger | Spirit | 50 | 83.2 | 100% | 81.9 | −1.6% | 100% | 92.0 | +10.5% | 100% | 82.8 | −0.5% | 100% |
| dagger | Apprentice | 50 | 90.1 | 100% | 88.6 | −1.6% | 100% | 100.4 | +11.4% | 100% | 90.9 | +1.0% | 100% |
| dagger | Conduit | 50 | 69.3 | 100% | 82.4 | +18.9% | 100% | 88.2 | +27.4% | 100% | 76.8 | +10.8% | 100% |
| hammer | Striker | 50 | 67.4 | 90% | 70.9 | +5.2% | 66% | 78.3 | +16.1% | 70% | 68.8 | +2.0% | 94% |
| hammer | Squire | 50 | 67.2 | 80% | 76.5 | +13.9% | 82% | 82.8 | +23.3% | 82% | 71.5 | +6.4% | 78% |
| hammer | Slinger | 50 | 76.5 | 78% | 80.0 | +4.5% | 74% | 92.0 | +20.2% | 98% | 82.0 | +7.1% | 88% |
| hammer | Spirit | 50 | 75.2 | 88% | 81.0 | +7.7% | 78% | 89.1 | +18.5% | 84% | 76.7 | +2.0% | 84% |
| hammer | Apprentice | 50 | 93.8 | 60% | 105.9 | +12.9% | 82% | 114.6 | +22.2% | 80% | 100.6 | +7.3% | 60% |
| hammer | Conduit | 50 | 62.1 | 100% | 77.0 | +24.0% | 100% | 83.7 | +34.6% | 100% | 70.6 | +13.6% | 100% |
| rapier | Striker | 50 | 80.5 | 50% | 72.8 | −9.6% | 40% | 84.1 | +4.5% | 46% | 78.4 | −2.6% | 42% |
| rapier | Squire | 50 | 69.2 | 40% | 65.4 | −5.5% | 40% | 72.6 | +4.9% | 60% | 68.4 | −1.2% | 42% |
| rapier | Slinger | 50 | 73.3 | 58% | 68.0 | −7.2% | 70% | 76.1 | +3.8% | 52% | 71.9 | −1.9% | 68% |
| rapier | Spirit | 50 | 95.8 | 70% | 90.9 | −5.1% | 72% | 100.7 | +5.1% | 78% | 93.1 | −2.8% | 68% |
| rapier | Apprentice | 50 | 76.9 | 60% | 75.9 | −1.4% | 60% | 84.9 | +10.3% | 60% | 77.7 | +0.9% | 60% |
| rapier | Conduit | 50 | 56.1 | 60% | 65.2 | +16.1% | 68% | 67.6 | +20.4% | 70% | 60.6 | +8.0% | 64% |

## Per weapon × class × boss

| weapon | class | boss | n | Sweep dps | win | Slam dps | Δ | win | Slam 600 ms dps | Δ | win | 1.2× / 600 ms dps | Δ | win |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| axe | Striker | gorging-razortusk | 10 | 102.7 | 100% | 104.0 | +1.3% | 100% | 111.8 | +8.9% | 100% | 99.7 | −2.9% | 100% |
| axe | Striker | apex-timberclaw | 10 | 127.4 | 100% | 125.2 | −1.7% | 100% | 141.5 | +11.1% | 100% | 129.2 | +1.4% | 100% |
| axe | Striker | mire-gorged-behemoth | 10 | 25.9 | 30% | 20.1 | −22.7% | 20% | 26.4 | +1.9% | 60% | 25.5 | −1.6% | 10% |
| axe | Striker | stoneplate-juggernaut | 10 | 65.6 | 0% | 67.6 | +3.1% | 20% | 78.1 | +19.1% | 0% | 66.3 | +1.0% | 0% |
| axe | Striker | chitinous-dreadbore | 10 | 46.6 | 0% | 44.6 | −4.3% | 0% | 54.3 | +16.5% | 0% | 47.4 | +1.7% | 0% |
| axe | Squire | gorging-razortusk | 10 | 79.9 | 100% | 81.4 | +1.9% | 100% | 88.4 | +10.6% | 100% | 79.9 | 0.0% | 100% |
| axe | Squire | apex-timberclaw | 10 | 101.3 | 100% | 107.2 | +5.8% | 100% | 118.3 | +16.8% | 100% | 105.2 | +3.9% | 100% |
| axe | Squire | mire-gorged-behemoth | 10 | 33.9 | 0% | 33.0 | −2.7% | 0% | 41.6 | +22.8% | 10% | 34.5 | +1.7% | 0% |
| axe | Squire | stoneplate-juggernaut | 10 | 57.4 | 30% | 63.6 | +10.9% | 50% | 69.8 | +21.7% | 100% | 62.5 | +9.0% | 20% |
| axe | Squire | chitinous-dreadbore | 10 | 40.2 | 0% | 44.8 | +11.5% | 0% | 52.7 | +31.0% | 0% | 45.0 | +11.9% | 0% |
| axe | Slinger | gorging-razortusk | 10 | 72.5 | 100% | 73.7 | +1.6% | 100% | 83.8 | +15.5% | 100% | 74.7 | +2.9% | 100% |
| axe | Slinger | apex-timberclaw | 10 | 115.9 | 100% | 115.5 | −0.4% | 100% | 127.9 | +10.4% | 100% | 116.7 | +0.7% | 100% |
| axe | Slinger | mire-gorged-behemoth | 10 | 66.5 | 60% | 62.5 | −6.0% | 60% | 73.9 | +11.1% | 70% | 69.3 | +4.2% | 50% |
| axe | Slinger | stoneplate-juggernaut | 10 | 65.5 | 0% | 70.8 | +8.0% | 10% | 77.0 | +17.5% | 30% | 67.5 | +2.9% | 0% |
| axe | Slinger | chitinous-dreadbore | 10 | 67.3 | 0% | 61.3 | −8.9% | 20% | 78.4 | +16.4% | 20% | 71.5 | +6.1% | 0% |
| axe | Spirit | gorging-razortusk | 10 | 81.5 | 100% | 74.2 | −9.0% | 100% | 88.3 | +8.3% | 100% | 77.8 | −4.5% | 100% |
| axe | Spirit | apex-timberclaw | 10 | 127.3 | 100% | 128.1 | +0.6% | 100% | 140.8 | +10.6% | 100% | 129.3 | +1.6% | 100% |
| axe | Spirit | mire-gorged-behemoth | 10 | 74.4 | 40% | 72.2 | −2.9% | 50% | 84.3 | +13.3% | 60% | 74.7 | +0.5% | 60% |
| axe | Spirit | stoneplate-juggernaut | 10 | 73.6 | 100% | 75.9 | +3.2% | 100% | 79.3 | +7.7% | 100% | 70.8 | −3.8% | 100% |
| axe | Spirit | chitinous-dreadbore | 10 | 70.3 | 0% | 71.7 | +1.9% | 10% | 81.3 | +15.6% | 20% | 70.7 | +0.5% | 0% |
| axe | Apprentice | gorging-razortusk | 10 | 77.5 | 100% | 82.8 | +6.9% | 100% | 90.1 | +16.3% | 100% | 84.0 | +8.5% | 100% |
| axe | Apprentice | apex-timberclaw | 10 | 119.6 | 100% | 128.3 | +7.3% | 100% | 135.9 | +13.6% | 100% | 124.5 | +4.1% | 100% |
| axe | Apprentice | mire-gorged-behemoth | 10 | 71.6 | 100% | 83.3 | +16.4% | 100% | 86.7 | +21.1% | 100% | 82.3 | +15.0% | 100% |
| axe | Apprentice | stoneplate-juggernaut | 10 | 81.6 | 0% | 91.1 | +11.6% | 0% | 99.0 | +21.2% | 0% | 86.9 | +6.4% | 0% |
| axe | Apprentice | chitinous-dreadbore | 10 | 77.3 | 0% | 77.5 | +0.3% | 0% | 89.4 | +15.7% | 0% | 80.5 | +4.2% | 0% |
| axe | Conduit | gorging-razortusk | 10 | 58.6 | 100% | 71.3 | +21.5% | 100% | 72.6 | +23.9% | 100% | 66.6 | +13.6% | 100% |
| axe | Conduit | apex-timberclaw | 10 | 93.6 | 100% | 113.2 | +20.9% | 100% | 116.3 | +24.2% | 100% | 105.5 | +12.8% | 100% |
| axe | Conduit | mire-gorged-behemoth | 10 | 59.4 | 60% | 70.4 | +18.6% | 80% | 74.0 | +24.8% | 90% | 66.8 | +12.6% | 80% |
| axe | Conduit | stoneplate-juggernaut | 10 | 42.0 | 90% | 55.0 | +30.9% | 90% | 59.2 | +40.7% | 100% | 47.9 | +13.9% | 100% |
| axe | Conduit | chitinous-dreadbore | 10 | 56.0 | 0% | 66.6 | +18.9% | 10% | 69.6 | +24.3% | 0% | 61.5 | +9.9% | 0% |
| broadsword | Striker | gorging-razortusk | 10 | 88.1 | 100% | 92.0 | +4.4% | 100% | 106.3 | +20.6% | 100% | 91.0 | +3.3% | 100% |
| broadsword | Striker | apex-timberclaw | 10 | 108.8 | 100% | 117.4 | +7.9% | 100% | 131.7 | +21.0% | 100% | 113.5 | +4.3% | 100% |
| broadsword | Striker | mire-gorged-behemoth | 10 | 22.9 | 30% | 22.1 | −3.5% | 20% | 27.9 | +21.8% | 80% | 24.4 | +6.7% | 20% |
| broadsword | Striker | stoneplate-juggernaut | 10 | 56.0 | 0% | 67.4 | +20.3% | 0% | 77.6 | +38.5% | 0% | 62.4 | +11.4% | 0% |
| broadsword | Striker | chitinous-dreadbore | 10 | 43.2 | 0% | 43.6 | +1.0% | 0% | 59.5 | +37.7% | 0% | 48.0 | +11.1% | 0% |
| broadsword | Squire | gorging-razortusk | 10 | 74.9 | 100% | 83.2 | +11.2% | 100% | 95.1 | +27.0% | 100% | 77.7 | +3.8% | 100% |
| broadsword | Squire | apex-timberclaw | 10 | 93.7 | 100% | 108.8 | +16.1% | 100% | 123.3 | +31.6% | 100% | 104.7 | +11.8% | 100% |
| broadsword | Squire | mire-gorged-behemoth | 10 | 31.5 | 10% | 37.0 | +17.4% | 0% | 45.3 | +43.9% | 10% | 34.4 | +9.3% | 0% |
| broadsword | Squire | stoneplate-juggernaut | 10 | 54.3 | 0% | 64.9 | +19.5% | 100% | 69.1 | +27.3% | 100% | 60.4 | +11.2% | 0% |
| broadsword | Squire | chitinous-dreadbore | 10 | 39.1 | 0% | 47.0 | +20.4% | 0% | 63.8 | +63.3% | 0% | 47.2 | +20.9% | 0% |
| broadsword | Slinger | gorging-razortusk | 10 | 69.5 | 100% | 78.1 | +12.3% | 100% | 81.4 | +17.1% | 100% | 71.4 | +2.7% | 100% |
| broadsword | Slinger | apex-timberclaw | 10 | 104.4 | 100% | 110.2 | +5.5% | 100% | 123.6 | +18.3% | 100% | 110.2 | +5.5% | 100% |
| broadsword | Slinger | mire-gorged-behemoth | 10 | 58.0 | 40% | 61.7 | +6.4% | 60% | 71.8 | +23.9% | 50% | 62.5 | +7.9% | 60% |
| broadsword | Slinger | stoneplate-juggernaut | 10 | 62.6 | 10% | 69.7 | +11.3% | 0% | 73.6 | +17.5% | 0% | 62.5 | −0.3% | 0% |
| broadsword | Slinger | chitinous-dreadbore | 10 | 58.2 | 0% | 62.7 | +7.8% | 10% | 74.4 | +27.8% | 10% | 64.2 | +10.4% | 0% |
| broadsword | Spirit | gorging-razortusk | 10 | 74.5 | 100% | 81.8 | +9.8% | 100% | 92.2 | +23.7% | 100% | 74.8 | +0.3% | 100% |
| broadsword | Spirit | apex-timberclaw | 10 | 110.6 | 100% | 123.3 | +11.5% | 100% | 138.0 | +24.7% | 100% | 119.3 | +7.8% | 100% |
| broadsword | Spirit | mire-gorged-behemoth | 10 | 64.0 | 30% | 71.1 | +11.1% | 30% | 81.7 | +27.7% | 60% | 71.1 | +11.1% | 30% |
| broadsword | Spirit | stoneplate-juggernaut | 10 | 61.3 | 100% | 75.6 | +23.3% | 100% | 82.2 | +34.1% | 100% | 68.6 | +11.9% | 100% |
| broadsword | Spirit | chitinous-dreadbore | 10 | 61.8 | 0% | 66.3 | +7.3% | 10% | 82.7 | +34.0% | 10% | 68.0 | +10.1% | 0% |
| broadsword | Apprentice | gorging-razortusk | 10 | 78.4 | 100% | 92.3 | +17.7% | 100% | 101.3 | +29.3% | 100% | 86.3 | +10.1% | 100% |
| broadsword | Apprentice | apex-timberclaw | 10 | 116.3 | 100% | 130.0 | +11.8% | 100% | 146.5 | +26.0% | 100% | 127.1 | +9.3% | 100% |
| broadsword | Apprentice | mire-gorged-behemoth | 10 | 65.2 | 100% | 72.4 | +11.1% | 100% | 88.5 | +35.7% | 100% | 76.5 | +17.4% | 100% |
| broadsword | Apprentice | stoneplate-juggernaut | 10 | 77.0 | 0% | 95.7 | +24.4% | 0% | 102.8 | +33.5% | 0% | 87.5 | +13.7% | 0% |
| broadsword | Apprentice | chitinous-dreadbore | 10 | 72.8 | 0% | 82.0 | +12.6% | 0% | 96.6 | +32.6% | 0% | 82.4 | +13.2% | 0% |
| broadsword | Conduit | gorging-razortusk | 10 | 49.2 | 100% | 71.0 | +44.3% | 100% | 72.5 | +47.3% | 100% | 58.1 | +18.1% | 100% |
| broadsword | Conduit | apex-timberclaw | 10 | 79.3 | 100% | 107.7 | +35.8% | 100% | 113.9 | +43.7% | 100% | 95.1 | +19.9% | 100% |
| broadsword | Conduit | mire-gorged-behemoth | 10 | 50.7 | 30% | 68.5 | +35.0% | 80% | 71.1 | +40.3% | 80% | 59.7 | +17.8% | 60% |
| broadsword | Conduit | stoneplate-juggernaut | 10 | 35.7 | 60% | 55.0 | +53.9% | 100% | 58.1 | +62.6% | 100% | 45.2 | +26.6% | 100% |
| broadsword | Conduit | chitinous-dreadbore | 10 | 41.5 | 0% | 60.1 | +44.8% | 0% | 63.7 | +53.6% | 0% | 51.6 | +24.2% | 0% |
| dagger | Striker | gorging-razortusk | 10 | 85.4 | 100% | 83.9 | −1.8% | 100% | 91.7 | +7.3% | 100% | 84.8 | −0.8% | 100% |
| dagger | Striker | apex-timberclaw | 10 | 127.6 | 100% | 124.4 | −2.5% | 100% | 136.5 | +7.0% | 100% | 125.4 | −1.7% | 100% |
| dagger | Striker | mire-gorged-behemoth | 10 | 23.3 | 100% | 19.2 | −17.3% | 50% | 27.8 | +19.3% | 100% | 24.2 | +3.9% | 80% |
| dagger | Striker | stoneplate-juggernaut | 10 | 78.0 | 100% | 73.5 | −5.7% | 100% | 77.1 | −1.1% | 100% | 70.9 | −9.1% | 100% |
| dagger | Striker | chitinous-dreadbore | 10 | 57.7 | 100% | 60.7 | +5.1% | 100% | 70.7 | +22.5% | 100% | 63.5 | +10.1% | 100% |
| dagger | Squire | gorging-razortusk | 10 | 74.1 | 100% | 78.3 | +5.5% | 100% | 84.1 | +13.5% | 100% | 77.6 | +4.6% | 100% |
| dagger | Squire | apex-timberclaw | 10 | 106.3 | 100% | 110.1 | +3.6% | 100% | 123.6 | +16.2% | 100% | 110.1 | +3.6% | 100% |
| dagger | Squire | mire-gorged-behemoth | 10 | 26.8 | 80% | 31.9 | +19.2% | 40% | 37.1 | +38.5% | 100% | 32.9 | +22.5% | 90% |
| dagger | Squire | stoneplate-juggernaut | 10 | 58.6 | 100% | 73.3 | +25.0% | 100% | 77.3 | +31.9% | 100% | 66.8 | +14.0% | 100% |
| dagger | Squire | chitinous-dreadbore | 10 | 57.5 | 100% | 66.3 | +15.4% | 90% | 74.8 | +30.1% | 100% | 61.6 | +7.2% | 100% |
| dagger | Slinger | gorging-razortusk | 10 | 75.6 | 100% | 71.6 | −5.3% | 100% | 79.2 | +4.8% | 100% | 74.6 | −1.3% | 100% |
| dagger | Slinger | apex-timberclaw | 10 | 139.8 | 100% | 137.3 | −1.8% | 100% | 152.5 | +9.0% | 100% | 141.2 | +1.0% | 100% |
| dagger | Slinger | mire-gorged-behemoth | 10 | 82.1 | 100% | 76.4 | −6.9% | 100% | 94.4 | +14.9% | 100% | 90.1 | +9.8% | 100% |
| dagger | Slinger | stoneplate-juggernaut | 10 | 103.0 | 100% | 96.0 | −6.8% | 100% | 111.0 | +7.7% | 100% | 100.7 | −2.3% | 100% |
| dagger | Slinger | chitinous-dreadbore | 10 | 88.1 | 100% | 83.2 | −5.6% | 100% | 95.4 | +8.3% | 100% | 84.3 | −4.3% | 100% |
| dagger | Spirit | gorging-razortusk | 10 | 68.8 | 100% | 70.9 | +3.1% | 100% | 76.4 | +11.2% | 100% | 72.3 | +5.1% | 100% |
| dagger | Spirit | apex-timberclaw | 10 | 125.0 | 100% | 126.7 | +1.4% | 100% | 138.9 | +11.1% | 100% | 127.9 | +2.4% | 100% |
| dagger | Spirit | mire-gorged-behemoth | 10 | 66.1 | 100% | 59.0 | −10.8% | 100% | 75.9 | +14.7% | 100% | 64.9 | −1.9% | 100% |
| dagger | Spirit | stoneplate-juggernaut | 10 | 83.8 | 100% | 80.7 | −3.7% | 100% | 86.9 | +3.7% | 100% | 77.6 | −7.4% | 100% |
| dagger | Spirit | chitinous-dreadbore | 10 | 72.5 | 100% | 72.3 | −0.3% | 100% | 81.9 | +13.0% | 100% | 71.5 | −1.4% | 100% |
| dagger | Apprentice | gorging-razortusk | 10 | 77.0 | 100% | 74.9 | −2.7% | 100% | 81.4 | +5.7% | 100% | 77.2 | +0.3% | 100% |
| dagger | Apprentice | apex-timberclaw | 10 | 122.9 | 100% | 128.2 | +4.3% | 100% | 139.9 | +13.8% | 100% | 128.0 | +4.2% | 100% |
| dagger | Apprentice | mire-gorged-behemoth | 10 | 73.6 | 100% | 60.3 | −18.2% | 100% | 84.2 | +14.3% | 100% | 71.5 | −2.9% | 100% |
| dagger | Apprentice | stoneplate-juggernaut | 10 | 93.6 | 100% | 96.2 | +2.8% | 100% | 105.6 | +12.8% | 100% | 95.6 | +2.1% | 100% |
| dagger | Apprentice | chitinous-dreadbore | 10 | 83.3 | 100% | 83.6 | +0.4% | 100% | 90.9 | +9.1% | 100% | 82.4 | −1.1% | 100% |
| dagger | Conduit | gorging-razortusk | 10 | 53.4 | 100% | 63.0 | +18.1% | 100% | 73.9 | +38.4% | 100% | 58.9 | +10.3% | 100% |
| dagger | Conduit | apex-timberclaw | 10 | 113.8 | 100% | 126.2 | +11.0% | 100% | 131.1 | +15.2% | 100% | 120.7 | +6.1% | 100% |
| dagger | Conduit | mire-gorged-behemoth | 10 | 61.2 | 100% | 78.5 | +28.1% | 100% | 83.3 | +36.0% | 100% | 70.1 | +14.5% | 100% |
| dagger | Conduit | stoneplate-juggernaut | 10 | 63.4 | 100% | 77.5 | +22.2% | 100% | 82.7 | +30.4% | 100% | 72.8 | +14.7% | 100% |
| dagger | Conduit | chitinous-dreadbore | 10 | 54.6 | 100% | 66.8 | +22.3% | 100% | 70.2 | +28.6% | 100% | 61.5 | +12.7% | 100% |
| hammer | Striker | gorging-razortusk | 10 | 79.8 | 100% | 87.2 | +9.3% | 100% | 93.7 | +17.4% | 100% | 80.6 | +0.9% | 100% |
| hammer | Striker | apex-timberclaw | 10 | 105.3 | 100% | 111.7 | +6.1% | 100% | 122.0 | +15.8% | 100% | 108.1 | +2.6% | 100% |
| hammer | Striker | mire-gorged-behemoth | 10 | 26.8 | 70% | 31.9 | +18.7% | 70% | 34.0 | +26.7% | 90% | 28.3 | +5.3% | 100% |
| hammer | Striker | stoneplate-juggernaut | 10 | 61.8 | 80% | 72.5 | +17.2% | 50% | 77.6 | +25.4% | 20% | 70.7 | +14.2% | 70% |
| hammer | Striker | chitinous-dreadbore | 10 | 63.3 | 100% | 51.4 | −18.9% | 10% | 64.3 | +1.6% | 40% | 56.2 | −11.2% | 100% |
| hammer | Squire | gorging-razortusk | 10 | 78.9 | 100% | 87.4 | +10.7% | 100% | 90.3 | +14.4% | 100% | 80.9 | +2.5% | 100% |
| hammer | Squire | apex-timberclaw | 10 | 104.1 | 100% | 112.4 | +7.9% | 100% | 120.3 | +15.6% | 100% | 107.5 | +3.3% | 100% |
| hammer | Squire | mire-gorged-behemoth | 10 | 41.6 | 100% | 49.1 | +18.2% | 100% | 51.2 | +23.1% | 100% | 46.3 | +11.4% | 90% |
| hammer | Squire | stoneplate-juggernaut | 10 | 59.3 | 100% | 75.2 | +26.9% | 100% | 81.0 | +36.7% | 100% | 65.0 | +9.8% | 100% |
| hammer | Squire | chitinous-dreadbore | 10 | 52.0 | 0% | 58.4 | +12.3% | 10% | 71.4 | +37.2% | 10% | 57.8 | +11.1% | 0% |
| hammer | Slinger | gorging-razortusk | 10 | 69.4 | 100% | 73.5 | +6.0% | 100% | 81.5 | +17.5% | 100% | 73.8 | +6.3% | 100% |
| hammer | Slinger | apex-timberclaw | 10 | 113.0 | 100% | 116.4 | +3.0% | 100% | 128.8 | +13.9% | 100% | 117.4 | +3.9% | 100% |
| hammer | Slinger | mire-gorged-behemoth | 10 | 59.1 | 100% | 62.7 | +6.0% | 90% | 77.9 | +31.8% | 100% | 63.5 | +7.4% | 100% |
| hammer | Slinger | stoneplate-juggernaut | 10 | 71.5 | 30% | 76.7 | +7.3% | 40% | 82.1 | +14.8% | 90% | 73.9 | +3.4% | 40% |
| hammer | Slinger | chitinous-dreadbore | 10 | 69.6 | 60% | 70.5 | +1.4% | 40% | 89.6 | +28.7% | 100% | 81.1 | +16.6% | 100% |
| hammer | Spirit | gorging-razortusk | 10 | 69.3 | 100% | 70.7 | +2.0% | 100% | 81.4 | +17.5% | 100% | 72.5 | +4.7% | 100% |
| hammer | Spirit | apex-timberclaw | 10 | 105.5 | 100% | 112.4 | +6.6% | 100% | 121.2 | +14.9% | 100% | 105.5 | 0.0% | 100% |
| hammer | Spirit | mire-gorged-behemoth | 10 | 66.3 | 100% | 74.3 | +12.1% | 60% | 79.0 | +19.2% | 80% | 68.2 | +2.9% | 80% |
| hammer | Spirit | stoneplate-juggernaut | 10 | 66.1 | 70% | 75.1 | +13.6% | 100% | 83.0 | +25.7% | 100% | 69.2 | +4.8% | 100% |
| hammer | Spirit | chitinous-dreadbore | 10 | 68.7 | 70% | 72.4 | +5.3% | 30% | 80.8 | +17.6% | 40% | 67.9 | −1.3% | 40% |
| hammer | Apprentice | gorging-razortusk | 10 | 80.9 | 100% | 93.1 | +15.0% | 100% | 94.9 | +17.3% | 100% | 81.1 | +0.2% | 100% |
| hammer | Apprentice | apex-timberclaw | 10 | 129.4 | 100% | 144.6 | +11.8% | 100% | 153.2 | +18.4% | 100% | 138.7 | +7.2% | 100% |
| hammer | Apprentice | mire-gorged-behemoth | 10 | 69.5 | 100% | 95.7 | +37.6% | 100% | 92.3 | +32.8% | 100% | 86.9 | +25.0% | 100% |
| hammer | Apprentice | stoneplate-juggernaut | 10 | 98.2 | 0% | 116.8 | +18.9% | 80% | 123.5 | +25.7% | 100% | 106.8 | +8.7% | 0% |
| hammer | Apprentice | chitinous-dreadbore | 10 | 90.8 | 0% | 79.3 | −12.7% | 30% | 109.1 | +20.1% | 0% | 89.6 | −1.4% | 0% |
| hammer | Conduit | gorging-razortusk | 10 | 48.9 | 100% | 65.0 | +32.7% | 100% | 71.5 | +46.0% | 100% | 57.8 | +18.2% | 100% |
| hammer | Conduit | apex-timberclaw | 10 | 88.7 | 100% | 104.1 | +17.4% | 100% | 111.4 | +25.6% | 100% | 97.1 | +9.5% | 100% |
| hammer | Conduit | mire-gorged-behemoth | 10 | 56.9 | 100% | 72.1 | +26.8% | 100% | 77.9 | +36.9% | 100% | 66.8 | +17.5% | 100% |
| hammer | Conduit | stoneplate-juggernaut | 10 | 62.6 | 100% | 74.0 | +18.1% | 100% | 85.2 | +36.2% | 100% | 70.0 | +11.9% | 100% |
| hammer | Conduit | chitinous-dreadbore | 10 | 53.5 | 100% | 70.0 | +30.8% | 100% | 72.3 | +35.0% | 100% | 61.0 | +13.9% | 100% |
| rapier | Striker | gorging-razortusk | 10 | 112.6 | 100% | 109.4 | −2.8% | 100% | 121.0 | +7.5% | 100% | 114.2 | +1.4% | 100% |
| rapier | Striker | apex-timberclaw | 10 | 148.1 | 100% | 132.6 | −10.5% | 100% | 149.4 | +0.9% | 100% | 142.3 | −3.9% | 100% |
| rapier | Striker | mire-gorged-behemoth | 10 | 25.3 | 50% | 18.6 | −26.5% | 0% | 26.2 | +3.6% | 30% | 23.7 | −6.6% | 10% |
| rapier | Striker | stoneplate-juggernaut | 10 | 67.4 | 0% | 60.3 | −10.5% | 0% | 72.5 | +7.6% | 0% | 64.5 | −4.3% | 0% |
| rapier | Striker | chitinous-dreadbore | 10 | 49.2 | 0% | 42.9 | −12.8% | 0% | 51.4 | +4.5% | 0% | 47.5 | −3.4% | 0% |
| rapier | Squire | gorging-razortusk | 10 | 88.8 | 100% | 85.2 | −4.0% | 100% | 92.9 | +4.7% | 100% | 84.9 | −4.4% | 100% |
| rapier | Squire | apex-timberclaw | 10 | 119.0 | 100% | 111.4 | −6.4% | 100% | 124.6 | +4.6% | 100% | 118.6 | −0.4% | 100% |
| rapier | Squire | mire-gorged-behemoth | 10 | 33.6 | 0% | 29.7 | −11.5% | 0% | 36.2 | +7.9% | 0% | 33.5 | −0.2% | 10% |
| rapier | Squire | stoneplate-juggernaut | 10 | 62.8 | 0% | 62.2 | −1.0% | 0% | 61.6 | −2.0% | 100% | 63.2 | +0.7% | 0% |
| rapier | Squire | chitinous-dreadbore | 10 | 41.9 | 0% | 38.4 | −8.4% | 0% | 47.8 | +14.0% | 0% | 41.6 | −0.8% | 0% |
| rapier | Slinger | gorging-razortusk | 10 | 69.2 | 100% | 68.9 | −0.4% | 100% | 74.3 | +7.5% | 100% | 70.4 | +1.9% | 100% |
| rapier | Slinger | apex-timberclaw | 10 | 110.6 | 100% | 103.6 | −6.4% | 100% | 115.3 | +4.2% | 100% | 110.8 | +0.1% | 100% |
| rapier | Slinger | mire-gorged-behemoth | 10 | 62.0 | 60% | 57.3 | −7.6% | 60% | 64.6 | +4.1% | 60% | 61.9 | −0.2% | 50% |
| rapier | Slinger | stoneplate-juggernaut | 10 | 61.8 | 0% | 57.2 | −7.4% | 90% | 62.8 | +1.7% | 0% | 57.5 | −7.0% | 90% |
| rapier | Slinger | chitinous-dreadbore | 10 | 63.1 | 30% | 53.2 | −15.6% | 0% | 63.5 | +0.6% | 0% | 59.0 | −6.4% | 0% |
| rapier | Spirit | gorging-razortusk | 10 | 95.1 | 100% | 93.0 | −2.1% | 100% | 100.5 | +5.7% | 100% | 91.5 | −3.7% | 100% |
| rapier | Spirit | apex-timberclaw | 10 | 150.5 | 100% | 143.3 | −4.8% | 100% | 159.3 | +5.9% | 100% | 150.5 | 0.0% | 100% |
| rapier | Spirit | mire-gorged-behemoth | 10 | 82.5 | 50% | 74.5 | −9.7% | 40% | 85.2 | +3.2% | 80% | 77.9 | −5.6% | 40% |
| rapier | Spirit | stoneplate-juggernaut | 10 | 76.5 | 100% | 75.1 | −1.9% | 100% | 79.2 | +3.5% | 100% | 73.0 | −4.6% | 100% |
| rapier | Spirit | chitinous-dreadbore | 10 | 74.4 | 0% | 68.7 | −7.6% | 20% | 79.2 | +6.5% | 10% | 72.4 | −2.7% | 0% |
| rapier | Apprentice | gorging-razortusk | 10 | 76.2 | 100% | 72.5 | −4.7% | 100% | 85.6 | +12.5% | 100% | 75.1 | −1.4% | 100% |
| rapier | Apprentice | apex-timberclaw | 10 | 114.3 | 100% | 113.3 | −0.8% | 100% | 123.2 | +7.8% | 100% | 114.7 | +0.4% | 100% |
| rapier | Apprentice | mire-gorged-behemoth | 10 | 61.5 | 100% | 61.4 | −0.1% | 100% | 66.6 | +8.3% | 100% | 63.3 | +3.0% | 100% |
| rapier | Apprentice | stoneplate-juggernaut | 10 | 69.1 | 0% | 71.9 | +4.1% | 0% | 78.1 | +13.1% | 0% | 70.3 | +1.8% | 0% |
| rapier | Apprentice | chitinous-dreadbore | 10 | 63.6 | 0% | 60.2 | −5.4% | 0% | 70.8 | +11.3% | 0% | 64.8 | +1.9% | 0% |
| rapier | Conduit | gorging-razortusk | 10 | 55.2 | 100% | 63.9 | +15.7% | 100% | 67.2 | +21.7% | 100% | 57.4 | +3.9% | 100% |
| rapier | Conduit | apex-timberclaw | 10 | 94.1 | 100% | 108.4 | +15.2% | 100% | 110.3 | +17.2% | 100% | 102.1 | +8.5% | 100% |
| rapier | Conduit | mire-gorged-behemoth | 10 | 52.3 | 40% | 58.8 | +12.6% | 60% | 61.9 | +18.4% | 70% | 56.1 | +7.4% | 60% |
| rapier | Conduit | stoneplate-juggernaut | 10 | 32.5 | 60% | 40.7 | +25.2% | 80% | 43.0 | +32.3% | 80% | 37.5 | +15.5% | 60% |
| rapier | Conduit | chitinous-dreadbore | 10 | 46.7 | 0% | 54.3 | +16.2% | 0% | 55.6 | +19.2% | 0% | 50.0 | +7.2% | 0% |
