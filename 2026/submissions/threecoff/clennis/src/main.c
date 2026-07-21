// Clonk Tennis - yay


#include "raylib.h"
#include "raymath.h"
#include "rlgl.h" // rlSetClipPlanes (see main)
#include "box3d/box3d.h"

#if !defined(PLATFORM_WEB)

#include "GLFW/glfw3.h"
#endif

#include <stdlib.h>
#include <math.h>

// --- harness stuff
#if defined(PLATFORM_WEB)
#include <emscripten.h>

EM_JS(void, HarnessInit, (), {

    if (!window.__clonkInit) {
        window.__clonkInit = true;
        window.addEventListener('message', function (ev) {
            var d = ev && ev.data;
            if (d && d.op === 'start' && typeof d.difficulty === 'number') {
                window.lcolonqJamStart = d.difficulty;
            }
        });
    }
});
EM_JS(void, HarnessReady, (), { window.parent.postMessage({ op: "ready" }, "*"); });
EM_JS(void, HarnessStarted, (const char *verb), {
    window.parent.postMessage({ op: "started", verb: UTF8ToString(verb) }, "*");
});
EM_JS(void, HarnessDone, (int win), {
    window.parent.postMessage({ op: "done", win: (win != 0) }, "*");
});

EM_JS(int, HarnessPollStart, (), {
    var v = window.lcolonqJamStart;
    return (typeof v === 'number' && isFinite(v)) ? (v | 0) : -1;
});
#else
static void HarnessInit(void) {}
static void HarnessReady(void) {}
static void HarnessStarted(const char *verb) { (void)verb; }
static void HarnessDone(int win) { (void)win; }
static int  HarnessPollStart(void) { return 35; } // native: start immediately
#endif

// --- Court / gameplay dimensions (metres) ---
#define COURT_W      8.0f   // width along X
#define COURT_L     20.0f   // length along Z
#define NET_H        1.0f
#define BALL_R       0.16f
#define PLAYER_Z     8.5f
#define AI_Z        (-8.5f)


#define WALL_X  (COURT_W * 0.5f + 1.0f)
#define CEIL_H   4.5f
#define BACK_Z  (AI_Z - 2.0f)

#define FIXED_DT    (1.0f / 60.0f)
#define GRAVITY_Y   (-12.0f)


#define RES_W 240
#define RES_H 160

// Racket paddle half-extents.
#define PAD_HX 0.80f
#define PAD_HY 0.80f
#define PAD_HZ 0.08f

// Hit tuning (see TryHit).
#define HIT_Z_BAND   0.7f
#define HIT_REACH    1.1f
#define REACH_TOP_Y  3.4f
#define RETURN_SPEED 30.0f
#define LIFT         5.0f
#define PAD_INFLUENCE 0.45f
#define HIT_COOLDOWN 0.0f

#define AI_SPEED     9.0f

// Racket
#define RACKET_SCALE  2.3f
#define RACKET_FACE_Y 0.87f
#define RACKET_ROD_L  (RACKET_FACE_Y * RACKET_SCALE)

// Racket swing stuff
#define SWAY_SPRING  260.0f
#define SWAY_DAMP     12.0f
#define HIT_RECOIL    0.12f

// Racket face angling
#define PIVOT_MAX    0.5f
#define PIVOT_SENS   0.015f
#define PIVOT_RELAX  10.0f

// Match rules.
#define TARGET_RETURNS 3
#define TIME_LIMIT     30.0f
#define MAX_LIVES      3
#define LIFE_EVERY_SCORES 3

// Difficulty:
#define DIFF_SCALE      0.40f
#define DIFF_MAX_AT     35.0f // difficulty setting at which the AI reaches full skill

#define DIFF_PER_SEC    2.5f
#define DIFF_BALL_EVERY 25
#define DIFF_EVIL_EVERY 50
#define MAX_BALLS       2
#define MAX_AIS         1
#define SLOW_TIME       3.0f
#define SLOW_GRIP_SPEED 4.0f


#define LIFE_ICON_SCALE 1.0f
#define LIFE_ICON_PAD   2

typedef enum {
    GS_WAITING,
    GS_PLAYING,
    GS_WON,
    GS_LOST
} GameState;

typedef struct Racket {
    Vector3 grip;
    Vector3 head;
    Vector3 headVel;
    float   cooldown;
    float   yaw;
    bool    yawArmed;
} Racket;

typedef struct Ball {
    b3BodyId body;
    bool  evil;
    bool  playerLast;
    float serveTimer;
    float stallTimer;
} Ball;

