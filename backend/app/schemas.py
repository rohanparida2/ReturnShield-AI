from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class Chips(BaseModel):
    height: str = ""
    use_case: str = ""
    usual_size: str = ""
    preference: str = ""


class AnalysisRequest(BaseModel):
    product_id: str
    shopper_context: str = ""
    chips: Chips = Field(default_factory=Chips)


class Reason(BaseModel):
    text: str
    evidence_ids: list[str]


class Theme(BaseModel):
    aspect: Literal["fit", "quality", "listing_accuracy"]
    sentiment: Literal["positive", "mixed", "negative"]
    share: float = Field(ge=0, le=1)


class AnalysisResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    score: int | None = Field(default=None, ge=0, le=100)
    label: Literal["High", "Medium", "Low", "LowData"]
    reasons: list[Reason] = Field(default_factory=list, max_length=3)
    red_flags: list[str] = Field(default_factory=list)
    themes: list[Theme] = Field(default_factory=list)
    swap_needed: bool = False


class Alternative(BaseModel):
    product: dict
    score: int | None
    label: Literal["High", "Medium", "Low", "LowData"]
