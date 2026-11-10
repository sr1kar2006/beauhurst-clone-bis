# Data provenance

> Prototype for client demo. All data shown is sample data. Registries are named as examples; partners are generic placeholders.
> Every timing and depth figure below comes from `src/config/tender.ts` and is a **Sample** until the bid team confirms it.

## Sources

The full list, with licence, QA, known limitations and correction process for each, is in the app at **/data-sources** and in `src/data/sources.ts`.

| Source | Type | Jurisdictions | Datasets |
|---|---|---|---|
| Companies House | Official registry | UK | Company details, officers, PSC, accounts, filings |
| Companies Registration Office | Official registry | Ireland | Company details, officers, accounts, filings |
| SEC EDGAR | Regulatory filings | US | Accounts, filings, officers, ownership |
| Handelsregister, Infogreffe, KVK, Bolagsverket | Official registries | DE, FR, NL, SE | Company details, officers, accounts, filings |
| GLEIF LEI register | Official registry | Global | Entity identity, parent relationships |
| London Stock Exchange RNS | Market data | UK, IE | Regulatory news |
| National business registers via partner (sample) | Third-party partner | 21 other countries | Company details, officers, ownership, accounts |
| Credit reference partner (sample) | Third-party partner | Global | Credit ratings and limits |
| News aggregation partner (sample) | News | Global | News |
| In-house research team | In-house research | Global | Fundraisings, trade, enrichment |

## Historic depth and update frequency

Declared per dataset and country in the coverage matrix (**/data-sources#coverage**). Baseline (UK) sample values:

| Dataset | From | Frequency | Filing to availability |
|---|---|---|---|
| Company details, officers, filings, accounts | 2005 | Daily | 1 to 3 days |
| PSC and ownership | 2016 | Daily | 2 days |
| Credit | 2010 | Weekly | 7 days |
| News | 2012 | Hourly | Same day |
| Fundraisings | 2011 | Daily | 5 days |
| Commodity trade | 2015 | Monthly | 45 days |

`TODO(bid team)`: replace with confirmed values per dataset and jurisdiction and flip `status` to `confirmed` in `tender.ts`.

## Quality assurance

Ingest → validate → match and de-duplicate → enrich → human review → publish. The checks at each step are listed on **/data-sources#qa**. Sample audit rate: 2% of records each week (`TODO(bid team)`).

## Field-level provenance in the product

- Every profile card ends with: source, filed date, available date, last checked.
- Key values (turnover, net assets, directors, shareholdings, credit rating) have an ⓘ popover with the source document, dates and a confidence level (Verified, Estimated or Modelled).
- Every Excel export has a **Sources** sheet; every PDF has a Sources appendix and source footnotes.

## Limitations and corrections

Known limitations by dataset and jurisdiction are listed on **/data-sources#limitations**. Users report errors from any profile (⚠) or **/data-sources#corrections**, and see the status of their reports there (Received, In review, Corrected, Rejected). Target turnaround: 5 working days (Sample). `TODO(bid team)`: confirm the triage roles and escalation path.