// Where each AI racket idles on its baseline, so a crowd of them spreads out.
static const float AI_HOME_X[] = { 0.0f, -2.6f, 2.6f, -1.3f, 1.3f, 3.5f };

typedef struct Game {
    GameState state;
    int   difficulty;

    b3WorldId world;

    Racket player;
    Racket ais[MAX_AIS];
    int    aiCount;

    Ball balls[MAX_BALLS];
    int  ballCount;

    Vector2 cursor;


    float diff;
    int   milestones;
    float slowTimer;

    int   returns;
    int   scores;
    int   lives;
    float timeLeft;

    Camera3D camera;

    Model racketModel;
    int   frameMat;

    Texture2D lifeTex;
    Texture2D lifeTexGray;

    RenderTexture2D target;

    Music music;
    Sound pongSound;  // player's racket contact
    Sound pingSound;  // AI racket contact
} Game;

static Game G;

// --- small helpers -------------------------------------------------------

static Vector3 B2R(b3Vec3 v) { return (Vector3){ v.x, v.y, v.z }; }

static float Clampf(float v, float lo, float hi) {
    return v < lo ? lo : (v > hi ? hi : v);
}

static float RandRange(float lo, float hi) {
    return lo + (hi - lo) * ((float)rand() / (float)RAND_MAX);
}

// --- difficulty scaling

// 0..1 fraction of full difficulty, saturating at a setting of DIFF_MAX_AT.
static float DiffFrac(void) {
    return Clampf(G.diff / (DIFF_MAX_AT * DIFF_SCALE), 0.0f, 1.0f);
}

static float AISpeed(void) {
    return AI_SPEED * (1.0f + 1.5f * DiffFrac()); // up to 2.5x at full difficulty
}


static float AILead(void) {
    return 0.4f + 0.6f * DiffFrac(); // 0.4 baseline, full prediction at max
}

// Multiplier on the ball's pace (AI returns only; serves stay at base pace).
static float BallPace(void) {
    return 1.0f + 0.3f * DiffFrac(); // up to 1.3x at full difficulty
}

// How often the AI angles its racket face on a return.
static float AIPivotChance(void) {
    return 0.9f * DiffFrac(); // rare early, most returns at full difficulty
}

// How far the AI is willing to angle the face when it does.
static float AIPivotMax(void) {
    return 0.12f + 0.28f * DiffFrac(); // ~7 to ~23 degrees
}

// --- physics scene construction ------------------------------------------

static void CreateStaticBox(b3WorldId world, b3Vec3 center, float hx, float hy, float hz,
                            float restitution) {
    b3BodyDef bd = b3DefaultBodyDef();
    bd.type = b3_staticBody;
    bd.position = center;
    b3BodyId body = b3CreateBody(world, &bd);

    b3ShapeDef sd = b3DefaultShapeDef();
    sd.baseMaterial.restitution = restitution;
    sd.baseMaterial.friction = 0.4f;

    b3BoxHull hull = b3MakeBoxHull(hx, hy, hz);
    b3CreateHullShape(body, &sd, &hull.base);
}


static void ServeBall(Ball *b) {
    b3Vec3 pos = { RandRange(-2.0f, 2.0f), 3.0f, AI_Z * 0.5f };
    b3Body_SetTransform(b->body, pos, b3Quat_identity);
    b3Vec3 vel = { RandRange(-1.0f, 1.0f), 2.0f, 7.0f };
    b3Body_SetLinearVelocity(b->body, vel);
    b3Body_SetAngularVelocity(b->body, b3Vec3_zero);
    b->serveTimer = 0.0f;
    b->stallTimer = 0.0f;
    b->playerLast = false;
}

static void AddBall(bool evil) {
    if (G.ballCount >= MAX_BALLS) return;

    b3BodyDef bd = b3DefaultBodyDef();
    bd.type = b3_dynamicBody;
    bd.position = (b3Vec3){ 0.0f, 3.0f, AI_Z * 0.5f };
    bd.enableSleep = false;

    Ball *b = &G.balls[G.ballCount++];
    b->body = b3CreateBody(G.world, &bd);
    b->evil = evil;

    b3ShapeDef sd = b3DefaultShapeDef();
    sd.density = 1.0f;
    sd.baseMaterial.restitution = 0.7f;
    sd.baseMaterial.friction = 0.3f;
    b3Sphere sphere = { { 0.0f, 0.0f, 0.0f }, BALL_R };
    b3CreateSphereShape(b->body, &sd, &sphere);

    ServeBall(b);
}

