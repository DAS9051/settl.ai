"""
Canadian paycheck deduction calculator.
Rates based on 2025 confirmed figures (indexed for 2026 where noted).
Sources: CRA, provincial revenue agencies.
"""

from __future__ import annotations
from typing import List, Tuple

from schemas import PaycheckDeduction, PaycheckExplanation


# ---------------------------------------------------------------------------
# Type alias: list of (upper_threshold, rate) tuples.
# The last bracket's threshold is ignored — it applies to all remaining income.
# ---------------------------------------------------------------------------
Brackets = List[Tuple[float, float]]

INF = float("inf")


def _tax_from_brackets(taxable: float, brackets: Brackets) -> float:
    """Calculate progressive tax on `taxable` income."""
    if taxable <= 0:
        return 0.0
    tax = 0.0
    prev = 0.0
    for threshold, rate in brackets:
        if taxable <= prev:
            break
        band = min(taxable, threshold) - prev
        tax += band * rate
        prev = threshold
    return tax


# ---------------------------------------------------------------------------
# CPP / QPP
# ---------------------------------------------------------------------------

# 2025 CPP (all provinces except Quebec)
CPP_RATE = 0.0595
CPP_MAX_PENSIONABLE = 71_300.0
CPP_BASIC_EXEMPTION = 3_500.0
CPP_MAX_CONTRIBUTION = (CPP_MAX_PENSIONABLE - CPP_BASIC_EXEMPTION) * CPP_RATE  # 4,034.10

# CPP2 — enhancement on earnings between the 1st and 2nd ceiling
CPP2_RATE = 0.04
CPP2_LOWER = 71_300.0
CPP2_UPPER = 81_900.0
CPP2_MAX = (CPP2_UPPER - CPP2_LOWER) * CPP2_RATE  # 424.00

# 2025 QPP (Quebec)
QPP_RATE = 0.064
QPP_MAX_PENSIONABLE = 71_300.0
QPP_BASIC_EXEMPTION = 3_500.0
QPP_MAX_CONTRIBUTION = (QPP_MAX_PENSIONABLE - QPP_BASIC_EXEMPTION) * QPP_RATE  # 4,339.20

QPP2_RATE = 0.04
QPP2_LOWER = 71_300.0
QPP2_UPPER = 81_900.0
QPP2_MAX = (QPP2_UPPER - QPP2_LOWER) * QPP2_RATE  # 424.00


# ---------------------------------------------------------------------------
# EI
# ---------------------------------------------------------------------------

# 2025 EI (all provinces except Quebec)
EI_RATE = 0.0166
EI_MAX_INSURABLE = 65_700.0
EI_MAX_PREMIUM = EI_MAX_INSURABLE * EI_RATE  # 1,090.62

# 2025 EI — Quebec (reduced because of QPIP)
EI_RATE_QC = 0.0131
EI_MAX_PREMIUM_QC = EI_MAX_INSURABLE * EI_RATE_QC  # 860.67

# 2025 QPIP (Quebec Parental Insurance Plan) — employee
QPIP_RATE = 0.00494
QPIP_MAX_INSURABLE = 98_000.0
QPIP_MAX_PREMIUM = QPIP_MAX_INSURABLE * QPIP_RATE  # 484.12


# ---------------------------------------------------------------------------
# Federal income tax
# ---------------------------------------------------------------------------

FEDERAL_BPA = 16_129.0  # 2025 basic personal amount
FEDERAL_LOWEST_RATE = 0.15

FEDERAL_BRACKETS: Brackets = [
    (57_375,   0.15),
    (114_750,  0.205),
    (158_519,  0.26),
    (220_000,  0.29),
    (INF,      0.33),
]


