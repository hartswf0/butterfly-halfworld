/* ============================================================================
   THE MESSAGE CANNOT ARRIVE
   the prime composite — six operators, one utterance, in lineage order

   THE LAW. Every sound in this piece descends from ONE synthesised word, by
   operators only. Nothing is added from outside. The diesel, the sonar ping
   and the 120 BPM breath are not "like" the voice — they ARE the voice, put
   through LOCK, INHABIT, ADDRESS, RECURSE, DECAY and SHELTER in the order the
   lineage runs. So when the piece opens the bandwidth late and lets you hear
   what its pulse is made of, that is not a gesture. It is a fact you can check
   by reading this file upward.

   THE SEVEN MOVEMENTS, EACH ONE AN OPERATION

     I    HOME          the utterance, once, dry. A word in a room.
     II   LOCK          a human tempo entrained to a machine one until they
                        are the same tempo and only the man has moved
     III  INHABIT       every surface contaminated by the same compartment
     IV   ADDRESS       the syllable becomes the rhythm section — breath as
                        infrastructure
     V    RECURSE       twelve generations, each made from the last, until the
                        room has replaced the vowel
     VI   DECAY         the surviving loop retrieved until retrieving it is
                        what destroys it
     VII  SHELTER       and when almost nothing human is left, consonance
                        gathers around the fragment without overpowering it

   The reveal sits at the head of VII, not the end: a receiver that works
   perfectly and carries almost nothing is the ending, and an ending has to
   come after its own explanation or it is a punchline.
   ========================================================================= */
import {
  SR, secs, buf, mix, norm, lerp, smooth, clamp, rng, lowpass, highpass,
  LOCK, INHABIT, ADDRESS, RECURSE, DECAY, SHELTER, utter, room,
} from "../ops.mjs";

export const meta = {
  title: "The Message Cannot Arrive",
  seconds: 258,
  tags: "#receiver-without-reply #homesick-machine #channel-eats-message #memory-rot #loop-as-shelter #voice-to-signal",
};

