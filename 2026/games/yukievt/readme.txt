                              Pat The Long Yooks
                           (A microgame by YukieVT)

This is an entry for the LCOLONQ MICROJAM 2K26-A-PALOOZA:
    https://api.colonq.computer/jam/2026
As such, it's designed to be loaded in an iframe served by LCOLONQ's "harness"
web server available at:
    https://github.com/lcolonq/jam/tree/master/2026
(Binaries available in the readme on that page, along with instructions)
The harness then sends a "start" signal to the microgame to begin the gameplay.

              Alternatively, **TO RUN THIS MICROGAME BY ITSELF**:
Simply uncomment the following line in the LoadNextImg() function:
    //DoStart();
This will cause the game to automatically start as soon as the images and sounds
have finished loading, instead of waiting for a signal from the harness that
it's time to start.
NOTE: In this case, sadly, sounds won't play until your first mouse click.

                                  HOW TO PLAY:
A long yook will slide onto the screen from the left or the right. You have a
few seconds to react and pat it!
    - If it slides from the left, left-click anywhere to pat it.
    - If it slides from the right, right-click anywhere to pat it.
After you've patted 3 long yooks, the game is complete! The timer gets faster
for each consecutive long yook that appears.

                                 COMPATIBILITY:
I've confirmed that the game works on the following browsers:
    - Mozilla Firefox 128
    - Google Chrome 107
    - Microsoft Edge 150