static void AddAIRacket(void) {
    if (G.aiCount >= MAX_AIS) return;
    Racket *a = &G.ais[G.aiCount++];
    a->grip = (Vector3){ AI_HOME_X[G.aiCount - 1], 1.0f - RACKET_ROD_L, AI_Z };
    a->head = (Vector3){ a->grip.x, 1.0f, AI_Z };
    a->headVel = (Vector3){ 0 };
    a->cooldown = 0.0f;
    a->yaw = 0.0f;
    a->yawArmed = false;
}

static void InitScene(void) {

    b3WorldDef wd = b3DefaultWorldDef();
    wd.gravity = (b3Vec3){ 0.0f, GRAVITY_Y, 0.0f };
    G.world = b3CreateWorld(&wd);

    // Floor
    CreateStaticBox(G.world, (b3Vec3){ 0.0f, -0.5f, 0.0f },
                    COURT_W * 0.5f + 2.0f, 0.5f, COURT_L * 0.5f + 2.0f, 0.55f);

    // Net
    CreateStaticBox(G.world, (b3Vec3){ 0.0f, NET_H * 0.5f, 0.0f },
                    COURT_W * 0.5f, NET_H * 0.5f, 0.05f, 0.3f);

    // Arena shell
    float wallHz = COURT_L * 0.5f + 4.0f;
    CreateStaticBox(G.world, (b3Vec3){ WALL_X + 0.5f, CEIL_H * 0.5f, 0.0f },
                    0.5f, CEIL_H * 0.5f + 1.0f, wallHz, 0.6f);
    CreateStaticBox(G.world, (b3Vec3){ -(WALL_X + 0.5f), CEIL_H * 0.5f, 0.0f },
                    0.5f, CEIL_H * 0.5f + 1.0f, wallHz, 0.6f);
    // CreateStaticBox(G.world, (b3Vec3){ 0.0f, CEIL_H + 0.5f, 0.0f },
                    // WALL_X + 1.0f, 0.5f, wallHz, 0.6f);
    // CreateStaticBox(G.world, (b3Vec3){ 0.0f, CEIL_H * 0.5f, BACK_Z - 0.5f },
    //                 WALL_X + 1.0f, CEIL_H * 0.5f + 1.0f, 0.5f, 0.6f);

    // Spawning
    G.player.grip = (Vector3){ 0.0f, 1.0f - RACKET_ROD_L, PLAYER_Z };
    G.player.head = (Vector3){ 0.0f, 1.0f, PLAYER_Z };

    // Camera behind and above the player, looking down the court.
    G.camera.position   = (Vector3){ 0.0f, 6.5f, 16.0f };
    G.camera.target     = (Vector3){ 0.0f, 1.0f, 0.0f };
    G.camera.up         = (Vector3){ 0.0f, 1.0f, 0.0f };
    G.camera.fovy       = 55.0f;
    G.camera.projection = CAMERA_PERSPECTIVE;
}

static void StartMatch(int difficulty) {
    G.difficulty = difficulty;
    G.diff       = difficulty * DIFF_SCALE;
    G.milestones = 0;
    G.slowTimer  = 0.0f;
    G.returns    = 0;
    G.scores     = 0;
    G.lives      = MAX_LIVES;
    G.timeLeft   = TIME_LIMIT;
    G.state      = GS_PLAYING;
    PlayMusicStream(G.music);
    AddBall(false);
    AddAIRacket();
    HarnessStarted("return!");
}

static void FinishMatch(bool win) {
    if (G.state == GS_WON || G.state == GS_LOST) return; // report once
    G.state = win ? GS_WON : GS_LOST;
    HarnessDone(win ? 1 : 0);
}

// --- gameplay update
static void SwingRacket(Racket *r, float dt, float damp) {
    Vector3 upright = { r->grip.x, r->grip.y + RACKET_ROD_L, r->grip.z };
    Vector3 pull = Vector3Scale(Vector3Subtract(upright, r->head), SWAY_SPRING);
    r->headVel = Vector3Add(r->headVel, Vector3Scale(pull, dt));
    r->headVel = Vector3Scale(r->headVel, 1.0f / (1.0f + damp * dt));

    Vector3 prev = r->head;
    r->head = Vector3Add(r->head, Vector3Scale(r->headVel, dt));


    Vector3 rod = Vector3Subtract(r->head, r->grip);
    float len = Vector3Length(rod);
    if (len > 0.0001f) {
        r->head = Vector3Add(r->grip, Vector3Scale(rod, RACKET_ROD_L / len));
    }
    r->headVel = Vector3Scale(Vector3Subtract(r->head, prev), 1.0f / dt);
}


