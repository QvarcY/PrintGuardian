# Real 3MF compatibility test log

Do not publish private customer files. Record only non-sensitive metadata needed to reproduce compatibility behavior.

| # | Slicer/version | Printer / nozzle | Project shape | Plates | Filaments | Inspect | Values look correct | Supported edit/export | Reopens in Bambu Studio | Reopens in OrcaSlicer | Notes |
| ---: | --- | --- | --- | ---: | ---: | --- | --- | --- | --- | --- | --- |
| 1 |  |  | simple |  |  | PENDING | PENDING | PENDING | PENDING | PENDING |  |
| 2 |  |  | multi-plate |  |  | PENDING | PENDING | PENDING | PENDING | PENDING |  |
| 3 |  |  | multi-filament / AMS |  |  | PENDING | PENDING | PENDING | PENDING | PENDING |  |
| 4 |  |  | simple |  |  | PENDING | PENDING | PENDING | PENDING | PENDING |  |
| 5 |  |  | object-heavy / multi-plate |  |  | PENDING | PENDING | PENDING | PENDING | PENDING |  |
| 6 |  |  | multi-filament |  |  | PENDING | PENDING | PENDING | PENDING | PENDING |  |

## What to check visually

- printer profile and nozzle are read correctly;
- process profile and build plate are plausible;
- filament count, type and profile do not contain obvious leftovers presented as active material;
- Layer height, Wall loops, Sparse infill density, Enable support, Brim width and Max volumetric speed match the slicer project where those values exist;
- attention badges point to the correct tab and remain until the underlying issue is actually resolved;
- manual supported changes show the intended before/after value;
- exported copies never overwrite the source;
- exported copies reopen without slicer repair warnings and preserve objects/plates/filament assignments not intentionally changed.
