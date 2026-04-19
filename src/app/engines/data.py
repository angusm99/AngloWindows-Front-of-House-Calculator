from app.domain import EngineType

DEFAULT_MARKUP_RATE = 0.20

SYSTEM_GROUPS = [
    {
        "id": "casement",
        "name": "Casement",
        "description": "45 degree mitred aluminium window systems.",
        "systems": [
            {"id": "30.5", "name": "30.5mm", "engine_type": EngineType.ENGINE_MITRE, "description": "Standard 30.5mm casement frames."},
            {"id": "38", "name": "38mm", "engine_type": EngineType.ENGINE_MITRE, "description": "Heavier 38mm casement suite."},
            {"id": "baobab", "name": "Baobab", "engine_type": EngineType.ENGINE_MITRE, "description": "Baobab performance casement suite."},
        ],
    },
    {
        "id": "sliding_window",
        "name": "Sliding Window",
        "description": "Light sliding window systems with shared overlap logic.",
        "systems": [
            {"id": "elite", "name": "Elite", "engine_type": EngineType.ENGINE_SLIDER_LIGHT, "description": "Elite light-duty sliding window."},
            {"id": "knysna", "name": "Knysna", "engine_type": EngineType.ENGINE_SLIDER_LIGHT, "description": "Knysna light-duty sliding window."},
        ],
    },
    {
        "id": "sliding_door_domestic",
        "name": "Sliding Door Domestic",
        "description": "Domestic slider suites with standard overlap deductions.",
        "systems": [
            {"id": "patio", "name": "Patio", "engine_type": EngineType.ENGINE_SLIDER_DOM, "description": "Patio domestic sliding door."},
        ],
    },
    {
        "id": "sliding_door_hd",
        "name": "Sliding Door HD",
        "description": "Heavy-duty sliding doors with shared Clip 44 stiles.",
        "systems": [
            {"id": "palace", "name": "Palace", "engine_type": EngineType.ENGINE_SLIDER_HEAVY, "description": "Palace heavy-duty slider."},
            {"id": "valencia", "name": "Valencia", "engine_type": EngineType.ENGINE_SLIDER_HEAVY, "description": "Valencia heavy-duty slider."},
        ],
    },
    {
        "id": "sliding_folding",
        "name": "Sliding Folding",
        "description": "Leaf-count based sash costing for folding systems.",
        "systems": [
            {"id": "vistafold", "name": "Vistafold", "engine_type": EngineType.ENGINE_LEAF_COUNT, "description": "Multi-leaf sliding folding door."},
        ],
    },
    {
        "id": "shopfront",
        "name": "Shopfront",
        "description": "Commercial shopfront framing with hinged door options.",
        "systems": [
            {"id": "shopfront", "name": "Shopfront", "engine_type": EngineType.ENGINE_SHOPFRONT, "description": "Clip 44 fixed and hinged shopfront system."},
        ],
    },
    {
        "id": "frameless_folding",
        "name": "Frameless Folding",
        "description": "Frameless folding panels priced by leaf area.",
        "systems": [
            {"id": "frameless_folding", "name": "Frameless Folding", "engine_type": EngineType.ENGINE_LEAF, "description": "Frameless folding panel system."},
        ],
    },
    {
        "id": "frameless_balustrade",
        "name": "Frameless Balustrade",
        "description": "Linear metre balustrade pricing.",
        "systems": [
            {"id": "crystal_view", "name": "Crystal View", "engine_type": EngineType.ENGINE_LINEAR, "description": "Crystal View frameless balustrade."},
        ],
    },
]