static bool TryHit(Racket *r, Ball *b, bool towardNegZ, float aimX, float pace) {
    if (r->cooldown > 0.0f) return false;

    b3Vec3 bp = b3Body_GetPosition(b->body);
    b3Vec3 bv = b3Body_GetLinearVelocity(b->body);

    if (fabsf(bp.z - r->head.z) > HIT_Z_BAND) return false;
    float approach = towardNegZ ? bv.z : -bv.z; // +Z for player, -Z for AI
    if (approach <= 0.0f) return false;
    float dx = bp.x - r->head.x;
    float dy = bp.y - r->head.y;
    if (dx * dx + dy * dy > HIT_REACH * HIT_REACH) return false;

    float zdir = towardNegZ ? -1.0f : 1.0f;
    b3Vec3 v;
    v.z = zdir * RETURN_SPEED * pace;
    // Steer sideways by where the ball met the strings, then aim toward aimX.
    v.x = dx * 4.0f + (aimX - bp.x) * 0.8f;
    v.y = LIFT;

    // Let the head's swing add English to the shot (bounded, so a fast racket quickens the ball a little instead of launching it).
    v.x += Clampf(r->headVel.x * PAD_INFLUENCE, -6.0f, 6.0f);
    v.y += Clampf(-r->headVel.y * PAD_INFLUENCE, -1.0f, 4.0f); // swing up = more lift
    v.z += Clampf(r->headVel.z * PAD_INFLUENCE, -8.0f, 8.0f);

    float yc = cosf(r->yaw), ys = sinf(r->yaw);
    float vx = v.x * yc + v.z * ys;
    v.z      = -v.x * ys + v.z * yc;
    v.x      = vx;

.
    float t = ((towardNegZ ? AI_Z : PLAYER_Z) - bp.z) / v.z;
    if (t > 0.0f) {
        float vyMax = (REACH_TOP_Y - bp.y - 0.5f * GRAVITY_Y * t * t) / t;
        if (v.y > vyMax) v.y = vyMax;
    }

    b3Body_SetLinearVelocity(b->body, v);
    b3Body_SetAngularVelocity(b->body, b3Vec3_zero);

    r->headVel.x += (bv.x - v.x) * HIT_RECOIL;
    r->headVel.y += (bv.y - v.y) * HIT_RECOIL;
    r->headVel.z += (bv.z - v.z) * HIT_RECOIL;

    r->cooldown = HIT_COOLDOWN;
    return true;
}


static void UpdateAimCursor(void) {

    if (!IsCursorHidden() && IsMouseButtonPressed(MOUSE_BUTTON_LEFT)) {
        DisableCursor();
    }


    Vector2 d = GetMouseDelta();

    // Left button held: sideways mouse motion turns the racket face
    if (IsMouseButtonDown(MOUSE_BUTTON_LEFT)) {
        G.player.yaw = Clampf(G.player.yaw - d.x * RES_W / (float)GetScreenWidth() * PIVOT_SENS,
                              -PIVOT_MAX, PIVOT_MAX);
        return;
    }

    G.cursor.x = Clampf(G.cursor.x + d.x * RES_W / (float)GetScreenWidth(),
                        0.0f, (float)RES_W);
    G.cursor.y = Clampf(G.cursor.y + d.y * RES_H / (float)GetScreenHeight(),
                        0.0f, (float)RES_H);
}

static void UpdatePlayerRacket(float dt) {
    Racket *p = &G.player;


    Ray ray = GetScreenToWorldRayEx(G.cursor, G.camera, RES_W, RES_H);
    float along = (PLAYER_Z - ray.position.z) / ray.direction.z;
    Vector3 aim = Vector3Add(ray.position, Vector3Scale(ray.direction, along));
    aim.x = Clampf(aim.x, -(COURT_W * 0.5f + 1.5f), COURT_W * 0.5f + 1.5f);
    aim.y = Clampf(aim.y, 0.3f, 3.6f);
    Vector3 want = { aim.x, aim.y - RACKET_ROD_L, PLAYER_Z };

    if (G.slowTimer > 0.0f) {
        G.slowTimer -= dt;
        Vector3 to = Vector3Subtract(want, p->grip);
        float d = Vector3Length(to);
        float maxStep = SLOW_GRIP_SPEED * dt;
        if (d > maxStep && d > 0.0001f) {
            want = Vector3Add(p->grip, Vector3Scale(to, maxStep / d));
        }
    }
    p->grip = want;

    // Left click: instantly straighten the racket, killing any sway.
    if (IsMouseButtonPressed(MOUSE_BUTTON_LEFT)) {
        p->yaw = 0.0f;
        p->head = (Vector3){ p->grip.x, p->grip.y + RACKET_ROD_L, p->grip.z };
        p->headVel = (Vector3){ 0 };
    }
    // Released: the face eases back square.
    if (!IsMouseButtonDown(MOUSE_BUTTON_LEFT)) {
        p->yaw *= 1.0f / (1.0f + PIVOT_RELAX * dt);
    }
    SwingRacket(p, dt, SWAY_DAMP);

    if (p->cooldown > 0.0f) p->cooldown -= dt;
    for (int i = 0; i < G.ballCount; i++) {
        Ball *b = &G.balls[i];
        if (!TryHit(p, b, true, 0.0f, 1.0f)) continue;
        PlaySound(G.pongSound);
        if (b->evil) {
            G.slowTimer = SLOW_TIME; // touched the red ball: cursed
        } else {
            G.returns++;
            b->playerLast = true;
        }
    }
}


