# Eat Your Greens!

## What is it?
"Eat Your Greens!" is a microgame for Lcolonq JAM 2026 event

## How to play it :
    - mouse (to click Heads)
    - Optional : Up/left/down/right keys (to move disquette)

## How to build it :
    - `wasm-pack build --target web --release`
    - `cp -r index.* pkg/ ../jam/2026/games/eatyourgreens/`
    - you can debug by having fixed seed for reproduciable behaviour by
      forcing the seed value in `src/random.rs`, `new(seed: usize)` function.
    - also there a shit tone of logs in web console.

## Game rules :

### Main objective
Survive the round and reach the required score target to win!

### Basic scoring (Eating Greens)
*   **Eat Greens**: Click on **Green** entities to consume them. Each green gives you **+1 point**.
*   **Avoid the Rest**: Clicking on **it** will penalize you with **-1 point**.

### Disquette & computer (optional)
*   There is a **Disquette** (floppy disk) bouncing around the screen. 
*   You can take manual control of the disquette using your **Keyboard arrow keys**.
*   Steer the disquette into the **Computer** to plug it in.
*   Once inserted, use your mouse to click the **Power Button** on the computer to boot it up. This boots the computer (surprise) !

### Hazards & Entity Rules
*   **Pac-Man Chasers (we call him mr Blue balls)**: Some **Blue** entities are actively hunting! If they catch and touch the disquette before you plug it into the computer, the disquette gets consumed and is gone for the rest of the round.
*   **Red Time Bombs**: **Red** entities have a 3-second countdown timer. If you don't click them to destroy them before the timer runs out, they will explode and **consume ALL Green entities** currently on the screen! *(clicking on them to disarm them still costs you -1 point).*
*   **Green Mutations**: If two **Green** entities bump into each other, they might undergo a bad reaction : one will turn **Yellow** and the other will turn **Red**.
*   **Red Collisions**: If two **Red** entities collide, they will blow each other up, but the explosion will also instantly kill the all green entities.
*   **Rogue Greens**: Be careful! Some Greens are fakes. If you hover your mouse near a "Rogue" Green, it will temporarily flash its true colors.
