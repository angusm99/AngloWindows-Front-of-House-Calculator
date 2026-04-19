# Claude Dashboard Reference Review

The uploaded HTML concept is useful as a **design reference**, but it should not be copied wholesale into the current calculator. Its strongest value is not the general colour palette, because the existing app already uses a dark Anglo-branded system with yellow accents, framed panels, and a dashboard shell. The real value is in a few **workflow-specific patterns** that would improve estimating clarity.

| Decision | Reference idea | Why it is useful or not useful for the current calculator |
|---|---|---|
| Adopt | A persistent **quote meta strip** with quote ID, customer, and live price | This would improve orientation once staff are inside a job. The current app has a strong shell, but a top summary strip inside the workspace would make it easier for reception and estimating staff to see which quote they are editing and the running total at a glance. |
| Adopt | A clear **step grouping** for dimensions, system, opening configuration, colour, and glass | The current calculator already captures similar information, but the Claude concept presents it in a more structured estimator sequence. That is useful for reducing missed inputs. |
| Adopt | A **live pricing panel** that stays visible while configuring | This fits the costing workflow well because users need immediate feedback while changing size or product selections. |
| Adopt later | The **status rail** for stages such as in progress, quoted, sent, and done | This is useful once quote lifecycle tracking is expanded, but it is secondary to extraction, pricing, and quote output. |
| Adopt later | The **tabbed right panel** for cutting list, hardware, quote PDF, and history | This is a strong long-term pattern, especially if the app grows into production handoff, but it is not essential for the current MVP. |
| Defer | The CAD-style **canvas and drawing preview** | Visually strong, but it adds complexity. For the current MVP, the review table and unit builder are more important than a visual drawing stage. |
| Reject for now | The full **three-column dense desktop layout** as the main default | The current app already has a calmer shell, which is better for receptionist use. A dense estimator cockpit would suit production staff later, but it risks making the current workflow feel heavier than necessary. |

The biggest practical takeaway is that the app should borrow the reference's **estimator framing**, not its full interface density. In other words, the current dark branded shell can stay, but the job workspace should gain a stronger internal structure: a quote header, clearer step labels, and a persistent running summary.

A sensible implementation order would be to add a **job header bar** first, then a **sticky quote summary card**, and only later consider advanced items like cutting lists, production handoff tabs, or drawing previews.