static Vector2 PredictBallXY(b3Vec3 bp, b3Vec3 bv, float t) {
    float g = -GRAVITY_Y; // positive-down
    float y = bp.y + bv.y * t - 0.5f * g * t * t;
    if (y < BALL_R) {
        float disc = bv.y * bv.y + 2.0f * g * (bp.y - BALL_R);
        if (disc <= 0.0f) {
            y = BALL_R;
        } else {
            float tb = (bv.y + sqrtf(disc)) / g;      // when it meets the floor
            float vy = (g * tb - bv.y) * 0.55f;       // rebound (floor restitution)
            float tr = t - tb;
            y = BALL_R + vy * tr - 0.5f * g * tr * tr;
            if (y < BALL_R) y = BALL_R; // don't bother predicting a second bounce
        }
    }
    float x = bp.x + bv.x * t;
    float w = WALL_X - BALL_R;
    if (x > w)  x =  2.0f * w - x; // mirror off the side walls
    if (x < -w) x = -2.0f * w - x;
    return (Vector2){ x, y };
}

static void UpdateAIRacket(Racket *a, float homeX, float dt) {

    Vector3 target = { homeX, 1.0f, AI_Z };
    float best = 1e9f;
    for (int i = 0; i < G.ballCount; i++) {
        b3Vec3 bp = b3Body_GetPosition(G.balls[i].body);
        b3Vec3 bv = b3Body_GetLinearVelocity(G.balls[i].body);
        if (bv.z >= 0.0f || bp.z < AI_Z - 1.0f) continue; // not incoming
        // Reaction time
        if (bp.z >= 2.0f + (PLAYER_Z - 2.0f) * AILead()) continue;
        float dx = bp.x - a->head.x, dz = bp.z - AI_Z;
        float score = dx * dx + dz * dz;
        if (score < best) {
            best = score;
            float t = Clampf((AI_Z - bp.z) / bv.z * AILead(), 0.0f, 1.2f);
            Vector2 hit = PredictBallXY(bp, bv, t);
            target = (Vector3){ Clampf(hit.x, -COURT_W * 0.5f, COURT_W * 0.5f),
                                Clampf(hit.y, 0.4f, 3.0f), AI_Z };
        }
    }
    target.y -= RACKET_ROD_L;

    // Once per incoming ball, maybe angle the racket face so the return comes
    // off at an angle instead of straight back.
    if (best < 1e9f) {
        if (!a->yawArmed) {
            a->yawArmed = true;
            a->yaw = 0.0f;
            if (RandRange(0.0f, 1.0f) < AIPivotChance()) {
                float sign = (RandRange(0.0f, 1.0f) < 0.5f) ? -1.0f : 1.0f;
                // Skilled AIs angle with intent: deflect the shot away from
                // wherever the player's racket is right now.
                if (RandRange(0.0f, 1.0f) < DiffFrac()) {
                    sign = (G.player.head.x >= 0.0f) ? -1.0f : 1.0f;
                }
                a->yaw = sign * RandRange(0.4f, 1.0f) * AIPivotMax();
            }
        }
    } else {
        a->yawArmed = false;
        a->yaw *= 1.0f / (1.0f + PIVOT_RELAX * dt);
    }

    Vector3 to = Vector3Subtract(target, a->grip);
    float maxStep = AISpeed() * dt; // faster hands as difficulty climbs
    float d = Vector3Length(to);
    if (d > maxStep && d > 0.0001f) to = Vector3Scale(to, maxStep / d);
    a->grip = Vector3Add(a->grip, to);
    a->grip.z = AI_Z;
    // Steadier hands as difficulty climbs
    SwingRacket(a, dt, SWAY_DAMP + 20.0f * AILead());

    if (a->cooldown > 0.0f) a->cooldown -= dt;

    float aimX = RandRange(-COURT_W * 0.3f, COURT_W * 0.3f);
    for (int i = 0; i < G.ballCount; i++) {
        if (TryHit(a, &G.balls[i], false, aimX, BallPace())) {
            PlaySound(G.pingSound);
            G.balls[i].playerLast = false;
            break;
        }
    }
}

