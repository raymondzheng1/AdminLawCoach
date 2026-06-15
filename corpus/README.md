# corpus/ — the fixed, curated knowledge base (the ONLY source of substance & citations)

`source/` holds the provided course materials (committed):
- `01_RULES_JR_Hypo_structure.docx` — judicial-review grounds, ratios, answer skeleton (role: rules)
- `02_NOTES_Review.docx` — the detailed review notes: doctrine, cases, pinpoints (role: notes)
- `03_MODEL_CatAct_hypothetical.docx`, `07_MODEL_CatAct_full_HD.docx` — worked hypothetical model answers (role: model)
- `04_MODEL_MeritsReview_answer.docx` — merits-review model answer (role: model)
- `05_MODEL_PartB_essays.docx` — Part-B model essays (role: model)
- `06_RULES_Combined_MR_JR_framework.docx` — merits-review vs judicial-review method (role: rules)

`scripts/build-corpus.mjs` parses these → `corpus/index.json` (chunks + authorities/pinpoints + issue taxonomy), which is the runtime source of truth. Rebuild and re-commit `index.json` whenever `source/` changes. Nothing outside this corpus may ever be cited or asserted by the app.