def _federal_tax(gross: float, cpp: float, ei: float, qpip: float = 0.0) -> float:
    """
    Federal income tax after non-refundable credits:
      - Basic Personal Amount
      - CPP/QPP contributions
      - EI / QPIP premiums
    All converted to credits at the lowest federal rate (15%).
    Quebec residents receive a 16.5% federal abatement.
    """
    gross_tax = _tax_from_brackets(gross, FEDERAL_BRACKETS)
    bpa_credit = FEDERAL_BPA * FEDERAL_LOWEST_RATE
    cpp_credit = cpp * FEDERAL_LOWEST_RATE
    ei_credit = (ei + qpip) * FEDERAL_LOWEST_RATE
    return max(0.0, gross_tax - bpa_credit - cpp_credit - ei_credit)


# ---------------------------------------------------------------------------
# Provincial / territorial data
# (BPA, lowest rate, brackets)
# ---------------------------------------------------------------------------

# Each entry: (bpa, lowest_rate, brackets)
PROVINCIAL: dict[str, tuple[float, float, Brackets]] = {

    "Alberta": (
        21_003.0, 0.10,
        [
            (148_269,  0.10),
            (177_922,  0.12),
            (237_230,  0.13),
            (355_845,  0.14),
            (INF,      0.15),
        ],
    ),

    "British Columbia": (
        11_981.0, 0.0506,
        [
            (45_654,   0.0506),
            (91_310,   0.0770),
            (104_835,  0.105),
            (127_299,  0.1229),
            (172_602,  0.1470),
            (240_716,  0.1680),
            (INF,      0.205),
        ],
    ),

    "Manitoba": (
        15_780.0, 0.108,
        [
            (47_000,   0.108),
            (100_000,  0.1275),
            (INF,      0.174),
        ],
    ),

    "New Brunswick": (
        12_458.0, 0.094,
        [
            (47_715,   0.094),
            (95_431,   0.1482),
            (176_756,  0.1652),
            (INF,      0.195),
        ],
    ),

    "Newfoundland and Labrador": (
        10_818.0, 0.087,
        [
            (43_198,   0.087),
            (86_395,   0.145),
            (154_244,  0.158),
            (215_943,  0.178),
            (275_870,  0.198),
            (551_739,  0.208),
            (INF,      0.213),
        ],
    ),

    "Northwest Territories": (
        16_593.0, 0.059,
        [
            (50_597,   0.059),
            (101_198,  0.086),
            (164_525,  0.122),
            (INF,      0.1405),
        ],
    ),

    "Nova Scotia": (
        8_481.0, 0.0879,
        [
            (29_590,   0.0879),
            (59_180,   0.1495),
            (93_000,   0.1667),
            (150_000,  0.175),
            (INF,      0.21),
        ],
    ),

    "Nunavut": (
        17_925.0, 0.04,
        [
            (53_268,   0.04),
            (106_537,  0.07),
            (173_205,  0.09),
            (INF,      0.115),
        ],
    ),

    "Ontario": (
        11_865.0, 0.0505,
        [
            (51_446,   0.0505),
            (102_894,  0.0915),
            (150_000,  0.1116),
            (220_000,  0.1216),
            (INF,      0.1316),
        ],
    ),

    "Prince Edward Island": (
        12_000.0, 0.0965,
        [
            (32_656,   0.0965),
            (64_313,   0.1363),
            (105_000,  0.1665),
            (140_000,  0.18),
            (INF,      0.1875),
        ],
    ),

    "Quebec": (
        17_183.0, 0.14,
        [
            (51_780,   0.14),
            (103_545,  0.19),
            (126_000,  0.24),
            (INF,      0.2575),
        ],
    ),

    "Saskatchewan": (
        17_661.0, 0.105,
        [
            (49_720,   0.105),
            (142_058,  0.125),
            (INF,      0.145),
        ],
    ),

    "Yukon": (
        15_705.0, 0.064,
        [
            (57_375,   0.064),
            (114_750,  0.09),
            (158_519,  0.109),
            (500_000,  0.128),
            (INF,      0.15),
        ],
    ),
}