static void UpdateBallState(Ball *b, float dt) {
    b3Vec3 bp = b3Body_GetPosition(b->body);
    b3Vec3 bv = b3Body_GetLinearVelocity(b->body);

    if (bp.z > PLAYER_Z + 1.2f) {
        if (b->serveTimer <= 0.0f) {
            if (!b->evil) {
                G.lives--;
                if (G.lives <= 0) {
                    FinishMatch(false);
                    return;
                }
            }
            b->serveTimer = 0.8f;
        }
        return;
    }

    // Dead ball
    float speed = sqrtf(bv.x * bv.x + bv.y * bv.y + bv.z * bv.z);
    if (bp.y < 0.4f && speed < 1.2f) b->stallTimer += dt; else b->stallTimer = 0.0f;

    bool dead = (bp.y < -1.0f) ||
                (fabsf(bp.x) > WALL_X + 1.5f) ||
                (bp.z < BACK_Z - 1.5f) ||
                (b->stallTimer > 1.5f);

    if (dead && b->serveTimer <= 0.0f) {
        // The ball died in the AI's half off the player's racket: point won.
        if (b->playerLast && !b->evil && bp.z < 0.0f) {
            G.scores++;
            if (G.scores % LIFE_EVERY_SCORES == 0 && G.lives < MAX_LIVES) {
                G.lives++; // every few points won earns a lost life back
            }
        }
        b->serveTimer = 0.8f; // brief pause before the next serve
    }
}

static void UpdatePlaying(float dt) {
    G.timeLeft -= dt;
    if (G.timeLeft <= 0.0f) {
        G.timeLeft = 0.0f;
        FinishMatch(true);
        return;
    }


    G.diff += DIFF_PER_SEC * DIFF_SCALE * dt;
    while (G.milestones < (int)(G.diff / DIFF_BALL_EVERY)) {
        G.milestones++;
        AddBall(false);
        AddAIRacket();
        if ((G.milestones * DIFF_BALL_EVERY) % DIFF_EVIL_EVERY == 0) {
            AddBall(false);
        }
    }

    for (int i = 0; i < G.ballCount; i++) {
        Ball *b = &G.balls[i];
        if (b->serveTimer > 0.0f) {
            b->serveTimer -= dt;
            if (b->serveTimer <= 0.0f) ServeBall(b);
        }
    }

    UpdatePlayerRacket(dt);
    for (int i = 0; i < G.aiCount; i++) {
        UpdateAIRacket(&G.ais[i], AI_HOME_X[i], dt);
    }

    b3World_Step(G.world, dt, 4);

    for (int i = 0; i < G.ballCount; i++) {
        UpdateBallState(&G.balls[i], dt);
    }
}

// --- rendering

static void LoadRacketModel(void) {
    G.racketModel = LoadModel(ASSETS_DIR "/racket.glb");
    // Find the frame material (the blue one) so each side can wear its colour.
    G.frameMat = -1;
    for (int i = 0; i < G.racketModel.materialCount; i++) {
        Color c = G.racketModel.materials[i].maps[MATERIAL_MAP_ALBEDO].color;
        if (c.b > c.r && c.b > c.g) G.frameMat = i;
    }
}


static void LoadLifeIcons(void) {
    Image img = LoadImage(ASSETS_DIR "/mrgreen.png");
    ImageFormat(&img, PIXELFORMAT_UNCOMPRESSED_R8G8B8A8);
    G.lifeTex = LoadTextureFromImage(img);

    Color *px = (Color *)img.data;
    for (int i = 0; i < img.width * img.height; i++) {
        unsigned char v = (unsigned char)((px[i].r * 30 + px[i].g * 59 + px[i].b * 11) / 200);
        px[i] = (Color){ v, v, v, px[i].a };
    }
    G.lifeTexGray = LoadTextureFromImage(img);
    UnloadImage(img);
}

static void DrawLives(void) {
    float step = G.lifeTex.width * LIFE_ICON_SCALE + LIFE_ICON_PAD;
    for (int i = 0; i < MAX_LIVES; i++) {
        Texture2D t = (i < G.lives) ? G.lifeTex : G.lifeTexGray;
        DrawTextureEx(t, (Vector2){ 4.0f + i * step, 4.0f }, 0.0f,
                      LIFE_ICON_SCALE, WHITE);
    }
}

