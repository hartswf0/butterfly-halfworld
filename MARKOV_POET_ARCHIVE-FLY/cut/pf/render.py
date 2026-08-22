#!/usr/bin/env python3
"""
THE RESOLVER — a document in, a frame and a ledger out.

    python3 render.py comp.json

There is no interface. That is the test: if a composition can be authored by
writing JSON and nothing else, then an interface is a VIEW over this document,
and the agent and the person have identical power over it (J5). If it cannot,
no interface rescues it.

The resolver does four things and refuses to do a fifth:
    topologically sort the graph          (a cycle is an error, not a fixpoint)
    run each node once, memoised
    collect every Metric into a ledger    (J2)
    print the ignorance map               (J4)

It does not choose parameters, retry, or improve anything. A node that reports
strain 0.7 stays at 0.7 and says so.
"""
import json, sys, os, time
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from doc import Pile, PILES, Metric      # noqa: E402
import ops                               # noqa: E402


def resolve(docpath, quiet=False):
    D = json.load(open(docpath))
    piles = {k: Pile(k, v) for k, v in PILES.items()}
    for k, v in D.get("piles", {}).items():
        piles[k] = Pile(k, v if os.path.isabs(v) else os.path.join(ops.BASE, v))
    nodes = {n["id"]: n for n in D["nodes"]}
    ctx = dict(piles=piles, doc=D)

    order, state = [], {}
    def visit(nid, chain=()):
        if nid in state and state[nid] == "done":
            return
        if nid in chain:
            raise ValueError("cycle: " + " -> ".join(chain + (nid,)))
        if nid not in nodes:
            raise KeyError(f"node '{nid}' referenced but not defined")
        for d in nodes[nid].get("in", []):
            visit(d, chain + (nid,))
        state[nid] = "done"; order.append(nid)
    for nid in nodes:
        visit(nid)

    vals, ledger = {}, []
    for nid in order:
        n = nodes[nid]
        fn = ops.REG.get(n["op"])
        if fn is None:
            raise KeyError(f"{nid}: unknown op '{n['op']}' "
                           f"(have {sorted(ops.REG)})")
        t0 = time.time()
        v, ms = fn([vals[d] for d in n.get("in", [])], n.get("params", {}), ctx)
        vals[nid] = v
        for m in ms:
            ledger.append(dict(node=nid, op=n["op"], ms=round((time.time() - t0) * 1000),
                               **m.as_dict()))
        if not quiet:
            tag = " ".join(f"{m.name}={m.value:.3g}" + ("!" if m.strain > 0 else "")
                           for m in ms)
            print(f"  {nid:<14} {n['op']:<13} {tag}")
    return D, vals, ledger


def ignorance(ledger, D, out=None):
    """J4. Every metric on ONE scale — distance past its own threshold — because
       coverage 0.61 and scar 340 are otherwise incomparable and a map of
       incomparable numbers is decoration."""
    bad = sorted([r for r in ledger if r["strain"] > 0], key=lambda r: -r["strain"])
    print("\n  IGNORANCE MAP" + (" — nothing exceeds its threshold" if not bad else ""))
    for r in bad:
        bar = "#" * min(40, int(r["strain"] * 28) + 1)
        print(f"    {r['node']:<14} {r['name']:<18} {r['value']:<9.4g} "
              f"({r['worse']} > {r['threshold']:g})  {bar} {r['strain']:.2f}")
        if r["note"]:
            print(f"      {' ' * 32}{r['note']}")
    tot = sum(r["strain"] for r in ledger)
    print(f"\n  total strain {tot:.3f} over {len(ledger)} metrics"
          f" · {len(bad)} exceeded")
    if out:
        json.dump(dict(doc=D.get("name"), ledger=ledger, total_strain=tot),
                  open(out, "w"), indent=1)
    return tot


if __name__ == "__main__":
    dp = sys.argv[1]
    print(f"\nPATCHFIELD · {dp}\n")
    D, vals, led = resolve(dp)
    tot = ignorance(led, D, os.path.splitext(dp)[0] + ".ledger.json")
    for nid, v in vals.items():
        if isinstance(v, dict) and v.get("kind") == "FILE":
            print(f"\n  -> {os.path.relpath(v['path'], ops.BASE)}")