# Normalise province name variants to canonical keys
_PROVINCE_ALIASES: dict[str, str] = {
    "ab": "Alberta",
    "alberta": "Alberta",
    "bc": "British Columbia",
    "b.c.": "British Columbia",
    "british columbia": "British Columbia",
    "mb": "Manitoba",
    "manitoba": "Manitoba",
    "nb": "New Brunswick",
    "new brunswick": "New Brunswick",
    "nl": "Newfoundland and Labrador",
    "newfoundland": "Newfoundland and Labrador",
    "newfoundland and labrador": "Newfoundland and Labrador",
    "nt": "Northwest Territories",
    "northwest territories": "Northwest Territories",
    "ns": "Nova Scotia",
    "nova scotia": "Nova Scotia",
    "nu": "Nunavut",
    "nunavut": "Nunavut",
    "on": "Ontario",
    "ontario": "Ontario",
    "pe": "Prince Edward Island",
    "pei": "Prince Edward Island",
    "prince edward island": "Prince Edward Island",
    "qc": "Quebec",
    "quebec": "Quebec",
    "québec": "Quebec",
    "sk": "Saskatchewan",
    "saskatchewan": "Saskatchewan",
    "yt": "Yukon",
    "yukon": "Yukon",
}


def _resolve_province(province: str) -> str:
    key = province.strip().lower()
    return _PROVINCE_ALIASES.get(key, province.strip().title())


# ---------------------------------------------------------------------------
# Main calculation
# ---------------------------------------------------------------------------