static void DrawRacket(Racket *r, Color face, Color edge) {
    if (G.racketModel.meshCount == 0) {
        // Model failed to load: fall back to the original paddle shape.
        DrawCube(r->head, PAD_HX * 2, PAD_HY * 2, PAD_HZ * 2, Fade(face, 0.55f));
        DrawCubeWires(r->head, PAD_HX * 2, PAD_HY * 2, PAD_HZ * 2, edge);
        return;
    }
    if (G.frameMat >= 0) {
        G.racketModel.materials[G.frameMat].maps[MATERIAL_MAP_ALBEDO].color = face;
    }

    Vector3 dir = Vector3Scale(Vector3Subtract(r->head, r->grip), 1.0f / RACKET_ROD_L);
    Vector3 axis = Vector3CrossProduct((Vector3){ 0.0f, 1.0f, 0.0f }, dir);
    if (Vector3LengthSqr(axis) < 1e-8f) axis = (Vector3){ 1.0f, 0.0f, 0.0f }; // upright
    float angle = RAD2DEG * acosf(Clampf(dir.y, -1.0f, 1.0f));
    // Spin the model about its own handle so the face angle shows.
    G.racketModel.transform = MatrixRotateY(r->yaw);
    DrawModelEx(G.racketModel, r->grip, axis, angle,
                (Vector3){ RACKET_SCALE, RACKET_SCALE, RACKET_SCALE }, WHITE);
}

static void DrawScene(void) {
    // Everything renders into the tiny RES_W x RES_H frame...
    BeginTextureMode(G.target);
    ClearBackground((Color){ 30, 34, 45, 255 });

    BeginMode3D(G.camera);

    // Court surface.
    DrawCube((Vector3){ 0, -0.01f, 0 }, COURT_W, 0.02f, COURT_L, (Color){ 40, 110, 70, 255 });
    // Court boundary + centre line.
    DrawCubeWires((Vector3){ 0, 0.02f, 0 }, COURT_W, 0.02f, COURT_L, RAYWHITE);
    DrawLine3D((Vector3){ -COURT_W * 0.5f, 0.02f, 0 },
               (Vector3){ COURT_W * 0.5f, 0.02f, 0 }, Fade(RAYWHITE, 0.7f));

    // Net.
    DrawCube((Vector3){ 0, NET_H * 0.5f, 0 }, COURT_W, NET_H, 0.06f, Fade(SKYBLUE, 0.35f));
    DrawCubeWires((Vector3){ 0, NET_H * 0.5f, 0 }, COURT_W, NET_H, 0.06f, RAYWHITE);

    // Arena shell, faint so it reads as a boundary without stealing the scene.
    float wallZc = (BACK_Z + PLAYER_Z) * 0.5f;
    float wallZl = PLAYER_Z - BACK_Z;
    DrawCube((Vector3){ WALL_X, CEIL_H * 0.5f, wallZc },
             0.05f, CEIL_H, wallZl, Fade(SKYBLUE, 0.10f));
    DrawCube((Vector3){ -WALL_X, CEIL_H * 0.5f, wallZc },
             0.05f, CEIL_H, wallZl, Fade(SKYBLUE, 0.10f));
    DrawCube((Vector3){ 0, CEIL_H * 0.5f, BACK_Z },
             WALL_X * 2.0f, CEIL_H, 0.05f, Fade(SKYBLUE, 0.10f));
    DrawCubeWires((Vector3){ 0, CEIL_H * 0.5f, wallZc },
                  WALL_X * 2.0f, CEIL_H, wallZl, Fade(RAYWHITE, 0.18f));

    // Balls + shadows. Evil ones wear red.
    for (int i = 0; i < G.ballCount; i++) {
        Vector3 bp = B2R(b3Body_GetPosition(G.balls[i].body));
        Color c = G.balls[i].evil ? (Color){ 230, 40, 40, 255 }
                                  : (Color){ 220, 230, 60, 255 };
        DrawSphere(bp, BALL_R, c);
        DrawCircle3D((Vector3){ bp.x, 0.02f, bp.z }, BALL_R, (Vector3){ 1, 0, 0 },
                     90.0f, Fade(BLACK, 0.35f));
    }

    // The player's racket goes icy while an evil ball has it slowed.
    bool slowed = G.slowTimer > 0.0f;
    DrawRacket(&G.player, slowed ? SKYBLUE : LIME, slowed ? DARKBLUE : GREEN);
    for (int i = 0; i < G.aiCount; i++) {
        DrawRacket(&G.ais[i], RED, MAROON);
    }

    EndMode3D();


    if (G.state == GS_WAITING) {
        const char *msg = "Get ready...";
        DrawText(msg, RES_W / 2 - MeasureText(msg, 20) / 2,
                 RES_H / 2 - 10, 20, RAYWHITE);
    } else if (G.state == GS_PLAYING) {
        DrawLives();

        DrawText(TextFormat("Time: %.1f", G.timeLeft),
                 RES_W - 64, RES_H - 12, 10,
                 G.timeLeft < 4.0f ? RED : RAYWHITE);
        if (G.slowTimer > 0.0f) {
            const char *slow = "SLOWED!";
            DrawText(slow, RES_W / 2 - MeasureText(slow, 20) / 2,
                     RES_H - 40, 20, SKYBLUE);
        }
        int cx = (int)G.cursor.x, cy = (int)G.cursor.y;
        DrawLine(cx - 3, cy, cx + 4, cy, RAYWHITE);
        DrawLine(cx, cy - 3, cx, cy + 4, RAYWHITE);
    } else {
        DrawLives(); // freeze the row so a loss shows the last face going dark
        const char *msg = (G.state == GS_WON) ? "YOU SURVIVED!" : "OUT OF LIVES!";
        Color col = (G.state == GS_WON) ? LIME : RED;
        DrawText(msg, RES_W / 2 - MeasureText(msg, 20) / 2,
                 RES_H / 2 - 10, 20, col);
    }

    EndTextureMode();


    BeginDrawing();
    ClearBackground(BLACK);
    DrawTexturePro(G.target.texture,
                   (Rectangle){ 0, 0, (float)RES_W, -(float)RES_H },
                   (Rectangle){ 0, 0, (float)GetScreenWidth(), (float)GetScreenHeight() },
                   (Vector2){ 0, 0 }, 0.0f, WHITE);
    EndDrawing();
}