SYSTEM_RULES = {
    ("casement", "30.5mm"): {"engine_type": EngineType.ENGINE_MITRE, "material_rate": 185.0, "mitre_deduction_mm": 120.0, "material_code": "SF30501", "base_description": "30.5mm mitred frame"},
    ("casement", "38mm"): {"engine_type": EngineType.ENGINE_MITRE, "material_rate": 205.0, "mitre_deduction_mm": 130.0, "material_code": "SF38001", "base_description": "38mm mitred frame"},
    ("casement", "Baobab"): {"engine_type": EngineType.ENGINE_MITRE, "material_rate": 228.0, "mitre_deduction_mm": 145.0, "material_code": "BAO1001", "base_description": "Baobab mitred frame"},
    ("sliding_window", "Elite"): {"engine_type": EngineType.ENGINE_SLIDER_LIGHT, "material_rate": 172.0, "overlap_deduction_mm": 38.0, "material_code": "ELI2001", "base_description": "Elite sliding rails"},
    ("sliding_window", "Knysna"): {"engine_type": EngineType.ENGINE_SLIDER_LIGHT, "material_rate": 179.0, "overlap_deduction_mm": 42.0, "material_code": "KNY2001", "base_description": "Knysna sliding rails"},
    ("sliding_door_domestic", "Patio"): {"engine_type": EngineType.ENGINE_SLIDER_DOM, "material_rate": 245.0, "overlap_deduction_mm": 65.0, "material_code": "PAT3001", "base_description": "Patio sliding rails"},
    ("sliding_door_hd", "Palace"): {"engine_type": EngineType.ENGINE_SLIDER_HEAVY, "material_rate": 315.0, "overlap_deduction_mm": 82.0, "clip_stile_rate": 118.0, "material_code": "PAL4001", "base_description": "Palace HD sliding rails"},
    ("sliding_door_hd", "Valencia"): {"engine_type": EngineType.ENGINE_SLIDER_HEAVY, "material_rate": 328.0, "overlap_deduction_mm": 88.0, "clip_stile_rate": 124.0, "material_code": "VAL4001", "base_description": "Valencia HD sliding rails"},
    ("sliding_folding", "Vistafold"): {"engine_type": EngineType.ENGINE_LEAF_COUNT, "sash_component_rate": 540.0, "frame_rate": 190.0, "material_code": "VIS5001", "base_description": "Vistafold sash set"},
    ("shopfront", "Shopfront"): {"engine_type": EngineType.ENGINE_SHOPFRONT, "frame_rate": 225.0, "door_rate": 3200.0, "material_code": "CLP4401", "base_description": "Clip 44 shopfront frame"},
    ("frameless_folding", "Frameless Folding"): {"engine_type": EngineType.ENGINE_LEAF, "glass_area_rate": 890.0, "panel_deduction_mm": 16.0, "material_code": "FRM6001", "base_description": "Frameless folding glass panel"},
    ("frameless_balustrade", "Crystal View"): {"engine_type": EngineType.ENGINE_LINEAR, "linear_rate": 1850.0, "material_code": "CRY7001", "base_description": "Crystal View balustrade run"},
}

GLASS_OPTIONS = [
    {"code": "4mm clear", "description": "4mm Clear", "safety": False},
    {"code": "6mm clear", "description": "6mm Clear", "safety": False},
    {"code": "laminated", "description": "Laminated Safety Glass", "safety": True},
    {"code": "dgu", "description": "Double-Glazed Unit", "safety": True},
    {"code": "tinted", "description": "Tinted Glass", "safety": False},
    {"code": "obscured", "description": "Obscured Glass", "safety": False},
]

GLASS_MULTIPLIERS = {
    "4mm clear": 1.00,
    "6mm clear": 1.04,
    "laminated": 1.18,
    "dgu": 1.32,
    "tinted": 1.12,
    "obscured": 1.10,
}

FRAME_COLOUR_MULTIPLIERS = {
    "white": 1.00,
    "black": 1.08,
    "bronze": 1.10,
    "anodised": 1.12,
    "charcoal": 1.09,
    "custom": 1.18,
}

HARDWARE_COLOUR_MULTIPLIERS = {
    "standard": 1.00,
    "black": 1.05,
    "stainless": 1.09,
    "premium": 1.14,
}

FRAME_COLOUR_OPTIONS = [
    {"value": "white", "label": "White"},
    {"value": "black", "label": "Black"},
    {"value": "bronze", "label": "Bronze"},
    {"value": "anodised", "label": "Anodised"},
    {"value": "charcoal", "label": "Charcoal"},
    {"value": "custom", "label": "Custom"},
]

HARDWARE_COLOUR_OPTIONS = [
    {"value": "standard", "label": "Standard"},
    {"value": "black", "label": "Black"},
    {"value": "stainless", "label": "Stainless"},
    {"value": "premium", "label": "Premium"},
]

HINGE_TYPE_OPTIONS = [
    {"value": "top_hung", "label": "Top-hung"},
    {"value": "side_hung", "label": "Side-hung"},
    {"value": "fixed", "label": "Fixed"},
]

PANEL_COUNT_OPTIONS = [
    {"value": "2", "label": "2 Panels"},
    {"value": "3", "label": "3 Panels"},
    {"value": "4", "label": "4 Panels"},
    {"value": "6", "label": "6 Panels"},
]

DOOR_TYPE_OPTIONS = [
    {"value": "single_hinged", "label": "Single Hinged"},
    {"value": "double_hinged", "label": "Double Hinged"},
    {"value": "stable", "label": "Stable Door"},
    {"value": "pivot", "label": "Pivot"},
]

LEAF_COUNT_OPTIONS = [
    {"value": "3", "label": "3 Leaves"},
    {"value": "4", "label": "4 Leaves"},
    {"value": "5", "label": "5 Leaves"},
    {"value": "6", "label": "6 Leaves"},
    {"value": "7", "label": "7 Leaves"},
    {"value": "8", "label": "8 Leaves"},
]

CODE_PREFIX_TO_GROUP = {
    "W": "casement",
    "SW": "sliding_window",
    "SD": "sliding_door_domestic",
    "HD": "sliding_door_hd",
    "SF": "shopfront",
    "FF": "frameless_folding",
    "FB": "frameless_balustrade",
}