def calculate_paycheck(salary: float, province: str) -> PaycheckExplanation:
    province_name = _resolve_province(province)
    is_quebec = province_name == "Quebec"

    # --- CPP / QPP ---
    if is_quebec:
        pensionable = max(0.0, min(salary, QPP_MAX_PENSIONABLE) - QPP_BASIC_EXEMPTION)
        cpp = min(pensionable * QPP_RATE, QPP_MAX_CONTRIBUTION)
        cpp2 = min(max(0.0, salary - QPP2_LOWER), QPP2_UPPER - QPP2_LOWER) * QPP2_RATE
        cpp_name = "QPP Contributions"
        cpp_explanation = (
            f"Quebec Pension Plan — Quebec's equivalent of CPP. "
            f"You contribute {QPP_RATE*100:.2f}% of earnings between "
            f"${QPP_BASIC_EXEMPTION:,.0f} and ${QPP_MAX_PENSIONABLE:,.0f}. "
            "These contributions fund your retirement pension."
        )
    else:
        pensionable = max(0.0, min(salary, CPP_MAX_PENSIONABLE) - CPP_BASIC_EXEMPTION)
        cpp = min(pensionable * CPP_RATE, CPP_MAX_CONTRIBUTION)
        cpp2 = min(max(0.0, salary - CPP2_LOWER), CPP2_UPPER - CPP2_LOWER) * CPP2_RATE
        cpp_name = "CPP Contributions"
        cpp_explanation = (
            f"Canada Pension Plan — {CPP_RATE*100:.2f}% of earnings between "
            f"${CPP_BASIC_EXEMPTION:,.0f} and ${CPP_MAX_PENSIONABLE:,.0f}. "
            "Funds your retirement pension. Your employer matches this amount."
        )

    total_cpp = cpp + cpp2

    # --- EI / QPIP ---
    if is_quebec:
        ei = min(salary * EI_RATE_QC, EI_MAX_PREMIUM_QC)
        qpip = min(salary * QPIP_RATE, QPIP_MAX_PREMIUM)
        ei_name = "EI Premiums"
        ei_explanation = (
            f"Employment Insurance at the Quebec rate ({EI_RATE_QC*100:.2f}%, "
            f"reduced because Quebec has its own parental leave program). "
            "Provides income replacement if you lose your job."
        )
    else:
        ei = min(salary * EI_RATE, EI_MAX_PREMIUM)
        qpip = 0.0
        ei_name = "EI Premiums"
        ei_explanation = (
            f"Employment Insurance — {EI_RATE*100:.2f}% of insurable earnings "
            f"up to ${EI_MAX_INSURABLE:,.0f}. "
            "Provides income support if you become unemployed or take parental leave."
        )

    # --- Federal tax ---
    fed_tax = _federal_tax(salary, total_cpp, ei, qpip)

    # Quebec 16.5% federal abatement (they fund more programs provincially)
    if is_quebec:
        fed_tax = fed_tax * (1 - 0.165)

    fed_explanation = (
        "Federal income tax is progressive — higher earnings are taxed at higher rates "
        f"(15% to 33%). A basic personal amount of ${FEDERAL_BPA:,.0f} is tax-free. "
        "Your CPP/EI contributions also reduce your federal tax via non-refundable credits."
    )

    # --- Provincial tax ---
    prov_data = PROVINCIAL.get(province_name)
    if prov_data:
        prov_bpa, prov_lowest, prov_brackets = prov_data
        prov_gross_tax = _tax_from_brackets(salary, prov_brackets)
        prov_bpa_credit = prov_bpa * prov_lowest
        prov_cpp_credit = total_cpp * prov_lowest
        prov_ei_credit = (ei + qpip) * prov_lowest
        prov_tax = max(0.0, prov_gross_tax - prov_bpa_credit - prov_cpp_credit - prov_ei_credit)

        # Ontario surtax (simplified)
        if province_name == "Ontario":
            if prov_tax > 5_554:
                prov_tax += max(0.0, prov_tax - 5_554) * 0.20
            if prov_tax > 7_108:
                prov_tax += max(0.0, prov_tax - 7_108) * 0.36

        prov_explanation = (
            f"{province_name} provincial income tax (rates {prov_lowest*100:.2f}% to "
            f"{prov_brackets[-1][1]*100:.2f}%). "
            f"A provincial basic personal amount of ${prov_bpa:,.0f} is tax-free."
        )
    else:
        # Fallback: estimate 10% provincial tax
        prov_tax = salary * 0.10
        prov_explanation = f"Estimated {province_name} provincial income tax."

    # --- QPIP line item (Quebec only) ---
    deductions: list[PaycheckDeduction] = []

    deductions.append(PaycheckDeduction(
        name="Federal Income Tax",
        amount=round(fed_tax, 2),
        explanation=fed_explanation,
    ))
    deductions.append(PaycheckDeduction(
        name=f"Provincial Income Tax ({province_name})",
        amount=round(prov_tax, 2),
        explanation=prov_explanation,
    ))
    deductions.append(PaycheckDeduction(
        name=cpp_name,
        amount=round(total_cpp, 2),
        explanation=cpp_explanation,
    ))
    deductions.append(PaycheckDeduction(
        name=ei_name,
        amount=round(ei, 2),
        explanation=ei_explanation,
    ))
    if is_quebec and qpip > 0:
        deductions.append(PaycheckDeduction(
            name="QPIP Premiums",
            amount=round(qpip, 2),
            explanation=(
                f"Quebec Parental Insurance Plan — {QPIP_RATE*100:.3f}% of insurable earnings "
                f"up to ${QPIP_MAX_INSURABLE:,.0f}. "
                "Funds maternity, paternity, and adoption leave benefits in Quebec."
            ),
        ))

    total_deductions = sum(d.amount for d in deductions)
    estimated_net = round(salary - total_deductions, 2)

    monthly_net = round(estimated_net / 12, 2)
    biweekly_net = round(estimated_net / 26, 2)
    effective_rate = (total_deductions / salary * 100) if salary > 0 else 0

    plain_summary = (
        f"On a gross salary of ${salary:,.2f} in {province_name}, your estimated annual "
        f"take-home pay is ${estimated_net:,.2f} — roughly ${monthly_net:,.2f}/month or "
        f"${biweekly_net:,.2f} per paycheque (bi-weekly). "
        f"Your effective total deduction rate is approximately {effective_rate:.1f}%. "
        "Deductions fund your retirement pension, income insurance, and public services — "
        "your employer also pays a separate CPP/EI contribution on your behalf."
    )

    return PaycheckExplanation(
        gross=salary,
        estimated_net=estimated_net,
        deductions=deductions,
        plain_summary=plain_summary,
    )