static void UpdateDrawFrame(void) {
    if (IsMusicValid(G.music)) UpdateMusicStream(G.music); // feed the stream

    UpdateAimCursor();

    // stuff to stop the browser from rendering at 144hz and beyond
    static float acc = 0.0f;
    acc += GetFrameTime();
    if (acc > 0.25f) acc = 0.25f;

    while (acc >= FIXED_DT) {
        acc -= FIXED_DT;
        switch (G.state) {
            case GS_WAITING: {
                int d = HarnessPollStart();
                if (d >= 0) StartMatch(d);
                break;
            }
            case GS_PLAYING:
                UpdatePlaying(FIXED_DT);
                break;
            default:
                b3World_Step(G.world, FIXED_DT, 4);
                break;
        }
    }
    DrawScene();
}

int main(void) {
    SetConfigFlags(FLAG_WINDOW_RESIZABLE);
    InitWindow(1920, 1080, "Clonk Tennis");
    InitAudioDevice();

    G.music = LoadMusicStream(ASSETS_DIR "/music.mp3");
    G.pongSound = LoadSound(ASSETS_DIR "/mypong.mp3");
    G.pingSound = LoadSound(ASSETS_DIR "/enemyping.mp3");

    G.target = LoadRenderTexture(RES_W, RES_H);
    SetTextureFilter(G.target.texture, TEXTURE_FILTER_POINT);

   //z fighting nonsense
    rlSetClipPlanes(0.5, 100.0);

    InitScene();
    LoadRacketModel();
    LoadLifeIcons();
    G.state = GS_WAITING;


    G.cursor = (Vector2){ RES_W * 0.5f, RES_H * 0.5f };
    DisableCursor();
#if !defined(PLATFORM_WEB)

    if (glfwRawMouseMotionSupported()) {
        glfwSetInputMode(GetWindowHandle(), GLFW_RAW_MOUSE_MOTION, GLFW_FALSE);
    }
#endif

    HarnessInit();
    HarnessReady();


#if defined(PLATFORM_WEB)
    emscripten_set_main_loop(UpdateDrawFrame, 0, 1);
#else
    SetTargetFPS(60);
    while (!WindowShouldClose()) {
        UpdateDrawFrame();
    }
#endif

    b3DestroyWorld(G.world);
    UnloadModel(G.racketModel);
    UnloadTexture(G.lifeTex);
    UnloadTexture(G.lifeTexGray);
    UnloadSound(G.pongSound);
    UnloadSound(G.pingSound);
    UnloadMusicStream(G.music);
    CloseAudioDevice();
    CloseWindow();
    return 0;
}