export function compose({ seed = 1959 } = {}) {
  const N = secs(meta.seconds), out = buf(N);
  const rnd = rng(seed);
  const F0 = 132;                       // the voice's own pitch; everything inherits it

  /* ---- THE UTTERANCE. One word. Everything below is made of this. ------- */
  const HOME = utter("home", { f0: F0, seconds: 0.66, seed });

  /* ---- I · HOME — dry, once, in a small honest room -------------------- */
  const parlour = room({ rt60: 0.9, modes: 0.8, damp: 0.35 });
  { const wet = parlour(HOME);
    const one = buf(HOME.length);
    for (let i = 0; i < one.length; i++) one[i] = HOME[i] * 0.9 + wet[i] * 0.35;
    mix(out, one, 0.85, secs(3.5)); }

  /* ---- II · LOCK — the sailor learns to pass time the way the vessel does
     The tune is played at a period that starts human and ends mechanical. The
     machine never bends. Only the man does, and that asymmetry is the song. */
  const period = LOCK({ human: 60 / 63, machine: 60 / 120, over: secs(52) / SR });
  const E2 = 82.407, st = (n) => E2 * Math.pow(2, n / 12);
  const PHRASE = [7, 12, 14, 15, 14, 12, 10, 12, 7, 10, 12, 10, 8, 7, 5, 7];
  {
    /* a guitar: a plucked string is a decaying sum of partials, and a body */
    const pluck = (hz, dur) => {
      const n = secs(dur), s = buf(n);
      for (let i = 0; i < n; i++) {
        const t = i / SR, e = Math.exp(-t * 3.1);
        s[i] = (Math.sin(t * 6.283 * hz) * 0.6
              + Math.sin(t * 6.283 * hz * 2) * 0.22 * Math.exp(-t * 5)
              + Math.sin(t * 6.283 * hz * 3) * 0.10 * Math.exp(-t * 7)) * e;
      }
      for (let i = 0; i < secs(0.004); i++) s[i] *= i / secs(0.004);
      return s;
    };
    let t = 8.0, k = 0;
    while (t < 86) {
      const p = period(t);
      const hz = st(PHRASE[k % PHRASE.length]);
      mix(out, pluck(hz, Math.min(2.2, p * 1.9)), 0.30, secs(t));
      /* and the propeller under him, at the machine period the whole time —
         it was always there; what changes is that he arrives at it */
      t += p; k++;
    }
    /* the propeller: the utterance itself, pitched to the floor, on the beat */
    const engine = buf(secs(0.5));
    for (let i = 0; i < engine.length; i++) {
      const p = clamp(i * 7.4, 0, HOME.length - 2), p0 = Math.floor(p);
      engine[i] = lerp(HOME[p0], HOME[p0 + 1], p - p0);
    }
    lowpass(engine, 130, engine);
    for (let t2 = 6; t2 < 96; t2 += 0.5) {
      const g = 0.30 * smooth(clamp((t2 - 6) / 30, 0, 1));
      mix(out, engine, g, secs(t2));
    }
  }

  /* ---- III · INHABIT — one compartment, and nothing outside it ---------- */
  const hull = INHABIT({ rt60: 0.30, modes: 0.30, air: 2100 });
  {
    const seg = out.subarray(secs(60), secs(96));
    const done = hull(Float32Array.from(seg));
    for (let i = 0; i < seg.length; i++) {
      const u = smooth(clamp((i / seg.length) * 1.6, 0, 1));
      seg[i] = lerp(seg[i], done[i], u);
    }
  }

  /* ---- IV · ADDRESS — the breath becomes the rhythm section ------------- */
  {
    const clock = ADDRESS(HOME, { bpm: 120, seconds: 132, gain: 0.42 });
    /* it is a pulse before it is a word: take the consonants off the ones
       that are only keeping time, and leave every fourth intact */
    const per = secs(0.5);
    for (let b = 0; b * per < clock.length; b++) {
      if (b % 4 === 0) continue;
      const a = b * per, z = Math.min(clock.length, a + HOME.length);
      for (let i = a; i < z; i++) clock[i] *= 0.55;
    }
    lowpass(clock, 900, clock);
    mix(out, clock, 0.5, secs(76));
  }

  /* ---- V · RECURSE — the room replaces the vowel ------------------------ */
  {
    /* twelve generations, and we keep four of them to hear the erasure happen
       rather than to be told about it */
    const { kept } = RECURSE(HOME, {
      generations: 12, rt60: 2.9, modes: 1.0, keep: [0, 3, 7, 11],
    });
    /* A GENERATION IS A STATE, NOT AN EVENT. The first pass mixed each one in
       once — six hundred milliseconds every nine and a half seconds, which is
       ninety-three percent silence, and on the spectrogram the whole middle of
       the piece came out as one unchanging drone. Lucier's effect is not a
       sequence of blips; it is a room ARRIVING. So each generation is repeated
       across its own window until you have stopped hearing it as a sound and
       started hearing it as a condition, and the next generation replaces the
       condition. What you hear change is not the note. It is the room. */
    const WIN = 13.0;
    let t = 96;
    for (const gen of kept) {
      const step = gen.length / SR * 0.72;      // overlapped, so it never re-attacks
      for (let a = t; a < t + WIN; a += step) {
        const u = clamp((a - t) / WIN, 0, 1);
        mix(out, gen, 0.30 * (0.55 + 0.45 * Math.sin(u * Math.PI)), secs(a));
      }
      t += WIN;
    }
  }

  /* ---- VI · DECAY — retrieval is what destroys it ----------------------- */
  {
    /* the loop is the word already eaten by the room: this is generation
       twelve going round, losing something every revolution */
    const { final } = RECURSE(HOME, { generations: 12, rt60: 2.9, modes: 1.0 });
    const seedLoop = buf(secs(2.4));
    for (let r = 0; r < 3; r++) mix(seedLoop, final, 0.8, secs(r * 0.8));
    norm(seedLoop, 0.8);
    const { audio } = DECAY(seedLoop, { revolutions: 26, seed: seed ^ 0x5f, rate: 1.35 });
    mix(out, audio, 0.46, secs(148));
  }

  /* ---- VII · SHELTER — and the reveal, before the ending ---------------- */
  {
    /* THE REVEAL. For nine seconds the bandwidth opens and the pulse is
       audibly the word. Not a new sound — the same clock, unfiltered. */
    const clear = ADDRESS(HOME, { bpm: 120, seconds: 9, gain: 0.62 });
    mix(out, clear, 0.85, secs(206));

    /* then it closes again, and the strings arrive around what is left */
    const bed = SHELTER(null, { root: F0 / 2, seconds: 46, arrive: 0.18, ceiling: 0.30, seed });
    mix(out, bed, 0.9, secs(212));

    /* a receiver that works perfectly and carries almost nothing */
    const ping = buf(secs(0.5));
    for (let i = 0; i < ping.length; i++) {
      const p = clamp(i * 1.32, 0, HOME.length - 2), p0 = Math.floor(p);
      ping[i] = lerp(HOME[p0], HOME[p0 + 1], p - p0);
    }
    lowpass(ping, 420, ping);
    for (let t = 212; t < meta.seconds - 2; t += 0.5) {
      const u = clamp((t - 212) / (meta.seconds - 214), 0, 1);
      mix(out, ping, 0.34 * (1 - u * 0.45), secs(t));
    }
  }

  /* ---- the master: one descent, and a hard limit ------------------------ */
  {
    let z = 0;
    for (let i = 0; i < N; i++) {
      const u = i / N;
      let v = out[i] * lerp(1.0, 0.62, smooth(clamp((u - 0.2) / 0.8, 0, 1)));
      const cut = lerp(14000, 1500, smooth(clamp(u * 1.05, 0, 1)));
      const a = 1 - Math.exp(-2 * Math.PI * cut / SR);
      z += a * (v - z);
      out[i] = Math.tanh(z * 1.15) * 0.88;
    }
    const fi = secs(2.5), fo = secs(11);
    for (let i = 0; i < fi; i++) out[i] *= smooth(i / fi);
    for (let i = 0; i < fo; i++) out[N - 1 - i] *= smooth(i / fo);
  }
  return out;
}
